-- "Our work" photo gallery for each division page (e.g. footwear made).
-- Photos are public website images in the media bucket under gallery/.
create table public.gallery_photos (
  id           uuid primary key default gen_random_uuid(),
  branch       text not null check (branch in ('home', 'tech', 'wear', 'ziva', 'media', 'books', 'ministry')),
  storage_path text not null unique check (storage_path ~ '^gallery/[0-9a-f-]{36}\.webp$'),
  width        int,
  height       int,
  caption      text not null default '' check (char_length(caption) <= 300),
  sort_order   int not null default 0,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now()
);

create index gallery_photos_branch_idx on public.gallery_photos (branch, sort_order, created_at desc);

alter table public.gallery_photos enable row level security;

grant select on public.gallery_photos to anon, authenticated;
grant insert, update, delete on public.gallery_photos to authenticated;

create policy "visitors read gallery" on public.gallery_photos for select to anon using (true);
create policy "signed-in read gallery" on public.gallery_photos for select to authenticated using (true);
create policy "admins add gallery photos" on public.gallery_photos for insert to authenticated with check (public.is_admin());
create policy "admins edit gallery photos" on public.gallery_photos for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins remove gallery photos" on public.gallery_photos for delete to authenticated using (public.is_admin());
