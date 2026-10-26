-- A designed text advert (made in the admin when no photo/video was sent).
-- Only allowed for fully paid adverts; the image itself is generated in the
-- admin and stored like any other advert image.
alter table public.ad_requests
  add column if not exists is_text_ad boolean not null default false;
