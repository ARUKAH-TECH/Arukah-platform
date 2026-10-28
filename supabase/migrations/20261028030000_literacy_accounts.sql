-- ZIVA Literacy (learn.zivarukah.com): parent / teacher / school accounts.
--
-- Owner's choice: adults sign in with their phone number only (no password,
-- no PIN, no SMS). A random session token is returned and kept on the phone;
-- only its SHA-256 hash is stored here.
-- Children are added by a parent (family) or by a school, with a consent
-- tick. Only a first name (or nickname) and class level are stored, plus
-- the stars from the app. Children open their profile on a phone with a
-- learner code (no password).
--
-- Every table has RLS on and NO policies: the tables can't be read or
-- written through the API at all. Everything goes through the functions
-- below, which check who is asking.

create table public.lit_accounts (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^[0-9]{9,15}$'),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.lit_sessions (
  token_hash bytea primary key,
  account_id uuid not null references public.lit_accounts (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);
create index on public.lit_sessions (account_id);

create table public.lit_groups (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('family', 'school')),
  name text not null check (char_length(name) between 1 and 80),
  join_code text not null unique,
  created_by uuid references public.lit_accounts (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.lit_members (
  group_id uuid not null references public.lit_groups (id) on delete cascade,
  account_id uuid not null references public.lit_accounts (id) on delete cascade,
  role text not null check (role in ('parent', 'head', 'teacher')),
  joined_at timestamptz not null default now(),
  primary key (group_id, account_id)
);
create index on public.lit_members (account_id);

create table public.lit_classes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.lit_groups (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  level text not null check (level in ('kg', 'p1-3', 'p4-6', 'jhs')),
  teacher_id uuid references public.lit_accounts (id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.lit_classes (group_id);

create table public.lit_learners (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.lit_groups (id) on delete cascade,
  class_id uuid references public.lit_classes (id) on delete set null,
  name text not null check (char_length(name) between 1 and 40),
  level text not null check (level in ('kg', 'p1-3', 'p4-6', 'jhs')),
  code text not null unique,
  consent_by uuid references public.lit_accounts (id) on delete set null,
  consent_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index on public.lit_learners (group_id);
create index on public.lit_learners (class_id);

create table public.lit_progress (
  learner_id uuid primary key references public.lit_learners (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.lit_accounts enable row level security;
alter table public.lit_sessions enable row level security;
alter table public.lit_groups enable row level security;
alter table public.lit_members enable row level security;
alter table public.lit_classes enable row level security;
alter table public.lit_learners enable row level security;
alter table public.lit_progress enable row level security;
revoke all on public.lit_accounts, public.lit_sessions, public.lit_groups, public.lit_members,
  public.lit_classes, public.lit_learners, public.lit_progress from anon, authenticated;

-- ── helpers (not callable from the API) ─────────────────────────────────

create or replace function public.lit_code(p_len int)
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(p_len);
  res text := '';
begin
  for i in 0 .. p_len - 1 loop
    res := res || substr(alphabet, (get_byte(bytes, i) % 31) + 1, 1);
  end loop;
  return res;
end $$;

create or replace function public.lit_phone(p_phone text)
returns text language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
begin
  if d like '00%' then d := substr(d, 3); end if;
  if length(d) = 10 and d like '0%' then d := '233' || substr(d, 2); end if; -- Ghana local 0XX…
  if length(d) = 9 then d := '233' || d; end if;
  if d !~ '^[0-9]{9,15}$' then raise exception 'Please enter a valid phone number.'; end if;
  return d;
end $$;

-- The signed-in account for a session token (or an error).
create or replace function public.lit_who(p_token text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid;
begin
  update public.lit_sessions
     set last_used_at = now()
   where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256')
  returning account_id into acct;
  if acct is null then raise exception 'SIGNED_OUT'; end if;
  return acct;
end $$;

create or replace function public.lit_new_session(p_account uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare tok text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  insert into public.lit_sessions (token_hash, account_id) values (extensions.digest(tok, 'sha256'), p_account);
  return tok;
end $$;

create or replace function public.lit_role(p_account uuid, p_group uuid)
returns text language sql stable security definer set search_path = '' as $$
  select role from public.lit_members where account_id = p_account and group_id = p_group;
$$;

-- May this account manage (see/edit) this learner?
create or replace function public.lit_can_manage(p_account uuid, p_learner uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
      from public.lit_learners l
      join public.lit_members m on m.group_id = l.group_id and m.account_id = p_account
      left join public.lit_classes c on c.id = l.class_id
     where l.id = p_learner
       and (m.role in ('parent', 'head') or (m.role = 'teacher' and c.teacher_id = p_account))
  );
$$;

-- Merges two progress saves: best stars, most tries, latest date, all days.
create or replace function public.lit_merge(a jsonb, b jsonb)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  ra jsonb := coalesce(a -> 'records', '{}'::jsonb);
  rb jsonb := coalesce(b -> 'records', '{}'::jsonb);
  recs jsonb := '{}'::jsonb;
  k text;
  x jsonb; y jsonb;
  days jsonb;
begin
  for k in select jsonb_object_keys(ra) union select jsonb_object_keys(rb) loop
    x := ra -> k; y := rb -> k;
    if x is null then recs := recs || jsonb_build_object(k, y);
    elsif y is null then recs := recs || jsonb_build_object(k, x);
    else
      recs := recs || jsonb_build_object(k, jsonb_build_object(
        'best', greatest(coalesce((x ->> 'best')::numeric, 0), coalesce((y ->> 'best')::numeric, 0)),
        'tries', greatest(coalesce((x ->> 'tries')::numeric, 0), coalesce((y ->> 'tries')::numeric, 0)),
        'last', greatest(coalesce(x ->> 'last', ''), coalesce(y ->> 'last', ''))));
    end if;
  end loop;
  select coalesce(jsonb_agg(d order by d), '[]'::jsonb) into days
    from (
      select d from (
        select distinct d from (
          select jsonb_array_elements_text(coalesce(a -> 'days', '[]'::jsonb)) d
          union select jsonb_array_elements_text(coalesce(b -> 'days', '[]'::jsonb))
        ) s where d ~ '^\d{4}-\d{2}-\d{2}$'
      ) t order by d desc limit 180
    ) u;
  return jsonb_build_object('records', recs, 'days', days, 'scale', 5);
end $$;

-- ── adults: sign up / sign in ───────────────────────────────────────────

create or replace function public.lit_register(p_phone text, p_name text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare ph text := public.lit_phone(p_phone); acct uuid; nm text := btrim(coalesce(p_name, ''));
begin
  if nm = '' then raise exception 'Please enter your name.'; end if;
  if exists (select 1 from public.lit_accounts where phone = ph) then
    raise exception 'This phone number is already registered — please sign in.';
  end if;
  insert into public.lit_accounts (phone, name) values (ph, left(nm, 60)) returning id into acct;
  return jsonb_build_object('token', public.lit_new_session(acct), 'name', left(nm, 60), 'phone', ph);
end $$;

create or replace function public.lit_sign_in(p_phone text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare ph text := public.lit_phone(p_phone); a public.lit_accounts;
begin
  select * into a from public.lit_accounts where phone = ph;
  if a.id is null then raise exception 'No account with this phone number yet — please register.'; end if;
  return jsonb_build_object('token', public.lit_new_session(a.id), 'name', a.name, 'phone', a.phone);
end $$;

create or replace function public.lit_sign_out(p_token text)
returns void language sql volatile security definer set search_path = '' as $$
  delete from public.lit_sessions where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256');
$$;

create or replace function public.lit_update_profile(p_token text, p_name text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  if btrim(coalesce(p_name, '')) = '' then raise exception 'Please enter your name.'; end if;
  update public.lit_accounts set name = left(btrim(p_name), 60) where id = acct;
end $$;

-- Deletes the adult's account. Families/schools they alone belong to are
-- deleted with all their children's data.
create or replace function public.lit_delete_account(p_token text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  delete from public.lit_groups g
   where exists (select 1 from public.lit_members m where m.group_id = g.id and m.account_id = acct)
     and not exists (select 1 from public.lit_members m where m.group_id = g.id and m.account_id <> acct);
  delete from public.lit_accounts where id = acct;
end $$;

-- ── everything the dashboard shows ──────────────────────────────────────

create or replace function public.lit_me(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); me public.lit_accounts; spaces jsonb;
begin
  select * into me from public.lit_accounts where id = acct;
  select coalesce(jsonb_agg(s order by s ->> 'name'), '[]'::jsonb) into spaces from (
    select jsonb_build_object(
      'id', g.id, 'kind', g.kind, 'name', g.name, 'role', m.role,
      'joinCode', case when m.role in ('parent', 'head') then g.join_code end,
      'members', (
        select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'name', a.name, 'role', mm.role, 'me', a.id = acct) order by mm.joined_at), '[]'::jsonb)
          from public.lit_members mm join public.lit_accounts a on a.id = mm.account_id
         where mm.group_id = g.id and (m.role in ('parent', 'head') or a.id = acct or mm.role = 'head')),
      'classes', (
        select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'level', c.level, 'teacherId', c.teacher_id) order by c.name), '[]'::jsonb)
          from public.lit_classes c
         where c.group_id = g.id and (m.role <> 'teacher' or c.teacher_id = acct)),
      'learners', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'id', l.id, 'name', l.name, 'level', l.level, 'classId', l.class_id, 'code', l.code,
                 'progress', coalesce(p.data, '{}'::jsonb), 'updatedAt', p.updated_at) order by l.name), '[]'::jsonb)
          from public.lit_learners l
          left join public.lit_progress p on p.learner_id = l.id
          left join public.lit_classes c on c.id = l.class_id
         where l.group_id = g.id and (m.role <> 'teacher' or c.teacher_id = acct))
    ) s
      from public.lit_members m join public.lit_groups g on g.id = m.group_id
     where m.account_id = acct
  ) x;
  return jsonb_build_object('id', me.id, 'name', me.name, 'phone', me.phone, 'spaces', spaces);
end $$;

-- ── families and schools ────────────────────────────────────────────────

create or replace function public.lit_create_space(p_token text, p_kind text, p_name text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); gid uuid;
begin
  if p_kind not in ('family', 'school') then raise exception 'Choose family or school.'; end if;
  if btrim(coalesce(p_name, '')) = '' then raise exception 'Please enter a name.'; end if;
  if (select count(*) from public.lit_members where account_id = acct) >= 10 then
    raise exception 'You already belong to 10 families/schools.';
  end if;
  insert into public.lit_groups (kind, name, join_code, created_by)
  values (p_kind, left(btrim(p_name), 80), case p_kind when 'family' then 'FAM-' else 'SCH-' end || public.lit_code(6), acct)
  returning id into gid;
  insert into public.lit_members (group_id, account_id, role)
  values (gid, acct, case p_kind when 'family' then 'parent' else 'head' end);
  return gid;
end $$;

-- Second parent / guardian joins a family; a teacher joins a school.
create or replace function public.lit_join_space(p_token text, p_code text)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); g public.lit_groups;
begin
  select * into g from public.lit_groups where join_code = upper(btrim(coalesce(p_code, '')));
  if g.id is null then raise exception 'That code was not found. Check it with the parent or head of school.'; end if;
  insert into public.lit_members (group_id, account_id, role)
  values (g.id, acct, case g.kind when 'family' then 'parent' else 'teacher' end)
  on conflict do nothing;
  return g.id;
end $$;

create or replace function public.lit_rename_space(p_token text, p_group uuid, p_name text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  if coalesce(public.lit_role(acct, p_group), '') not in ('parent', 'head') then raise exception 'Not allowed.'; end if;
  update public.lit_groups set name = left(btrim(p_name), 80) where id = p_group and btrim(coalesce(p_name, '')) <> '';
end $$;

create or replace function public.lit_new_join_code(p_token text, p_group uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); v_code text;
begin
  if coalesce(public.lit_role(acct, p_group), '') not in ('parent', 'head') then raise exception 'Not allowed.'; end if;
  update public.lit_groups
     set join_code = case kind when 'family' then 'FAM-' else 'SCH-' end || public.lit_code(6)
   where id = p_group returning join_code into v_code;
  return v_code;
end $$;

-- Remove someone (head/parent), make a teacher a head, or leave (anyone).
create or replace function public.lit_set_member(p_token text, p_group uuid, p_account uuid, p_role text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); mine text := public.lit_role(acct, p_group);
begin
  if mine is null then raise exception 'Not allowed.'; end if;
  if p_account <> acct and mine not in ('parent', 'head') then raise exception 'Not allowed.'; end if;
  if p_role is null then
    delete from public.lit_members where group_id = p_group and account_id = p_account;
    update public.lit_classes set teacher_id = null where group_id = p_group and teacher_id = p_account;
    -- Nobody left → delete the space and its children's data.
    delete from public.lit_groups g where g.id = p_group and not exists (select 1 from public.lit_members m where m.group_id = g.id);
    if exists (select 1 from public.lit_groups where id = p_group and kind = 'school')
       and not exists (select 1 from public.lit_members where group_id = p_group and role = 'head') then
      raise exception 'A school needs at least one head. Make another teacher head first.';
    end if;
  elsif p_role in ('head', 'teacher') and mine = 'head' then
    update public.lit_members set role = p_role where group_id = p_group and account_id = p_account;
    if not exists (select 1 from public.lit_members where group_id = p_group and role = 'head') then
      raise exception 'A school needs at least one head.';
    end if;
  else
    raise exception 'Not allowed.';
  end if;
end $$;

-- ── classes (schools) ───────────────────────────────────────────────────

create or replace function public.lit_save_class(p_token text, p_group uuid, p_class uuid, p_name text, p_level text, p_teacher uuid)
returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); cid uuid;
begin
  if coalesce(public.lit_role(acct, p_group), '') <> 'head' then raise exception 'Only the head of school can change classes.'; end if;
  if p_teacher is not null and public.lit_role(p_teacher, p_group) is null then raise exception 'That teacher has not joined this school.'; end if;
  if p_class is null then
    insert into public.lit_classes (group_id, name, level, teacher_id)
    values (p_group, left(btrim(p_name), 40), p_level, p_teacher) returning id into cid;
  else
    update public.lit_classes set name = left(btrim(p_name), 40), level = p_level, teacher_id = p_teacher
     where id = p_class and group_id = p_group returning id into cid;
  end if;
  return cid;
end $$;

create or replace function public.lit_delete_class(p_token text, p_class uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); gid uuid;
begin
  select group_id into gid from public.lit_classes where id = p_class;
  if coalesce(public.lit_role(acct, gid), '') <> 'head' then raise exception 'Only the head of school can delete classes.'; end if;
  delete from public.lit_classes where id = p_class; -- learners stay, without a class
end $$;

-- ── children ────────────────────────────────────────────────────────────

create or replace function public.lit_add_learners(p_token text, p_group uuid, p_class uuid, p_level text, p_names text[], p_consent boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  acct uuid := public.lit_who(p_token);
  v_role text := public.lit_role(acct, p_group);
  nm text;
  added jsonb := '[]'::jsonb;
  lid uuid; v_code text;
begin
  if v_role is null then raise exception 'Not allowed.'; end if;
  if p_consent is distinct from true then raise exception 'Please tick the consent box first.'; end if;
  if p_level not in ('kg', 'p1-3', 'p4-6', 'jhs') then raise exception 'Choose a class level.'; end if;
  if p_class is not null and not exists (select 1 from public.lit_classes where id = p_class and group_id = p_group) then
    raise exception 'Class not found.';
  end if;
  if v_role = 'teacher' and (p_class is null or not exists (select 1 from public.lit_classes where id = p_class and teacher_id = acct)) then
    raise exception 'Teachers can add learners to their own class only.';
  end if;
  if coalesce(array_length(p_names, 1), 0) = 0 then raise exception 'Enter at least one name.'; end if;
  if array_length(p_names, 1) > 80 then raise exception 'Add up to 80 learners at a time.'; end if;
  if (select count(*) from public.lit_learners where group_id = p_group) + array_length(p_names, 1) > 3000 then
    raise exception 'Too many learners in this space.';
  end if;
  foreach nm in array p_names loop
    nm := btrim(nm);
    continue when nm = '';
    loop
      v_code := 'ZV-' || public.lit_code(4) || '-' || public.lit_code(4);
      exit when not exists (select 1 from public.lit_learners where lit_learners.code = v_code);
    end loop;
    insert into public.lit_learners (group_id, class_id, name, level, code, consent_by, consent_at)
    values (p_group, p_class, left(nm, 40), p_level, v_code, acct, now()) returning id into lid;
    added := added || jsonb_build_object('id', lid, 'name', left(nm, 40), 'code', v_code);
  end loop;
  return added;
end $$;

create or replace function public.lit_update_learner(p_token text, p_learner uuid, p_name text, p_level text, p_class uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); gid uuid;
begin
  if not public.lit_can_manage(acct, p_learner) then raise exception 'Not allowed.'; end if;
  select group_id into gid from public.lit_learners where id = p_learner;
  if p_class is not null and not exists (select 1 from public.lit_classes where id = p_class and group_id = gid) then
    raise exception 'Class not found.';
  end if;
  if public.lit_role(acct, gid) = 'teacher' and p_class is distinct from (select class_id from public.lit_learners where id = p_learner) then
    raise exception 'Ask the head of school to move a learner to another class.';
  end if;
  update public.lit_learners
     set name = coalesce(nullif(left(btrim(coalesce(p_name, '')), 40), ''), name),
         level = case when p_level in ('kg', 'p1-3', 'p4-6', 'jhs') then p_level else level end,
         class_id = p_class
   where id = p_learner;
end $$;

-- Permanently deletes the child and all their progress.
create or replace function public.lit_delete_learner(p_token text, p_learner uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  if not public.lit_can_manage(acct, p_learner) then raise exception 'Not allowed.'; end if;
  delete from public.lit_learners where id = p_learner;
end $$;

create or replace function public.lit_new_learner_code(p_token text, p_learner uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); c text;
begin
  if not public.lit_can_manage(acct, p_learner) then raise exception 'Not allowed.'; end if;
  loop
    c := 'ZV-' || public.lit_code(4) || '-' || public.lit_code(4);
    exit when not exists (select 1 from public.lit_learners where code = c);
  end loop;
  update public.lit_learners set code = c where id = p_learner;
  return c;
end $$;

-- ── the child's phone (learner code, no account) ────────────────────────

create or replace function public.lit_learner_open(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare l public.lit_learners; g public.lit_groups; d jsonb;
begin
  select * into l from public.lit_learners where code = upper(btrim(coalesce(p_code, '')));
  if l.id is null then raise exception 'That learner code was not found. Check it with your parent or teacher.'; end if;
  select * into g from public.lit_groups where id = l.group_id;
  select data into d from public.lit_progress where learner_id = l.id;
  return jsonb_build_object('name', l.name, 'level', l.level, 'space', g.name, 'kind', g.kind, 'data', coalesce(d, '{}'::jsonb));
end $$;

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
  return jsonb_build_object('name', l.name, 'level', l.level, 'data', merged);
end $$;

-- ── who can call what ───────────────────────────────────────────────────

-- Only the literacy functions are touched here. Helpers are closed to
-- everyone; the API functions are open to the app (they check the token or
-- learner code themselves).
do $$
declare f text;
begin
  foreach f in array array[
    'lit_code(int)', 'lit_phone(text)', 'lit_who(text)', 'lit_new_session(uuid)', 'lit_role(uuid,uuid)',
    'lit_can_manage(uuid,uuid)', 'lit_merge(jsonb,jsonb)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon, authenticated', f);
  end loop;
  foreach f in array array[
    'lit_register(text,text)', 'lit_sign_in(text)', 'lit_sign_out(text)', 'lit_update_profile(text,text)',
    'lit_delete_account(text)', 'lit_me(text)', 'lit_create_space(text,text,text)', 'lit_join_space(text,text)',
    'lit_rename_space(text,uuid,text)', 'lit_new_join_code(text,uuid)', 'lit_set_member(text,uuid,uuid,text)',
    'lit_save_class(text,uuid,uuid,text,text,uuid)', 'lit_delete_class(text,uuid)',
    'lit_add_learners(text,uuid,uuid,text,text[],boolean)', 'lit_update_learner(text,uuid,text,text,uuid)',
    'lit_delete_learner(text,uuid)', 'lit_new_learner_code(text,uuid)',
    'lit_learner_open(text)', 'lit_learner_sync(text,jsonb)'
  ] loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
