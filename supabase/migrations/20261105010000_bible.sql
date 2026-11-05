-- Repent Online Ministries Bible app (zivarukah.com/bible).
-- The KJV text itself lives in the website code (src/data/kjv). These tables
-- hold what the ministry writes: daily devotionals and Bible study series with
-- quizzes. Visitors read only published items (a devotional only from its own
-- day, so the admin can write ahead). Only verified admins can write.

create table public.bible_devotionals (
  id         uuid primary key default gen_random_uuid(),
  day        date not null unique,
  title      text not null check (char_length(title) between 1 and 160),
  verse_ref  text not null default '' check (char_length(verse_ref) <= 80),
  body       text not null default '' check (char_length(body) <= 20000),
  prayer     text not null default '' check (char_length(prayer) <= 3000),
  status     text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bible_series (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title      text not null check (char_length(title) between 1 and 160),
  summary    text not null default '' check (char_length(summary) <= 600),
  sort_order int not null default 0,
  status     text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bible_lessons (
  id          uuid primary key default gen_random_uuid(),
  series_id   uuid not null references public.bible_series (id) on delete cascade,
  position    int not null default 1 check (position between 1 and 500),
  title       text not null check (char_length(title) between 1 and 160),
  scripture   text not null default '' check (char_length(scripture) <= 300),
  body        text not null default '' check (char_length(body) <= 40000),
  quiz        text not null default '' check (char_length(quiz) <= 20000),
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index bible_lessons_series_idx on public.bible_lessons (series_id, position);

alter table public.bible_devotionals enable row level security;
alter table public.bible_series enable row level security;
alter table public.bible_lessons enable row level security;

grant select on public.bible_devotionals, public.bible_series, public.bible_lessons to anon, authenticated;
grant insert, update, delete on public.bible_devotionals, public.bible_series, public.bible_lessons to authenticated;

-- Split by role because anon can't execute is_admin().
create policy "visitors read devotionals" on public.bible_devotionals for select to anon
  using (status = 'published' and day <= (now() at time zone 'Africa/Accra')::date);
create policy "signed-in read devotionals, admins all" on public.bible_devotionals for select to authenticated
  using ((status = 'published' and day <= (now() at time zone 'Africa/Accra')::date) or public.is_admin());
create policy "admins add devotionals" on public.bible_devotionals for insert to authenticated with check (public.is_admin());
create policy "admins edit devotionals" on public.bible_devotionals for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove devotionals" on public.bible_devotionals for delete to authenticated using (public.is_admin());

create policy "visitors read series" on public.bible_series for select to anon using (status = 'published');
create policy "signed-in read series, admins all" on public.bible_series for select to authenticated using (status = 'published' or public.is_admin());
create policy "admins add series" on public.bible_series for insert to authenticated with check (public.is_admin());
create policy "admins edit series" on public.bible_series for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove series" on public.bible_series for delete to authenticated using (public.is_admin());

create policy "visitors read lessons" on public.bible_lessons for select to anon
  using (status = 'published' and exists (select 1 from public.bible_series s where s.id = series_id and s.status = 'published'));
create policy "signed-in read lessons, admins all" on public.bible_lessons for select to authenticated
  using ((status = 'published' and exists (select 1 from public.bible_series s where s.id = series_id and s.status = 'published')) or public.is_admin());
create policy "admins add lessons" on public.bible_lessons for insert to authenticated with check (public.is_admin());
create policy "admins edit lessons" on public.bible_lessons for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove lessons" on public.bible_lessons for delete to authenticated using (public.is_admin());
