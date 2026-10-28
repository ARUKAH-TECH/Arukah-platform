-- ZIVA Literacy subscriptions (Paystack, one month per payment).
--   student GHS 20 — the signed-in person's own learning
--   parent  GHS 50 — every child in that family
--   school  GHS 100 — every learner in that school
-- In each skill, Stage 1 and the first 10 works of Stage 2 stay free.

create table if not exists public.lit_subscriptions (
  reference text primary key,
  account_id uuid references public.lit_accounts (id) on delete set null,
  plan text not null check (plan in ('student', 'parent', 'school')),
  group_id uuid references public.lit_groups (id) on delete set null,
  amount_ghs numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'abandoned')),
  starts_at timestamptz,
  ends_at timestamptz,
  paystack_id bigint,
  channel text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists lit_subscriptions_account on public.lit_subscriptions (account_id);
create index if not exists lit_subscriptions_group on public.lit_subscriptions (group_id);
alter table public.lit_subscriptions enable row level security;
revoke all on public.lit_subscriptions from anon, authenticated;

create or replace function public.lit_plan_price(p_plan text)
returns numeric language sql immutable set search_path = '' as $$
  select case p_plan when 'student' then 20 when 'parent' then 50 when 'school' then 100 end::numeric;
$$;

-- When the current paid time for this person / family / school ends.
create or replace function public.lit_paid_until(p_plan text, p_account uuid, p_group uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select max(ends_at) from public.lit_subscriptions
   where status = 'success' and plan = p_plan
     and ((p_plan = 'student' and account_id = p_account) or (p_plan <> 'student' and group_id = p_group));
$$;

-- Step 1 (app): create a pending payment. Returns the reference to pay.
create or replace function public.lit_sub_start(p_token text, p_plan text, p_group uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); g public.lit_groups; v_ref text; amount numeric;
begin
  if p_plan not in ('student', 'parent', 'school') then raise exception 'Choose a plan.'; end if;
  if p_plan <> 'student' then
    select * into g from public.lit_groups where id = p_group;
    if g.id is null then raise exception 'Family or school not found.'; end if;
    if p_plan = 'parent' and (g.kind <> 'family' or coalesce(public.lit_role(acct, g.id), '') <> 'parent') then
      raise exception 'Only a parent in this family can pay for it.';
    end if;
    if p_plan = 'school' and (g.kind <> 'school' or coalesce(public.lit_role(acct, g.id), '') <> 'head') then
      raise exception 'Only the head of school can pay for the school.';
    end if;
  end if;
  if (select count(*) from public.lit_subscriptions where account_id = acct and status = 'pending' and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Too many payment attempts. Please wait a little and try again.';
  end if;
  amount := public.lit_plan_price(p_plan);
  loop
    v_ref := 'ZL-' || public.lit_code(10);
    exit when not exists (select 1 from public.lit_subscriptions where reference = v_ref);
  end loop;
  insert into public.lit_subscriptions (reference, account_id, plan, group_id, amount_ghs)
  values (v_ref, acct, p_plan, case when p_plan = 'student' then null else p_group end, amount);
  return jsonb_build_object('reference', v_ref, 'amount', amount, 'plan', p_plan);
end $$;

-- Step 2 (website server, after Paystack confirms): switch on one month.
-- Adds to any time already paid, so paying early never loses days.
create or replace function public.lit_sub_paid(p_ref text, p_paystack_id bigint, p_channel text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare s public.lit_subscriptions; base timestamptz;
begin
  select * into s from public.lit_subscriptions where reference = p_ref for update;
  if s.reference is null then raise exception 'unknown reference'; end if;
  if s.status <> 'success' then
    base := greatest(now(), coalesce(public.lit_paid_until(s.plan, s.account_id, s.group_id), now()));
    update public.lit_subscriptions
       set status = 'success', paid_at = now(), starts_at = base, ends_at = base + interval '1 month',
           paystack_id = p_paystack_id, channel = left(p_channel, 30)
     where reference = p_ref
    returning * into s;
  end if;
  return jsonb_build_object('plan', s.plan, 'endsAt', s.ends_at);
end $$;

create or replace function public.lit_sub_failed(p_ref text, p_status text)
returns void language sql volatile security definer set search_path = '' as $$
  update public.lit_subscriptions set status = p_status
   where reference = p_ref and status = 'pending' and p_status in ('failed', 'abandoned');
$$;

-- What this phone may open: the signed-in person (student plan) and/or the
-- learner code in use (their family's or school's plan).
create or replace function public.lit_access(p_token text, p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid; l public.lit_learners; g public.lit_groups; self_until timestamptz; learner_until timestamptz;
begin
  if coalesce(p_token, '') <> '' then
    begin
      acct := public.lit_who(p_token);
    exception when others then
      acct := null;
    end;
    if acct is not null then self_until := public.lit_paid_until('student', acct, null); end if;
  end if;
  if coalesce(p_code, '') <> '' then
    select * into l from public.lit_learners where code = upper(btrim(p_code));
    if l.id is not null then
      select * into g from public.lit_groups where id = l.group_id;
      learner_until := public.lit_paid_until(case g.kind when 'family' then 'parent' else 'school' end, null, g.id);
    end if;
  end if;
  return jsonb_build_object(
    'selfUntil', self_until,
    'learnerUntil', learner_until,
    'learnerKind', g.kind,
    'now', now());
end $$;

-- For the account page: paid-until for me and each of my families/schools.
create or replace function public.lit_my_subs(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  return jsonb_build_object(
    'selfUntil', public.lit_paid_until('student', acct, null),
    'spaces', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', g.id, 'kind', g.kind, 'name', g.name, 'role', m.role,
               'until', public.lit_paid_until(case g.kind when 'family' then 'parent' else 'school' end, null, g.id))), '[]'::jsonb)
        from public.lit_members m join public.lit_groups g on g.id = m.group_id
       where m.account_id = acct),
    'prices', jsonb_build_object('student', 20, 'parent', 50, 'school', 100),
    'now', now());
end $$;

revoke execute on function public.lit_plan_price(text) from public, anon, authenticated;
revoke execute on function public.lit_paid_until(text, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.lit_sub_paid(text, bigint, text) from public, anon, authenticated;
revoke execute on function public.lit_sub_failed(text, text) from public, anon, authenticated;
revoke execute on function public.lit_sub_start(text, text, uuid) from public;
revoke execute on function public.lit_access(text, text) from public;
revoke execute on function public.lit_my_subs(text) from public;
grant execute on function public.lit_sub_start(text, text, uuid) to anon, authenticated;
grant execute on function public.lit_access(text, text) to anon, authenticated;
grant execute on function public.lit_my_subs(text) to anon, authenticated;

-- The website server (service key) reads a pending payment's amount and
-- marks it paid/failed through the two functions above.
grant select (reference, plan, amount_ghs, status) on public.lit_subscriptions to service_role;
grant execute on function public.lit_sub_paid(text, bigint, text) to service_role;
grant execute on function public.lit_sub_failed(text, text) to service_role;
