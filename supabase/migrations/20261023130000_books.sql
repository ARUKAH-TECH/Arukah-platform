-- Phase 8 step 1: ZIVARUKAH BOOKS catalogue.
--
-- Each book can be offered in up to three formats, each with its own price
-- in GHS: read online, digital download, printed copy. A NULL price means
-- that format isn't offered. Visitors see published books only.
-- (Buying happens in step 2 — order requests — until online payments.)

create table public.books (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title            text not null check (char_length(title) between 1 and 200),
  author           text not null default '' check (char_length(author) <= 150),
  description      text not null default '' check (char_length(description) <= 10000),
  sample_text      text not null default '' check (char_length(sample_text) <= 20000),
  cover_path       text check (cover_path is null or cover_path ~ '^books/[0-9a-f-]{36}\.webp$'),
  cover_width      int,
  cover_height     int,
  price_read_ghs     numeric(10, 2) check (price_read_ghs is null or price_read_ghs >= 0),
  price_download_ghs numeric(10, 2) check (price_download_ghs is null or price_download_ghs >= 0),
  price_print_ghs    numeric(10, 2) check (price_print_ghs is null or price_print_ghs >= 0),
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order       int not null default 0,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.books enable row level security;

grant select on public.books to anon, authenticated;
grant insert, update, delete on public.books to authenticated;

create policy "visitors read published books"
  on public.books for select
  to anon
  using (status = 'published');

create policy "signed-in users read published books, admins read all"
  on public.books for select
  to authenticated
  using (status = 'published' or public.is_admin());

create policy "admins add books"
  on public.books for insert
  to authenticated
  with check (public.is_admin());

create policy "admins edit books"
  on public.books for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete books"
  on public.books for delete
  to authenticated
  using (public.is_admin());

create index books_listing_idx on public.books (status, sort_order, created_at desc);
