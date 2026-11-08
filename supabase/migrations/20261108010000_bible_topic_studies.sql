-- R.O.M Bible Guide: full Bible studies on any topic (explain, examine,
-- benefits, negatives, hard questions, discussion, quiz…), researched once
-- with outside sources and saved. Additive only.
create table if not exists public.bible_topic_studies (
  topic      text primary key check (topic ~ '^[a-z0-9][a-z0-9 ''-]{1,79}$'),
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.bible_topic_studies enable row level security;
grant select on public.bible_topic_studies to anon, authenticated;
grant delete on public.bible_topic_studies to authenticated;
grant select, insert, update on public.bible_topic_studies to service_role;
create policy "visitors read topic studies" on public.bible_topic_studies for select to anon using (true);
create policy "signed-in read topic studies" on public.bible_topic_studies for select to authenticated using (true);
create policy "admins remove topic studies" on public.bible_topic_studies for delete to authenticated using (public.is_admin());
