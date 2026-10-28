-- Stages add up to 4,800 works per class: allow larger progress saves and
-- merge them set-based (fast) instead of key by key.
create or replace function public.lit_merge(a jsonb, b jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'records', coalesce((
      select jsonb_object_agg(k, case
          when x is null then y
          when y is null then x
          else jsonb_build_object(
            'best', greatest(coalesce((x ->> 'best')::numeric, 0), coalesce((y ->> 'best')::numeric, 0)),
            'tries', greatest(coalesce((x ->> 'tries')::numeric, 0), coalesce((y ->> 'tries')::numeric, 0)),
            'last', greatest(coalesce(x ->> 'last', ''), coalesce(y ->> 'last', '')))
        end)
      from (
        select coalesce(ka.key, kb.key) as k, ka.value as x, kb.value as y
          from jsonb_each(coalesce(a -> 'records', '{}'::jsonb)) ka
          full join jsonb_each(coalesce(b -> 'records', '{}'::jsonb)) kb on ka.key = kb.key
      ) m), '{}'::jsonb),
    'days', coalesce((
      select jsonb_agg(d order by d)
        from (
          select d from (
            select distinct d from (
              select jsonb_array_elements_text(coalesce(a -> 'days', '[]'::jsonb)) d
              union select jsonb_array_elements_text(coalesce(b -> 'days', '[]'::jsonb))
            ) s where d ~ '^\d{4}-\d{2}-\d{2}$'
          ) t order by d desc limit 180
        ) u), '[]'::jsonb),
    'scale', 5);
$$;
revoke execute on function public.lit_merge(jsonb, jsonb) from public, anon, authenticated;

-- lit_learner_sync: same as before, size limit raised from 200 KB to 1.5 MB.
create or replace function public.lit_learner_sync(p_code text, p_data jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare l public.lit_learners; merged jsonb;
begin
  select * into l from public.lit_learners where code = upper(btrim(coalesce(p_code, '')));
  if l.id is null then raise exception 'That learner code was not found.'; end if;
  if pg_column_size(p_data) > 1500000 then raise exception 'Progress too large.'; end if;
  insert into public.lit_progress as p (learner_id, data, updated_at)
  values (l.id, public.lit_merge('{}'::jsonb, coalesce(p_data, '{}'::jsonb)), now())
  on conflict (learner_id) do update set data = public.lit_merge(p.data, excluded.data), updated_at = now()
  returning data into merged;
  if coalesce(p_data -> 'days', '[]'::jsonb) ? to_char((now() at time zone 'Africa/Accra')::date, 'YYYY-MM-DD')
     or coalesce(p_data -> 'days', '[]'::jsonb) ? to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD') then
    perform public.lit_mark_day(l.consent_by);
  end if;
  return jsonb_build_object('name', l.name, 'level', l.level, 'data', merged);
end $$;
