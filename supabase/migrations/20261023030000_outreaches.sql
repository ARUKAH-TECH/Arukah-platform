-- Phase 5 step 1: Repent Online Ministries outreach projects.
--
-- Visibility rule matches projects/announcements. Read policies are split by
-- role (anon may not execute is_admin()).
--
-- Private notes live in outreach_private_notes (admin-only), never here.
--
-- Safeguard enforced by the database, not just the admin page: a hospital or
-- prison outreach can't be published or scheduled until the admin records
-- that the facility gave permission.

create table public.outreaches (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title                text not null check (char_length(title) between 1 and 150),
  outreach_type        text not null check (outreach_type in ('hospital', 'prison', 'street', 'community', 'crusade', 'other')),
  purpose              text not null default '' check (char_length(purpose) <= 600),
  body                 text not null default '' check (char_length(body) <= 20000),
  outreach_date        date,
  location             text not null default '' check (char_length(location) <= 200),
  needs                text[] not null default '{}' check (cardinality(needs) <= 30),
  facility_permission  boolean not null default false,
  status               text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  publish_at           timestamptz,
  unpublish_at         timestamptz,
  created_by           uuid references auth.users (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (status <> 'scheduled' or publish_at is not null),
  check (unpublish_at is null or publish_at is null or unpublish_at > publish_at),
  constraint outreach_facility_permission_before_publishing check (
    status not in ('published', 'scheduled')
    or outreach_type not in ('hospital', 'prison')
    or facility_permission
  )
);

create function public.outreach_is_public(o public.outreaches)
returns boolean
language sql
stable
set search_path = ''
as $$
  select o.status in ('published', 'scheduled')
     and (o.publish_at is null or o.publish_at <= now())
     and (o.unpublish_at is null or o.unpublish_at > now());
$$;

alter table public.outreaches enable row level security;

grant select on public.outreaches to anon, authenticated;
grant insert, update, delete on public.outreaches to authenticated;

create policy "visitors read visible outreaches"
  on public.outreaches for select
  to anon
  using (public.outreach_is_public(outreaches));

create policy "signed-in users read visible outreaches, admins read all"
  on public.outreaches for select
  to authenticated
  using (public.outreach_is_public(outreaches) or public.is_admin());

create policy "admins insert outreaches"
  on public.outreaches for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update outreaches"
  on public.outreaches for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete outreaches"
  on public.outreaches for delete
  to authenticated
  using (public.is_admin());

create index outreaches_date_idx on public.outreaches (outreach_date desc nulls last);

-- Private notes (e.g. who at the facility gave permission). Kept in their own
-- admin-only table because every column of a published outreach row is
-- readable through the public API.
create table public.outreach_private_notes (
  outreach_id              uuid primary key references public.outreaches (id) on delete cascade,
  facility_permission_note text not null default '' check (char_length(facility_permission_note) <= 300),
  updated_at               timestamptz not null default now()
);

alter table public.outreach_private_notes enable row level security;

grant select, insert, update, delete on public.outreach_private_notes to authenticated;

create policy "admins manage outreach private notes"
  on public.outreach_private_notes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
