-- Bible app: themes (year / month), settings for the automatic 6:00am
-- devotional, and a cache of topic research ("forgiveness" → meaning and
-- scriptures). Additive only.

alter table public.bible_devotionals add column if not exists auto boolean not null default false;

create table if not exists public.bible_themes (
  period     text primary key check (period ~ '^\d{4}(-(0[1-9]|1[0-2]))?$'), -- '2026' or '2026-11'
  theme      text not null check (char_length(theme) between 1 and 200),
  scripture  text not null default '' check (char_length(scripture) <= 120),
  updated_at timestamptz not null default now()
);

create table if not exists public.bible_settings (
  key        text primary key check (char_length(key) <= 60),
  value      text not null default '' check (char_length(value) <= 500),
  updated_at timestamptz not null default now()
);
insert into public.bible_settings (key, value) values ('auto_devotional', 'publish') on conflict do nothing;

create table if not exists public.bible_topics (
  topic      text primary key check (topic ~ '^[a-z][a-z ''-]{1,59}$'),
  data       jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.bible_themes enable row level security;
alter table public.bible_settings enable row level security;
alter table public.bible_topics enable row level security;

grant select on public.bible_themes, public.bible_topics to anon, authenticated;
grant select, insert, update, delete on public.bible_themes, public.bible_settings to authenticated;
grant delete on public.bible_topics to authenticated;

create policy "visitors read themes" on public.bible_themes for select to anon using (true);
create policy "signed-in read themes" on public.bible_themes for select to authenticated using (true);
create policy "admins add themes" on public.bible_themes for insert to authenticated with check (public.is_admin());
create policy "admins edit themes" on public.bible_themes for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins remove themes" on public.bible_themes for delete to authenticated using (public.is_admin());

create policy "admins read settings" on public.bible_settings for select to authenticated using (public.is_admin());
create policy "admins add settings" on public.bible_settings for insert to authenticated with check (public.is_admin());
create policy "admins edit settings" on public.bible_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "visitors read topics" on public.bible_topics for select to anon using (true);
create policy "signed-in read topics" on public.bible_topics for select to authenticated using (true);
create policy "admins remove topics" on public.bible_topics for delete to authenticated using (public.is_admin());

-- The server (service key) writes automatic devotionals and topic research.
grant select, insert on public.bible_devotionals to service_role;
grant select on public.bible_themes, public.bible_settings to service_role;
grant select, insert, update on public.bible_topics to service_role;
