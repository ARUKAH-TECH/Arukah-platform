-- Fundraising goals for outreaches: the site shows "raised so far" with a
-- progress bar. Only the total is public (no names, numbers or single gifts).
alter table public.outreaches add column if not exists goal_ghs numeric(12,2) check (goal_ghs is null or (goal_ghs > 0 and goal_ghs <= 10000000));

create or replace function public.outreach_raised(p_outreach uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select sum(amount_ghs) from public.payments where outreach_id = p_outreach and status = 'success'), 0)
       + coalesce((select sum(amount_ghs) from public.quick_payments where outreach_id = p_outreach and status = 'success'), 0)
  where exists (select 1 from public.outreaches o where o.id = p_outreach and public.outreach_is_public(o));
$$;
revoke all on function public.outreach_raised(uuid) from public;
grant execute on function public.outreach_raised(uuid) to anon, authenticated;
