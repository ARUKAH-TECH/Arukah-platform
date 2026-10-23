-- Phase 4 (d): editable page text.
--
-- One row per public page. `content` holds only the fields the admin has
-- edited; every other field falls back to the original wording kept in the
-- code (src/config/pages/), so an empty table means the site looks exactly
-- as it did before this feature existed.

create table public.page_content (
  page        text primary key check (page ~ '^[a-z][a-z0-9-]{0,39}$'),
  content     jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  updated_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.page_content enable row level security;

-- Page text is public by nature: visitors read every row.
grant select on public.page_content to anon, authenticated;
grant insert, update, delete on public.page_content to authenticated;

create policy "everyone reads page text"
  on public.page_content for select
  to anon, authenticated
  using (true);

create policy "admins insert page text"
  on public.page_content for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update page text"
  on public.page_content for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins reset page text"
  on public.page_content for delete
  to authenticated
  using (public.is_admin());
