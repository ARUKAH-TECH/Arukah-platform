-- Online payments through Paystack (book orders and outreach support).
-- Rows are written ONLY by our server with the service key, after it has
-- asked Paystack directly whether the money arrived. Visitors get no access;
-- admins can read.

create table public.payments (
  id                      uuid primary key default gen_random_uuid(),
  reference               text not null unique check (reference ~ '^ZP-[A-Z0-9]{10}$'),
  purpose                 text not null check (purpose in ('book_order', 'outreach_support')),
  book_order_id           uuid references public.book_orders (id) on delete set null,
  outreach_id             uuid references public.outreaches (id) on delete set null,
  payer_name              text not null default '' check (char_length(payer_name) <= 150),
  email                   text not null check (char_length(email) between 3 and 200),
  phone                   text not null default '' check (char_length(phone) <= 40),
  message                 text not null default '' check (char_length(message) <= 1000),
  amount_ghs              numeric(12, 2) not null check (amount_ghs >= 1 and amount_ghs <= 100000),
  status                  text not null default 'pending'
                            check (status in ('pending', 'success', 'failed', 'abandoned')),
  paystack_transaction_id bigint,
  channel                 text not null default '' check (char_length(channel) <= 40),
  paid_at                 timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  check (purpose <> 'book_order' or book_order_id is not null)
);

create index payments_created_idx on public.payments (created_at desc);
create index payments_book_order_idx on public.payments (book_order_id);

alter table public.payments enable row level security;

grant select on public.payments to authenticated;
create policy "admins read payments" on public.payments for select to authenticated using (public.is_admin());

-- Same spam limits as the other public forms.
create trigger payments_rate_limit before insert on public.payments
  for each row execute function public.enforce_form_rate_limit('10', '60');

-- Our server writes payments with the service key.
grant select, insert, update on public.payments to service_role;

-- Defence in depth: visitors and signed-in users never need TRUNCATE
-- (it ignores Row Level Security). The API can't issue it, but remove it anyway.
revoke truncate on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke truncate on tables from anon, authenticated;

-- The payment server code reads an order's total and marks it paid; nothing more.
grant select (id, reference, customer_name, phone, email, total_ghs, delivery_fee_ghs, status, payment_status, amount_paid_ghs)
  on public.book_orders to service_role;
grant update (status, payment_status, amount_paid_ghs, payment_reference, updated_at)
  on public.book_orders to service_role;
