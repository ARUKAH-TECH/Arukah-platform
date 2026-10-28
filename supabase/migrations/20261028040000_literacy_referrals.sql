-- ZIVA Literacy "Invite & earn".
-- Every registered account has a share link (?ref=CODE). Someone who
-- registers through it and then learns on 7 different days (any days, not
-- necessarily in a row) earns the sharer 1 credit. Each 50 credits gives a
-- secret key for 7 days of free online reading of
-- "THE WICKED AND UNFORGIVING STUDENT" on zivarukah.com (the 7 days start
-- the first time the key is opened).

alter table public.lit_accounts
  add column if not exists ref_code text unique,
  add column if not exists referred_by uuid references public.lit_accounts (id) on delete set null,
  add column if not exists referral_done_at timestamptz;
create index if not exists lit_accounts_referred_by on public.lit_accounts (referred_by);

create table if not exists public.lit_visit_days (
  account_id uuid not null references public.lit_accounts (id) on delete cascade,
  day date not null,
  primary key (account_id, day)
);

create table if not exists public.lit_reward_keys (
  key text primary key,
  account_id uuid not null references public.lit_accounts (id) on delete cascade,
  book_slug text not null,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);
create index if not exists lit_reward_keys_account on public.lit_reward_keys (account_id);

alter table public.lit_visit_days enable row level security;
alter table public.lit_reward_keys enable row level security;
revoke all on public.lit_visit_days, public.lit_reward_keys from anon, authenticated;

-- A learning day for an account; counts the referral once it reaches 7 days.
create or replace function public.lit_mark_day(p_account uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_account is null then return; end if;
  insert into public.lit_visit_days (account_id, day)
  values (p_account, (now() at time zone 'Africa/Accra')::date)
  on conflict do nothing;
  update public.lit_accounts a
     set referral_done_at = now()
   where a.id = p_account
     and a.referred_by is not null
     and a.referral_done_at is null
     and (select count(*) from public.lit_visit_days v where v.account_id = p_account) >= 7;
end $$;

create or replace function public.lit_my_ref(p_account uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare c text;
begin
  select ref_code into c from public.lit_accounts where id = p_account;
  while c is null loop
    c := public.lit_code(6);
    begin
      update public.lit_accounts set ref_code = c where id = p_account and ref_code is null;
    exception when unique_violation then
      c := null;
    end;
    if c is not null then
      select ref_code into c from public.lit_accounts where id = p_account;
    end if;
  end loop;
  return c;
end $$;

-- Register through someone's share link.
create or replace function public.lit_register_ref(p_phone text, p_name text, p_ref text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare res jsonb; acct uuid; inviter uuid;
begin
  res := public.lit_register(p_phone, p_name);
  select id into inviter from public.lit_accounts where ref_code = upper(btrim(coalesce(p_ref, '')));
  select id into acct from public.lit_accounts where phone = res ->> 'phone';
  if inviter is not null and inviter <> acct then
    update public.lit_accounts set referred_by = inviter where id = acct;
  end if;
  return res;
end $$;

-- Who shared the link (first word of their name only), for a welcome line.
create or replace function public.lit_ref_info(p_ref text)
returns text language sql stable security definer set search_path = '' as $$
  select split_part(name, ' ', 1) from public.lit_accounts where ref_code = upper(btrim(coalesce(p_ref, '')));
$$;

-- The phone of a signed-in person saved a lesson today.
create or replace function public.lit_visit(p_token text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  perform public.lit_mark_day(public.lit_who(p_token));
end $$;

-- Children's learning also counts for the adult who added them.
create or replace function public.lit_learner_sync(p_code text, p_data jsonb)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare l public.lit_learners; merged jsonb;
begin
  select * into l from public.lit_learners where code = upper(btrim(coalesce(p_code, '')));
  if l.id is null then raise exception 'That learner code was not found.'; end if;
  if pg_column_size(p_data) > 200000 then raise exception 'Progress too large.'; end if;
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

-- Invite & earn summary; issues a key for every 50 credits.
create or replace function public.lit_rewards(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  acct uuid := public.lit_who(p_token);
  v_ref text := public.lit_my_ref(acct);
  done int;
  used int;
  k text;
begin
  select count(*) into done from public.lit_accounts where referred_by = acct and referral_done_at is not null;
  select count(*) into used from public.lit_reward_keys where account_id = acct;
  while done - used * 50 >= 50 loop
    loop
      k := 'ZF-' || public.lit_code(10);
      exit when not exists (select 1 from public.lit_reward_keys where key = k);
    end loop;
    insert into public.lit_reward_keys (key, account_id, book_slug) values (k, acct, 'the-wicked-and-unforgiving-student');
    used := used + 1;
  end loop;
  return jsonb_build_object(
    'refCode', v_ref,
    'credits', done - used * 50,
    'earned', done,
    'goal', 50,
    'invited', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'name', split_part(a.name, ' ', 1),
               'days', (select count(*) from public.lit_visit_days v where v.account_id = a.id),
               'done', a.referral_done_at is not null) order by a.created_at desc), '[]'::jsonb)
        from public.lit_accounts a where a.referred_by = acct),
    'keys', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'key', r.key, 'book', r.book_slug, 'createdAt', r.created_at, 'activatedAt', r.activated_at,
               'expiresAt', r.activated_at + interval '7 days') order by r.created_at desc), '[]'::jsonb)
        from public.lit_reward_keys r where r.account_id = acct),
    'myDays', (select count(*) from public.lit_visit_days v where v.account_id = acct)
  );
end $$;

revoke execute on function public.lit_mark_day(uuid) from public, anon, authenticated;
revoke execute on function public.lit_my_ref(uuid) from public, anon, authenticated;
revoke execute on function public.lit_register_ref(text, text, text) from public;
revoke execute on function public.lit_ref_info(text) from public;
revoke execute on function public.lit_visit(text) from public;
revoke execute on function public.lit_rewards(text) from public;
revoke execute on function public.lit_learner_sync(text, jsonb) from public;
grant execute on function public.lit_register_ref(text, text, text) to anon, authenticated;
grant execute on function public.lit_ref_info(text) to anon, authenticated;
grant execute on function public.lit_visit(text) to anon, authenticated;
grant execute on function public.lit_rewards(text) to anon, authenticated;
grant execute on function public.lit_learner_sync(text, jsonb) to anon, authenticated;

-- The website's book reader (server key) checks a key and starts its 7 days.
grant select (key, book_slug, activated_at) on public.lit_reward_keys to service_role;
grant update (activated_at) on public.lit_reward_keys to service_role;
