-- Simple Paystack payments with NO customer details on our side: the visitor
-- only picks a book + quantity (or a gift amount) and pays on Paystack's page.
-- Only our server writes here (service key), after Paystack confirms.

create table public.quick_payments (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique check (reference ~ '^ZS-[A-Z0-9]{10}$'),
  kind                    text not null check (kind in ('book', 'gift')),
  book_id                 uuid references public.books (id) on delete set null,
  book_title              text not null default '' check (char_length(book_title) <= 300),
  book_format             text check (book_format is null or book_format in ('read', 'download', 'print')),
  quantity                int check (quantity is null or quantity between 1 and 50),
  outreach_id             uuid references public.outreaches (id) on delete set null,
  outreach_title          text not null default '' check (char_length(outreach_title) <= 300),
  amount_ghs              numeric(12, 2) not null check (amount_ghs >= 1 and amount_ghs <= 100000),
  status                  text not null default 'pending'
                            check (status in ('pending', 'success', 'failed', 'abandoned')),
  paystack_transaction_id bigint,
  channel                 text not null default '' check (char_length(channel) <= 40),
  paid_at                 timestamptz,
  delivered               boolean not null default false,
  admin_note              text not null default '' check (char_length(admin_note) <= 1000),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (kind <> 'book' or (book_title <> '' and book_format is not null and quantity is not null))
);

create index quick_payments_created_idx on public.quick_payments (created_at desc);

alter table public.quick_payments enable row level security;

grant select on public.quick_payments to authenticated;
grant update (delivered, admin_note, updated_at) on public.quick_payments to authenticated;
create policy "admins read quick payments" on public.quick_payments for select to authenticated using (public.is_admin());
create policy "admins update quick payments" on public.quick_payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update on public.quick_payments to service_role;

-- Spam guard: at most N new payment attempts per hour in total.
create function public.enforce_total_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  total int;
begin
  execute format('select count(*) from %I.%I where created_at > now() - interval ''1 hour''', tg_table_schema, tg_table_name)
  into total;
  if total >= tg_argv[0]::int then
    raise exception 'We are receiving a lot of requests right now. Please try again in a little while.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_total_rate_limit() from public, anon, authenticated;

create trigger quick_payments_rate_limit before insert on public.quick_payments
  for each row execute function public.enforce_total_rate_limit('150');
