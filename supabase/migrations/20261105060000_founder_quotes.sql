-- The founder's own quotes, shared as pictures with his photo and name
-- (quote of the day + "Share picture"). Additive only.
create table if not exists public.founder_quotes (
  id         uuid primary key default gen_random_uuid(),
  text       text not null check (char_length(text) between 5 and 320),
  status     text not null default 'published' check (status in ('published', 'draft')),
  created_at timestamptz not null default now()
);

-- Photos of the founder used on those pictures (files in the public "media" bucket).
create table if not exists public.founder_photos (
  id           uuid primary key default gen_random_uuid(),
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}\.(jpg|png|webp)$'),
  hidden       boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.founder_quotes enable row level security;
alter table public.founder_photos enable row level security;

grant select on public.founder_quotes, public.founder_photos to anon, authenticated;
grant insert, update, delete on public.founder_quotes, public.founder_photos to authenticated;
grant select on public.founder_quotes, public.founder_photos to service_role;

create policy "visitors read published quotes" on public.founder_quotes for select to anon using (status = 'published');
create policy "signed-in read quotes" on public.founder_quotes for select to authenticated using (status = 'published' or public.is_admin());
create policy "admins add quotes" on public.founder_quotes for insert to authenticated with check (public.is_admin());
create policy "admins edit quotes" on public.founder_quotes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove quotes" on public.founder_quotes for delete to authenticated using (public.is_admin());

create policy "visitors read photos" on public.founder_photos for select to anon using (not hidden);
create policy "signed-in read photos" on public.founder_photos for select to authenticated using (not hidden or public.is_admin());
create policy "admins add photos" on public.founder_photos for insert to authenticated with check (public.is_admin());
create policy "admins edit photos" on public.founder_photos for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove photos" on public.founder_photos for delete to authenticated using (public.is_admin());
