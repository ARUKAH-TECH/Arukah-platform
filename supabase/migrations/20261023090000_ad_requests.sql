-- Simplified advertising (replaces advertisers / ads / ad_payments / ad_settings).
--
-- One row per advert request. The requester sends: name, optional business,
-- phone/email, what the ad is about, location and an optional photo. The
-- admin then sets: decision, start/end date-time, payment (amount, full /
-- part / unpaid, reference), and what to show (image or video link).
--
-- Privacy: visitors may only INSERT a new pending request — never read one.
-- The public site reads live adverts only through live_ads(), which returns
-- display fields only (never contact details or payments).

create table public.ad_requests (
  id                  uuid primary key default gen_random_uuid(),
  -- From the requester
  contact_name        text not null check (char_length(contact_name) between 1 and 150),
  business_name       text not null default '' check (char_length(business_name) <= 150),
  phone               text not null default '' check (char_length(phone) <= 40),
  email               text not null default '' check (char_length(email) <= 200),
  about               text not null check (char_length(about) between 1 and 3000),
  location            text not null default '' check (char_length(location) <= 200),
  request_image_path  text check (request_image_path is null or request_image_path ~ '^requests/[0-9a-f-]{36}\.webp$'),
  -- Set by the admin
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  starts_at           timestamptz,
  ends_at             timestamptz,
  amount_ghs          numeric(12, 2) check (amount_ghs is null or amount_ghs >= 0),
  payment_status      text not null default 'unpaid' check (payment_status in ('unpaid', 'part', 'full')),
  payment_reference   text not null default '' check (char_length(payment_reference) <= 200),
  display_kind        text not null default 'image' check (display_kind in ('image', 'video')),
  display_image_path  text check (display_image_path is null or display_image_path ~ '^ads/[0-9a-f-]{36}\.webp$'),
  display_image_width int,
  display_image_height int,
  video_url           text check (video_url is null or (char_length(video_url) <= 500 and video_url ~ '^https://')),
  link_url            text check (link_url is null or (char_length(link_url) <= 500 and link_url ~ '^https://')),
  admin_note          text not null default '' check (char_length(admin_note) <= 2000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (phone <> '' or email <> ''),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  -- An approved advert must have its dates and something to show.
  constraint ad_approved_is_complete check (
    status <> 'approved' or (
      starts_at is not null and ends_at is not null and (
        (display_kind = 'image' and display_image_path is not null)
        or (display_kind = 'video' and video_url is not null)
      )
    )
  )
);

alter table public.ad_requests enable row level security;

grant insert on public.ad_requests to anon, authenticated;
grant select, update, delete on public.ad_requests to authenticated;

create policy "visitors send pending requests"
  on public.ad_requests for insert
  to anon, authenticated
  with check (
    status = 'pending' and starts_at is null and ends_at is null and amount_ghs is null
    and payment_status = 'unpaid' and payment_reference = '' and display_image_path is null
    and video_url is null and link_url is null and admin_note = ''
  );

create policy "admins read requests"
  on public.ad_requests for select
  to authenticated
  using (public.is_admin());

create policy "admins manage requests"
  on public.ad_requests for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete requests"
  on public.ad_requests for delete
  to authenticated
  using (public.is_admin());

create index ad_requests_status_idx on public.ad_requests (status, created_at desc);

-- Live adverts for the public site: approved and inside their time window.
-- Returns display fields only.
create function public.live_ads()
returns table (
  id uuid,
  display_kind text,
  display_image_path text,
  display_image_width int,
  display_image_height int,
  video_url text,
  link_url text,
  label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.display_kind, r.display_image_path, r.display_image_width, r.display_image_height,
         r.video_url, r.link_url,
         coalesce(nullif(r.business_name, ''), 'Sponsored') as label
  from public.ad_requests r
  where r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at;
$$;

revoke execute on function public.live_ads() from public;
grant execute on function public.live_ads() to anon, authenticated;

-- Private bucket for photos sent by requesters. Visitors may only add a file
-- (named requests/<uuid>.webp, image types, max 3 MB); only admins can view
-- or remove them. Approved images are copied by the admin into the public
-- "media" bucket under ads/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ad-requests', 'ad-requests', false, 3145728, array['image/webp', 'image/jpeg', 'image/png']);

create policy "visitors upload request photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'ad-requests' and name ~ '^requests/[0-9a-f-]{36}\.webp$');

create policy "admins view request photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'ad-requests' and public.is_admin());

create policy "admins remove request photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ad-requests' and public.is_admin());

-- Carry over applications sent through the previous form.
insert into public.ad_requests (contact_name, business_name, phone, email, about, created_at)
select a.contact_name, a.business_name, a.phone, a.email,
       coalesce(nullif(a.message, ''), 'Advert request') ||
         case when a.website <> '' then E'\n\nWebsite: ' || a.website else '' end,
       a.created_at
from public.advertisers a;
