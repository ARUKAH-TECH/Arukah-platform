-- How long each advert stays on screen before the next one shows (when
-- several are live at once). Set by the admin; 3–120 seconds, default 8.
alter table public.ad_requests
  add column display_seconds int not null default 8 check (display_seconds between 3 and 120);

-- live_ads() plus display_seconds. A new function (rather than changing the
-- old one's return type) so the live site keeps working during the switch.
create function public.live_ads_v2()
returns table (
  id uuid,
  display_kind text,
  display_image_path text,
  display_image_width int,
  display_image_height int,
  video_url text,
  link_url text,
  label text,
  display_seconds int
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.display_kind, r.display_image_path, r.display_image_width, r.display_image_height,
         r.video_url, r.link_url,
         coalesce(nullif(r.business_name, ''), 'Sponsored') as label,
         r.display_seconds
  from public.ad_requests r
  where r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at
  order by r.starts_at, r.created_at;
$$;

revoke execute on function public.live_ads_v2() from public;
grant execute on function public.live_ads_v2() to anon, authenticated;
