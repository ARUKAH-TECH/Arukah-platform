-- Phase 4 (c): banners / announcements with scheduling.
--
-- Same visibility rule as projects: public when published or scheduled, the
-- publish time has passed, and the unpublish time (if any) hasn't. Read
-- policies are split by role from the start (see
-- 20261023000000_public_read_policies.sql for why: anon may not execute
-- is_admin()).

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(title) between 1 and 120),
  message       text not null default '' check (char_length(message) <= 500),
  -- Either a path on this site ("/contact") or a full https:// address.
  link_url      text check (
                  link_url is null
                  or (char_length(link_url) <= 500 and (link_url ~ '^/[^/]' or link_url = '/' or link_url ~ '^https://'))
                ),
  link_label    text not null default '' check (char_length(link_label) <= 40),
  tone          text not null default 'info' check (tone in ('info', 'highlight', 'urgent')),
  status        text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  publish_at    timestamptz,
  unpublish_at  timestamptz,
  branches      text[] not null default '{}' check (public.valid_branches(branches)),
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (status <> 'scheduled' or publish_at is not null),
  check (unpublish_at is null or publish_at is null or unpublish_at > publish_at)
);

create function public.announcement_is_public(a public.announcements)
returns boolean
language sql
stable
set search_path = ''
as $$
  select a.status in ('published', 'scheduled')
     and (a.publish_at is null or a.publish_at <= now())
     and (a.unpublish_at is null or a.unpublish_at > now());
$$;

alter table public.announcements enable row level security;

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;

create policy "visitors read visible announcements"
  on public.announcements for select
  to anon
  using (public.announcement_is_public(announcements));

create policy "signed-in users read visible announcements, admins read all"
  on public.announcements for select
  to authenticated
  using (public.announcement_is_public(announcements) or public.is_admin());

create policy "admins insert announcements"
  on public.announcements for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update announcements"
  on public.announcements for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete announcements"
  on public.announcements for delete
  to authenticated
  using (public.is_admin());

create index announcements_branches_idx on public.announcements using gin (branches);
