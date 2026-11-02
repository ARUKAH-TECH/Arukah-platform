-- Online Programmes, step 1: programmes managed in Admin.
-- Public pages can read published programmes (never drafts). The joining
-- link and instructions live in programme_private, which only admins can
-- read; participants will reach them later only through a server-checked
-- secret code (step 3).

create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 3 and 140),
  summary text not null default '' check (char_length(summary) <= 300),
  description text not null default '' check (char_length(description) <= 6000),
  category text not null default '' check (char_length(category) <= 60),
  image_path text check (image_path is null or image_path ~ '^programmes/[0-9a-f-]{36}\.webp$'),
  image_width int,
  image_height int,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  time_zone text not null default 'Africa/Accra' check (char_length(time_zone) <= 60),
  -- A repeating programme (e.g. "Every Saturday") shows this instead of one date.
  schedule_note text not null default '' check (char_length(schedule_note) <= 120),
  reg_opens_at timestamptz,
  reg_closes_at timestamptz,
  capacity int check (capacity is null or capacity between 1 and 100000),
  price_ghs numeric(12, 2) not null default 0 check (price_ghs >= 0),
  approval text not null default 'auto' check (approval in ('auto', 'manual')),
  status text not null default 'draft' check (status in ('draft', 'published', 'closed', 'completed', 'cancelled')),
  platform text not null default 'zoom' check (platform in ('zoom', 'google_meet', 'teams', 'other')),
  platform_name text not null default '' check (char_length(platform_name) <= 60),
  -- Codes stop working this many hours after the programme ends.
  code_valid_hours int not null default 24 check (code_valid_hours between 0 and 8760),
  -- true = a code shows the joining details once only.
  code_single_use boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (reg_closes_at is null or reg_opens_at is null or reg_closes_at > reg_opens_at),
  check (platform <> 'other' or platform_name <> '')
);
create index if not exists programmes_status_start on public.programmes (status, starts_at);

create table if not exists public.programme_private (
  programme_id uuid primary key references public.programmes (id) on delete cascade,
  join_link text check (join_link is null or (char_length(join_link) <= 500 and join_link ~ '^https://')),
  join_instructions text not null default '' check (char_length(join_instructions) <= 3000),
  updated_at timestamptz not null default now()
);

alter table public.programmes enable row level security;
alter table public.programme_private enable row level security;
revoke all on public.programmes, public.programme_private from anon, authenticated;

-- Everyone: programmes that are not drafts.
grant select on public.programmes to anon, authenticated;
-- (Visitors can't call is_admin(), so they get their own policy.)
create policy "public reads published programmes" on public.programmes for select to anon using (status <> 'draft');
create policy "signed-in read programmes" on public.programmes for select to authenticated using (status <> 'draft' or public.is_admin());

-- Admin: everything.
grant insert, update, delete on public.programmes to authenticated;
create policy "admins add programmes" on public.programmes for insert to authenticated with check (public.is_admin());
create policy "admins change programmes" on public.programmes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete programmes" on public.programmes for delete to authenticated using (public.is_admin());

grant select, insert, update, delete on public.programme_private to authenticated;
create policy "admins manage joining details" on public.programme_private for all to authenticated using (public.is_admin()) with check (public.is_admin());
