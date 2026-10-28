-- When did the site last have a paid advert running? Used to schedule the
-- "our works" pop-up (after 5 advert-free days it shows for 48 hours).
-- Returns NULL while any approved advert is live. Exposes only a time —
-- never who advertised or any payment detail.
create or replace function public.ads_idle_since()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.ad_requests r
      where r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at
    ) then null
    else greatest(
      timestamptz '2026-10-28 00:00:00+00', -- feature launch: first pop-up 5 days after this
      (select max(r.ends_at) from public.ad_requests r where r.status = 'approved' and r.ends_at <= now())
    )
  end;
$$;

revoke execute on function public.ads_idle_since() from public;
grant execute on function public.ads_idle_since() to anon, authenticated, service_role;
