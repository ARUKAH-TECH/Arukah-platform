-- How an image advert sits in the slim top banner:
--   roll — fills the whole strip and slowly rolls through the image, so a
--          tall or large picture is shown in full over time (default);
--   fit  — the whole image shrunk to fit, standing still.
-- (An image cropped to the banner shape in the admin fits exactly either way.)
alter table public.ad_requests
  add column banner_style text not null default 'roll' check (banner_style in ('roll', 'fit'));

-- live_ads_v2() plus banner_style. New function so the live site keeps
-- working during the switch.
create function public.live_ads_v3()
returns table (
  id uuid,
  display_kind text,
  display_image_path text,
  display_image_width int,
  display_image_height int,
  video_url text,
  link_url text,
  label text,
  display_seconds int,
  banner_style text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.display_kind, r.display_image_path, r.display_image_width, r.display_image_height,
         r.video_url, r.link_url,
         coalesce(nullif(r.business_name, ''), 'Sponsored') as label,
         r.display_seconds, r.banner_style
  from public.ad_requests r
  where r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at
  order by r.starts_at, r.created_at;
$$;

revoke execute on function public.live_ads_v3() from public;
grant execute on function public.live_ads_v3() to anon, authenticated;
