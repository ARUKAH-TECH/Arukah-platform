-- Adverts can show the advertiser's phone number on the website, and a tap on
-- the advert can open a WhatsApp chat or a phone call to the advertiser
-- (owner's request, 2 Nov 2026). The admin chooses the number and the action
-- per advert; only that public number is exposed, never the private contact
-- details from the request.

alter table public.ad_requests
  add column if not exists public_phone text not null default '' check (char_length(public_phone) <= 40),
  add column if not exists contact_action text not null default 'whatsapp' check (contact_action in ('whatsapp', 'call', 'link', 'none'));

-- Existing adverts: show the number they gave and open WhatsApp (or keep their website link).
update public.ad_requests
   set public_phone = phone,
       contact_action = case when link_url is not null then 'link' else 'whatsapp' end
 where public_phone = '';

-- Live adverts, now with the public number and tap action.
create or replace function public.live_ads_v4()
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
  banner_style text,
  public_phone text,
  contact_action text
)
language sql
stable
security definer
set search_path = ''
as $$
  select r.id, r.display_kind, r.display_image_path, r.display_image_width, r.display_image_height,
         r.video_url, r.link_url,
         coalesce(nullif(r.business_name, ''), 'Sponsored') as label,
         r.display_seconds, r.banner_style, r.public_phone, r.contact_action
  from public.ad_requests r
  where r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at
  order by r.starts_at, r.created_at;
$$;

revoke execute on function public.live_ads_v4() from public;
grant execute on function public.live_ads_v4() to anon, authenticated;
