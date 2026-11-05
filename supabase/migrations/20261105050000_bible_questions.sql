-- R.O.M Bible Guide: answers to Bible questions ("who is a christian") with
-- KJV scriptures, cached so each question is researched once. Additive only.
create table if not exists public.bible_questions (
  question   text primary key check (question ~ '^[a-z0-9][a-z0-9 ''-]{2,139}$'),
  data       jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.bible_questions enable row level security;
grant select on public.bible_questions to anon, authenticated;
grant delete on public.bible_questions to authenticated;
grant select, insert, update on public.bible_questions to service_role;
create policy "visitors read questions" on public.bible_questions for select to anon using (true);
create policy "signed-in read questions" on public.bible_questions for select to authenticated using (true);
create policy "admins remove questions" on public.bible_questions for delete to authenticated using (public.is_admin());
