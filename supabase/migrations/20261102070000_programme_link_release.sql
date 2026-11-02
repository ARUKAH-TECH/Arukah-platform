-- Online Programmes: release the joining link automatically at a chosen time
-- (owner's request, 2 Nov 2026). Before then, a valid code shows "your code
-- works; the link appears here on …" and is not counted as used.
--   always  = as soon as the code is valid
--   3_days  = 3 days before the start
--   day_of  = from midnight on the day it starts (programme's time zone)
--   1_hour  = 1 hour before the start

alter table public.programmes add column if not exists link_release text not null default 'always'
  check (link_release in ('always', '3_days', 'day_of', '1_hour'));

create or replace function public.programme_link_release_at(p_starts timestamptz, p_tz text, p_rule text)
returns timestamptz language sql stable set search_path = '' as $$
  select case p_rule
    when '3_days' then p_starts - interval '3 days'
    when 'day_of' then (date_trunc('day', p_starts at time zone p_tz)) at time zone p_tz
    when '1_hour' then p_starts - interval '1 hour'
    else '-infinity'::timestamptz
  end;
$$;
revoke execute on function public.programme_link_release_at(timestamptz, text, text) from public;

create or replace function public.programme_access(p_code text, p_visitor text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v text := left(coalesce(p_visitor, ''), 128);
  k record;
  fails int;
  release timestamptz;
begin
  delete from public.programme_code_attempts where at < now() - interval '1 day';
  select count(*) into fails from public.programme_code_attempts where visitor_hash = v and not ok and at > now() - interval '15 minutes';
  if fails >= 8 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  select c.id as code_id, c.expires_at, c.revoked_at, c.redeemed_at, g.name, g.status as reg_status, g.payment_status,
         p.title, p.slug, p.status as prog_status, p.starts_at, p.ends_at, p.time_zone, p.schedule_note, p.platform, p.platform_name,
         p.code_single_use, p.link_release, pr.join_link, pr.join_instructions
    into k
    from public.programme_codes c
    join public.programme_registrations g on g.id = c.registration_id
    join public.programmes p on p.id = c.programme_id
    left join public.programme_private pr on pr.programme_id = p.id
   where c.code_hash = public.programme_code_hash(p_code);

  if k.code_id is null then
    insert into public.programme_code_attempts (visitor_hash, ok) values (v, false);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  insert into public.programme_code_attempts (visitor_hash, ok) values (v, true);

  if k.revoked_at is not null then return jsonb_build_object('ok', false, 'reason', 'revoked'); end if;
  if now() >= k.expires_at then return jsonb_build_object('ok', false, 'reason', 'expired', 'title', k.title); end if;
  if k.prog_status = 'cancelled' then return jsonb_build_object('ok', false, 'reason', 'cancelled', 'title', k.title); end if;
  if k.reg_status = 'pending' then return jsonb_build_object('ok', false, 'reason', 'pending', 'title', k.title); end if;
  if k.reg_status <> 'approved' then return jsonb_build_object('ok', false, 'reason', 'not_approved', 'title', k.title); end if;
  if k.payment_status not in ('not_required', 'paid') then return jsonb_build_object('ok', false, 'reason', 'unpaid', 'title', k.title); end if;
  if k.code_single_use and k.redeemed_at is not null then return jsonb_build_object('ok', false, 'reason', 'used', 'title', k.title); end if;

  -- Valid code, but the link is not released yet: say when, without using up the code.
  release := public.programme_link_release_at(k.starts_at, k.time_zone, k.link_release);
  if now() < release then
    return jsonb_build_object(
      'ok', false, 'reason', 'not_yet', 'title', k.title, 'name', split_part(k.name, ' ', 1),
      'release_at', release, 'starts_at', k.starts_at, 'ends_at', k.ends_at, 'time_zone', k.time_zone,
      'schedule_note', k.schedule_note, 'platform', k.platform, 'platform_name', k.platform_name
    );
  end if;

  if k.redeemed_at is null then update public.programme_codes set redeemed_at = now() where id = k.code_id; end if;
  return jsonb_build_object(
    'ok', true,
    'name', split_part(k.name, ' ', 1),
    'title', k.title, 'slug', k.slug,
    'starts_at', k.starts_at, 'ends_at', k.ends_at, 'time_zone', k.time_zone, 'schedule_note', k.schedule_note,
    'platform', k.platform, 'platform_name', k.platform_name,
    'join_link', k.join_link, 'join_instructions', coalesce(k.join_instructions, ''),
    'single_use', k.code_single_use
  );
end $$;
revoke execute on function public.programme_access(text, text) from public;
grant execute on function public.programme_access(text, text) to anon, authenticated;

-- The ZIVARUKAH programme (27–29 Nov 2026): link from 3 days before, as asked.
update public.programmes set link_release = '3_days' where slug = 'zivarukah-restoration-2026';
