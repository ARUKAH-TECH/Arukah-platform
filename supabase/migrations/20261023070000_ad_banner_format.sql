-- Adverts come in two styles:
--   card   — image + headline + text, shown in the "Sponsored" section;
--   banner — a slim, image-only landscape strip at the top of the page.
-- A banner must have an image (it has no text of its own to show).

alter table public.ads
  add column format text not null default 'card' check (format in ('card', 'banner'));

alter table public.ads
  add constraint ads_banner_needs_image check (format <> 'banner' or image_path is not null);
