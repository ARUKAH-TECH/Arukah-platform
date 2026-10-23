-- Phase 8 step 2: book orders (paid by MoMo/bank and recorded by the admin
-- until online payments arrive).
--
-- Visitors place orders ONLY through place_book_order(), which:
--   * takes prices from the books table (published books only) — the
--     browser never decides a price;
--   * applies the promotion: 10% off when more than three books are ordered;
--   * stores the order and its lines in one go and returns an order number.
-- Visitors can't read, change or delete any order. Admins manage them.

create table public.book_orders (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique check (reference ~ '^ZB-[A-Z0-9]{6}$'),
  customer_name     text not null check (char_length(customer_name) between 1 and 150),
  phone             text not null default '' check (char_length(phone) <= 40),
  email             text not null default '' check (char_length(email) <= 200),
  fulfilment        text not null check (fulfilment in ('delivery', 'collection', 'digital')),
  address           text not null default '' check (char_length(address) <= 500),
  customer_note     text not null default '' check (char_length(customer_note) <= 1000),
  item_count        int not null check (item_count between 1 and 100),
  subtotal_ghs      numeric(12, 2) not null check (subtotal_ghs >= 0),
  discount_ghs      numeric(12, 2) not null default 0 check (discount_ghs >= 0),
  total_ghs         numeric(12, 2) not null check (total_ghs >= 0),
  delivery_fee_ghs  numeric(12, 2) not null default 0 check (delivery_fee_ghs >= 0),
  status            text not null default 'new'
                      check (status in ('new', 'paid', 'printing', 'ready', 'shipped', 'delivered', 'cancelled')),
  payment_status    text not null default 'unpaid' check (payment_status in ('unpaid', 'part', 'full')),
  amount_paid_ghs   numeric(12, 2) check (amount_paid_ghs is null or amount_paid_ghs >= 0),
  payment_reference text not null default '' check (char_length(payment_reference) <= 200),
  admin_note        text not null default '' check (char_length(admin_note) <= 2000),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (phone <> '' or email <> ''),
  check (fulfilment <> 'delivery' or address <> '')
);

create table public.book_order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.book_orders (id) on delete cascade,
  book_id        uuid references public.books (id) on delete set null,
  book_title     text not null,
  format         text not null check (format in ('read', 'download', 'print')),
  quantity       int not null check (quantity between 1 and 50),
  unit_price_ghs numeric(10, 2) not null check (unit_price_ghs >= 0),
  line_total_ghs numeric(12, 2) not null check (line_total_ghs >= 0)
);

create index book_order_items_order_idx on public.book_order_items (order_id);
create index book_orders_status_idx on public.book_orders (status, created_at desc);

alter table public.book_orders enable row level security;
alter table public.book_order_items enable row level security;

-- No visitor grants at all: orders are created only by place_book_order().
grant select, update, delete on public.book_orders to authenticated;
grant select on public.book_order_items to authenticated;

create policy "admins read orders" on public.book_orders for select to authenticated using (public.is_admin());
create policy "admins manage orders" on public.book_orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins delete orders" on public.book_orders for delete to authenticated using (public.is_admin());
create policy "admins read order items" on public.book_order_items for select to authenticated using (public.is_admin());

-- items: [{"book_id": "<uuid>", "format": "read|download|print", "quantity": 1}, ...]
create function public.place_book_order(
  customer_name text,
  phone text,
  email text,
  fulfilment text,
  address text,
  customer_note text,
  items jsonb
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  item jsonb;
  book record;
  qty int;
  unit numeric(10, 2);
  order_id uuid;
  ref text;
  lines int := 0;
  count_total int := 0;
  subtotal numeric(12, 2) := 0;
  discount numeric(12, 2) := 0;
  has_print boolean := false;
  chosen_fulfilment text := fulfilment;
begin
  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Your basket is empty.';
  end if;
  if jsonb_array_length(items) > 30 then
    raise exception 'Too many different books in one order.';
  end if;

  -- First pass: validate every line and work out the totals.
  for item in select * from jsonb_array_elements(items) loop
    qty := coalesce((item ->> 'quantity')::int, 0);
    if qty < 1 or qty > 50 then raise exception 'Choose a quantity between 1 and 50.'; end if;
    select b.id, b.title, b.price_read_ghs, b.price_download_ghs, b.price_print_ghs into book
      from public.books b where b.id = (item ->> 'book_id')::uuid and b.status = 'published';
    if not found then raise exception 'A book in your basket is no longer available.'; end if;
    unit := case item ->> 'format'
      when 'read' then book.price_read_ghs
      when 'download' then book.price_download_ghs
      when 'print' then book.price_print_ghs
    end;
    if unit is null then raise exception '% is not available in that format.', book.title; end if;
    if item ->> 'format' = 'print' then has_print := true; end if;
    subtotal := subtotal + unit * qty;
    count_total := count_total + qty;
  end loop;

  -- Promotion from the plan: 10% off when more than three books are ordered.
  if count_total > 3 then
    discount := round(subtotal * 0.10, 2);
  end if;

  if not has_print then
    chosen_fulfilment := 'digital';
  elsif chosen_fulfilment not in ('delivery', 'collection') then
    raise exception 'Choose delivery or collection for printed copies.';
  end if;

  -- A short order number like ZB-7K3Q9P (retried if it ever clashes).
  loop
    ref := 'ZB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.book_orders o where o.reference = ref);
  end loop;

  insert into public.book_orders (reference, customer_name, phone, email, fulfilment, address, customer_note,
                                  item_count, subtotal_ghs, discount_ghs, total_ghs)
  values (ref, trim(customer_name), trim(coalesce(phone, '')), trim(coalesce(email, '')), chosen_fulfilment,
          case when chosen_fulfilment = 'delivery' then trim(coalesce(address, '')) else '' end,
          trim(coalesce(customer_note, '')), count_total, subtotal, discount, subtotal - discount)
  returning id into order_id;

  -- Second pass: store the lines with the prices used.
  for item in select * from jsonb_array_elements(items) loop
    qty := (item ->> 'quantity')::int;
    select b.id, b.title, b.price_read_ghs, b.price_download_ghs, b.price_print_ghs into book
      from public.books b where b.id = (item ->> 'book_id')::uuid;
    unit := case item ->> 'format'
      when 'read' then book.price_read_ghs
      when 'download' then book.price_download_ghs
      when 'print' then book.price_print_ghs
    end;
    insert into public.book_order_items (order_id, book_id, book_title, format, quantity, unit_price_ghs, line_total_ghs)
    values (order_id, book.id, book.title, item ->> 'format', qty, unit, unit * qty);
    lines := lines + 1;
  end loop;

  return ref;
end;
$$;

revoke execute on function public.place_book_order(text, text, text, text, text, text, jsonb) from public;
grant execute on function public.place_book_order(text, text, text, text, text, text, jsonb) to anon, authenticated;
