-- Visitor counts for the admin "Visitors" page.
-- Privacy by design: only DAILY TOTALS are stored — per page and per source
-- (WhatsApp, Google, …). No cookies, IP addresses, devices, names or
-- per-person records exist anywhere. Only the website server (service role)
-- can add to the counts; only admins can read them.

create table public.page_view_daily (
  day date not null,
  path text not null check (path ~ '^/[a-z0-9/_-]{0,159}$'),
  views integer not null default 0 check (views >= 0),
  visits integer not null default 0 check (visits >= 0),
  primary key (day, path)
);

create table public.page_view_sources (
  day date not null,
  source text not null check (source in ('direct', 'whatsapp', 'facebook', 'google', 'tiktok', 'youtube', 'instagram', 'x', 'search', 'other')),
  views integer not null default 0 check (views >= 0),
  primary key (day, source)
);

alter table public.page_view_daily enable row level security;
alter table public.page_view_sources enable row level security;

revoke all on public.page_view_daily, public.page_view_sources from anon, authenticated;
grant select on public.page_view_daily, public.page_view_sources to authenticated;

create policy "admins read page views" on public.page_view_daily for select to authenticated using (public.is_admin());
create policy "admins read view sources" on public.page_view_sources for select to authenticated using (public.is_admin());

-- One page view. `p_visit` is true for the first page of a browsing session;
-- only then is the source (where the visitor came from) counted.
create or replace function public.record_page_view(p_path text, p_source text, p_visit boolean)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.page_view_daily as d (day, path, views, visits)
  values ((now() at time zone 'utc')::date, p_path, 1, case when p_visit then 1 else 0 end)
  on conflict (day, path) do update
    set views = d.views + 1, visits = d.visits + case when p_visit then 1 else 0 end;

  insert into public.page_view_sources as s (day, source, views)
  select (now() at time zone 'utc')::date, p_source, 1
  where p_visit
  on conflict (day, source) do update set views = s.views + 1;
$$;

revoke execute on function public.record_page_view(text, text, boolean) from public, anon, authenticated;
grant execute on function public.record_page_view(text, text, boolean) to service_role;
