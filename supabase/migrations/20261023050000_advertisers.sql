-- Phase 7 step 1: "Advertise With Us" applications and advertiser approval.
--
-- Visitors may only INSERT a new pending application; they can never read,
-- change or delete any (so advertisers never see each other's details).
-- Only verified admins can read and review applications.

create table public.advertisers (
  id             uuid primary key default gen_random_uuid(),
  business_name  text not null check (char_length(business_name) between 1 and 150),
  contact_name   text not null check (char_length(contact_name) between 1 and 150),
  email          text not null default '' check (char_length(email) <= 200),
  phone          text not null default '' check (char_length(phone) <= 40),
  website        text not null default '' check (char_length(website) <= 300),
  interested_in  text[] not null default '{}' check (public.valid_branches(interested_in) and cardinality(interested_in) <= 7),
  message        text not null default '' check (char_length(message) <= 3000),
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note    text not null default '' check (char_length(review_note) <= 2000),
  reviewed_by    uuid references auth.users (id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (email <> '' or phone <> '')
);

alter table public.advertisers enable row level security;

grant insert on public.advertisers to anon, authenticated;
grant select, update, delete on public.advertisers to authenticated;

-- A visitor's insert must be a fresh, unreviewed application.
create policy "visitors submit pending applications"
  on public.advertisers for insert
  to anon, authenticated
  with check (
    status = 'pending' and review_note = '' and reviewed_by is null and reviewed_at is null
  );

create policy "admins read applications"
  on public.advertisers for select
  to authenticated
  using (public.is_admin());

create policy "admins review applications"
  on public.advertisers for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete applications"
  on public.advertisers for delete
  to authenticated
  using (public.is_admin());

create index advertisers_status_idx on public.advertisers (status, created_at desc);
