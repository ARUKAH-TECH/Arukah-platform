-- Advert reports: how often each advert is seen and clicked, per day.
--
-- Counts are written only through record_ad_event(), and only for adverts
-- that are live right now. Visitors can't read the numbers; admins can.
-- No personal data is stored — just a counter per advert per day.
-- (Numbers are indicative: they can't tell real people from bots.)

create table public.ad_daily_stats (
  ad_id   uuid not null references public.ad_requests (id) on delete cascade,
  day     date not null,
  views   int not null default 0 check (views >= 0),
  clicks  int not null default 0 check (clicks >= 0),
  primary key (ad_id, day)
);

alter table public.ad_daily_stats enable row level security;
grant select on public.ad_daily_stats to authenticated;

create policy "admins read ad stats"
  on public.ad_daily_stats for select
  to authenticated
  using (public.is_admin());

create function public.record_ad_event(ad uuid, kind text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if kind not in ('view', 'click') then return; end if;
  -- Only count adverts that are actually showing.
  if not exists (
    select 1 from public.ad_requests r
    where r.id = ad and r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at
  ) then
    return;
  end if;
  insert into public.ad_daily_stats as s (ad_id, day, views, clicks)
  values (ad, (now() at time zone 'utc')::date,
          case when kind = 'view' then 1 else 0 end,
          case when kind = 'click' then 1 else 0 end)
  on conflict (ad_id, day) do update
    set views = s.views + excluded.views,
        clicks = s.clicks + excluded.clicks;
end;
$$;

revoke execute on function public.record_ad_event(uuid, text) from public;
grant execute on function public.record_ad_event(uuid, text) to anon, authenticated;

-- The click page needs the advert's link (visitors can't read ad_requests).
create function public.live_ad_link(ad uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select r.link_url from public.ad_requests r
  where r.id = ad and r.status = 'approved' and now() >= r.starts_at and now() < r.ends_at;
$$;

revoke execute on function public.live_ad_link(uuid) from public;
grant execute on function public.live_ad_link(uuid) to anon, authenticated;
