-- Foundation: who is an admin, and an append-only audit log.
--
-- The project was created with "automatically expose new tables" OFF and
-- automatic RLS ON, so every table below needs explicit grants, and every
-- grant is further limited by the RLS policies.

-- Admins -------------------------------------------------------------------
-- Rows are added by hand (SQL editor) only. No insert/update/delete policy
-- exists, so no website request can make anyone an admin.
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'owner' check (role in ('owner')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

grant select on public.admin_users to authenticated;

create policy "admins can read their own row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- True only for a listed admin whose session finished two-factor (aal2).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false)
     and exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Audit log ----------------------------------------------------------------
-- Append-only: admins can add entries as themselves and read them; nobody
-- can edit or delete entries through the API.
create table public.audit_log (
  id         bigint generated always as identity primary key,
  -- Nullable so entries survive if an admin account is later deleted.
  actor      uuid references auth.users (id) on delete set null,
  action     text not null check (char_length(action) <= 100),
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

grant select, insert on public.audit_log to authenticated;

create policy "admins add entries as themselves"
  on public.audit_log for insert
  to authenticated
  with check (public.is_admin() and actor = (select auth.uid()));

create policy "admins read entries"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

create index audit_log_created_at_idx on public.audit_log (created_at desc);
