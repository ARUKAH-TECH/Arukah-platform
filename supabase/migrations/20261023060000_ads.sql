-- Phase 7 step 2: adverts with three separate approvals.
--
-- An advert is live only when ALL hold (checked by the database):
--   1. its advertiser is approved,
--   2. its content is approved,
--   3. payment is confirmed,
--   4. today (Ghana = UTC) is within its start/end dates,
-- and it is shown on a page only if that division currently accepts adverts.
-- Commercial adverts can never be placed on the ministry pages.

-- Divisions that may carry adverts, and whether each currently does.
create table public.ad_settings (
  branch       text primary key check (branch in ('home', 'tech', 'wear', 'ziva', 'media', 'books')),
  accepts_ads  boolean not null default true,
  updated_at   timestamptz not null default now()
);

insert into public.ad_settings (branch) values ('home'), ('tech'), ('wear'), ('ziva'), ('media'), ('books');

alter table public.ad_settings enable row level security;
grant select on public.ad_settings to anon, authenticated;
grant update on public.ad_settings to authenticated;

create policy "everyone reads ad settings"
  on public.ad_settings for select
  to anon, authenticated
  using (true);

create policy "admins change ad settings"
  on public.ad_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Visitors can't read advertisers, so this reveals only "is this advertiser
-- approved?" for the liveness check below.
create function public.advertiser_is_approved(advertiser uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.advertisers a where a.id = advertiser and a.status = 'approved');
$$;

revoke execute on function public.advertiser_is_approved(uuid) from public;
grant execute on function public.advertiser_is_approved(uuid) to anon, authenticated;

create table public.ads (
  id                 uuid primary key default gen_random_uuid(),
  advertiser_id      uuid not null references public.advertisers (id) on delete restrict,
  headline           text not null check (char_length(headline) between 1 and 100),
  body               text not null default '' check (char_length(body) <= 200),
  image_path         text check (image_path is null or (char_length(image_path) <= 120 and image_path ~ '^ads/[0-9a-f-]{36}\.webp$')),
  image_width        int,
  image_height       int,
  destination_url    text not null check (char_length(destination_url) <= 500 and destination_url ~ '^https://'),
  cta_label          text not null default '' check (char_length(cta_label) <= 30),
  placements         text[] not null default '{}' check (
                       placements <@ array['home', 'tech', 'wear', 'ziva', 'media', 'books']::text[]
                     ),
  content_status     text not null default 'pending' check (content_status in ('pending', 'approved', 'rejected')),
  payment_confirmed  boolean not null default false,
  starts_on          date not null,
  ends_on            date not null,
  created_by         uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create function public.ad_is_live(a public.ads)
returns boolean
language sql
stable
set search_path = ''
as $$
  select a.content_status = 'approved'
     and a.payment_confirmed
     and (now() at time zone 'utc')::date between a.starts_on and a.ends_on
     and public.advertiser_is_approved(a.advertiser_id);
$$;

alter table public.ads enable row level security;

grant select on public.ads to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;

create policy "visitors read live ads"
  on public.ads for select
  to anon
  using (public.ad_is_live(ads));

create policy "signed-in users read live ads, admins read all"
  on public.ads for select
  to authenticated
  using (public.ad_is_live(ads) or public.is_admin());

create policy "admins insert ads"
  on public.ads for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update ads"
  on public.ads for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete ads"
  on public.ads for delete
  to authenticated
  using (public.is_admin());

create index ads_placements_idx on public.ads using gin (placements);

-- Payment details are private (public ad rows are readable in full through the API).
create table public.ad_payments (
  ad_id       uuid primary key references public.ads (id) on delete cascade,
  amount_ghs  numeric(12, 2) check (amount_ghs is null or amount_ghs >= 0),
  reference   text not null default '' check (char_length(reference) <= 200),
  note        text not null default '' check (char_length(note) <= 1000),
  updated_at  timestamptz not null default now()
);

alter table public.ad_payments enable row level security;
grant select, insert, update, delete on public.ad_payments to authenticated;

create policy "admins manage ad payments"
  on public.ad_payments for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
