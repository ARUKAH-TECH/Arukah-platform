-- R.O.M Bible Guide: the picture style for each month's share pictures,
-- chosen by AI from that month's theme (period 'YYYY-MM'). Additive only.
create table if not exists public.bible_backdrops (
  period     text primary key check (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  theme_key  text not null default '' check (char_length(theme_key) <= 600),
  design     jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.bible_backdrops enable row level security;
revoke all on public.bible_backdrops from anon, authenticated;
grant select, insert, update on public.bible_backdrops to service_role;
grant select on public.bible_backdrops to authenticated;
create policy "admins read backdrops" on public.bible_backdrops for select to authenticated using (public.is_admin());
