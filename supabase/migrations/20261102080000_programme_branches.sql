-- Online Programmes: choose which pages show a programme (owner's request,
-- 2 Nov 2026), e.g. a ministry programme on the homepage and the Ministry page.
-- Same page ids as projects and announcements (src/config/branches.ts).
alter table public.programmes add column if not exists branches text[] not null default '{home}'
  check (branches <@ array['home', 'tech', 'wear', 'ziva', 'media', 'books', 'ministry']::text[]);

update public.programmes set branches = '{home,ministry}' where slug = 'zivarukah-restoration-2026';
