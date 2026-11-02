-- Online Programmes, steps 2 and 3: registration and secret codes.
--
-- Registration (like the ZIVA Literacy app): name + WhatsApp number with
-- country code + consent to programme WhatsApp messages. One registration per
-- phone number per programme; places are counted inside the database.
--
-- Codes: 10 random characters (no 0/O/1/I), shown once to the participant.
-- Only a SHA-256 hash is stored. Each code belongs to one registration and one
-- programme, expires (programme end + code_valid_hours), can be revoked and
-- reissued by an admin, and can be single-use. Wrong guesses are limited per
-- visitor (a hashed network address, never the address itself).
-- Visitors never read these tables directly: only through the functions below.

create table if not exists public.programme_registrations (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (phone ~ '^\+[1-9][0-9]{8,14}$'),
  whatsapp_consent boolean not null,
  consent_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  payment_status text not null default 'not_required' check (payment_status in ('not_required', 'pending', 'paid', 'failed', 'refunded', 'cancelled')),
  admin_note text not null default '' check (char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, phone)
);
create index if not exists programme_registrations_programme on public.programme_registrations (programme_id, status);

create table if not exists public.programme_codes (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.programme_registrations (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  code_hash bytea not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists programme_codes_registration on public.programme_codes (registration_id);

create table if not exists public.programme_code_attempts (
  id bigint generated always as identity primary key,
  visitor_hash text not null check (char_length(visitor_hash) <= 128),
  ok boolean not null,
  at timestamptz not null default now()
);
create index if not exists programme_code_attempts_visitor on public.programme_code_attempts (visitor_hash, at desc);

alter table public.programme_registrations enable row level security;
alter table public.programme_codes enable row level security;
alter table public.programme_code_attempts enable row level security;
revoke all on public.programme_registrations, public.programme_codes, public.programme_code_attempts from anon, authenticated;

-- Admin reads and manages registrations; codes are managed only through the functions.
grant select, update (status, payment_status, admin_note, updated_at), delete on public.programme_registrations to authenticated;
create policy "admins read registrations" on public.programme_registrations for select to authenticated using (public.is_admin());
create policy "admins change registrations" on public.programme_registrations for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete registrations" on public.programme_registrations for delete to authenticated using (public.is_admin());
grant select (id, registration_id, programme_id, expires_at, revoked_at, redeemed_at, created_at) on public.programme_codes to authenticated;
create policy "admins read codes" on public.programme_codes for select to authenticated using (public.is_admin());

-- Helpers ----------------------------------------------------------------------

-- "+233241234567" from "024 123 4567", "+233 24…", "00233…". Null if not a phone number.
create or replace function public.programme_phone(p text)
returns text language plpgsql immutable set search_path = '' as $$
declare d text := regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g');
begin
  if btrim(coalesce(p, '')) ~ '^\+' then null;
  elsif d ~ '^00' then d := substr(d, 3);
  elsif d ~ '^0[0-9]{9}$' then d := '233' || substr(d, 2);
  end if;
  if d !~ '^[1-9][0-9]{8,14}$' then return null; end if;
  return '+' || d;
end $$;

-- A new random code, e.g. "K7QM2-XH9TA". 32 letters/digits, 5 bits each, no bias.
create or replace function public.programme_new_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea := extensions.gen_random_bytes(10);
  out text := '';
begin
  for i in 0..9 loop
    out := out || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
    if i = 4 then out := out || '-'; end if;
  end loop;
  return out;
end $$;

create or replace function public.programme_code_hash(p_code text)
returns bytea language sql immutable set search_path = '' as $$
  select extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256');
$$;

-- Issues a fresh code for a registration (revoking any earlier one). Returns the code.
create or replace function public.programme_issue_code(p_registration uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
declare r record; c text;
begin
  select g.id, g.programme_id, p.ends_at, p.code_valid_hours into r
    from public.programme_registrations g join public.programmes p on p.id = g.programme_id where g.id = p_registration;
  if r.id is null then raise exception 'Registration not found.'; end if;
  update public.programme_codes set revoked_at = now() where registration_id = r.id and revoked_at is null;
  c := public.programme_new_code();
  insert into public.programme_codes (registration_id, programme_id, code_hash, expires_at)
  values (r.id, r.programme_id, public.programme_code_hash(c), r.ends_at + make_interval(hours => r.code_valid_hours));
  return c;
end $$;

-- Public: places taken per programme (non-draft programmes only; counts, no names).
create or replace function public.programme_places()
returns table (programme_id uuid, taken int)
language sql stable security definer set search_path = '' as $$
  select p.id, (select count(*)::int from public.programme_registrations g where g.programme_id = p.id and g.status in ('pending', 'approved'))
    from public.programmes p where p.status <> 'draft';
$$;

-- Public: register for a free programme. Returns the secret code (shown once).
create or replace function public.programme_register(p_slug text, p_name text, p_phone text, p_consent boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  p record;
  nm text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  ph text := public.programme_phone(p_phone);
  taken int;
  reg uuid;
  st text;
  c text;
begin
  select * into p from public.programmes where slug = p_slug and status <> 'draft' for update;
  if p.id is null then raise exception 'This programme was not found.'; end if;
  if p.status = 'cancelled' then raise exception 'This programme has been cancelled.'; end if;
  if p.status <> 'published' then raise exception 'Registration for this programme is closed.'; end if;
  if p.reg_opens_at is not null and now() < p.reg_opens_at then raise exception 'Registration has not opened yet.'; end if;
  if now() >= coalesce(p.reg_closes_at, p.ends_at) then raise exception 'Registration for this programme is closed.'; end if;
  if p.price_ghs > 0 then raise exception 'Online payment for this programme opens soon. Please check back.'; end if;
  if char_length(nm) < 2 or char_length(nm) > 80 then raise exception 'Please enter your name.'; end if;
  if nm ~ '[0-9]{5,}' or nm ~* '(https?://|www\.)' then raise exception 'Please enter just your name.'; end if;
  if ph is null then raise exception 'Enter a WhatsApp number with country code, e.g. +233 24 123 4567.'; end if;
  if coalesce(p_consent, false) is not true then raise exception 'Please tick the box to agree to programme messages on WhatsApp.'; end if;
  if exists (select 1 from public.programme_registrations where programme_id = p.id and phone = ph) then
    raise exception 'This WhatsApp number is already registered for this programme. If you lost your code, message us on WhatsApp.';
  end if;
  if p.capacity is not null then
    select count(*) into taken from public.programme_registrations where programme_id = p.id and status in ('pending', 'approved');
    if taken >= p.capacity then raise exception 'Sorry, this programme is full.'; end if;
  end if;
  if (select count(*) from public.programme_registrations where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Many people are registering right now. Please try again in a few minutes.';
  end if;

  st := case when p.approval = 'auto' then 'approved' else 'pending' end;
  insert into public.programme_registrations (programme_id, name, phone, whatsapp_consent, consent_at, status, payment_status)
  values (p.id, nm, ph, true, now(), st, 'not_required')
  returning id into reg;
  c := public.programme_issue_code(reg);
  return jsonb_build_object('code', c, 'status', st, 'title', p.title);
end $$;

-- Public: what a code unlocks. p_visitor is a hash of the visitor's network
-- address (made on the server), used only to limit wrong guesses.
create or replace function public.programme_access(p_code text, p_visitor text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v text := left(coalesce(p_visitor, ''), 128);
  k record;
  fails int;
begin
  -- Old attempt records are kept for one day only.
  delete from public.programme_code_attempts where at < now() - interval '1 day';
  select count(*) into fails from public.programme_code_attempts where visitor_hash = v and not ok and at > now() - interval '15 minutes';
  if fails >= 8 then
    return jsonb_build_object('ok', false, 'reason', 'too_many');
  end if;

  select c.id as code_id, c.expires_at, c.revoked_at, c.redeemed_at, g.name, g.status as reg_status, g.payment_status,
         p.title, p.slug, p.status as prog_status, p.starts_at, p.ends_at, p.time_zone, p.schedule_note, p.platform, p.platform_name,
         p.code_single_use, pr.join_link, pr.join_instructions
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

-- Admin: issue a new code (the old one stops working). Returns the new code once.
create or replace function public.programme_admin_reissue(p_registration uuid)
returns text language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  return public.programme_issue_code(p_registration);
end $$;

-- Admin: stop a registration's code working.
create or replace function public.programme_admin_revoke(p_registration uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not allowed.'; end if;
  update public.programme_codes set revoked_at = now() where registration_id = p_registration and revoked_at is null;
end $$;

revoke execute on function public.programme_phone(text) from public;
revoke execute on function public.programme_new_code() from public, anon, authenticated;
revoke execute on function public.programme_code_hash(text) from public, anon, authenticated;
revoke execute on function public.programme_issue_code(uuid) from public, anon, authenticated;
revoke execute on function public.programme_places() from public;
revoke execute on function public.programme_register(text, text, text, boolean) from public;
revoke execute on function public.programme_access(text, text) from public;
revoke execute on function public.programme_admin_reissue(uuid) from public, anon;
revoke execute on function public.programme_admin_revoke(uuid) from public, anon;
grant execute on function public.programme_places() to anon, authenticated;
grant execute on function public.programme_register(text, text, text, boolean) to anon, authenticated;
grant execute on function public.programme_access(text, text) to anon, authenticated;
grant execute on function public.programme_admin_reissue(uuid) to authenticated;
grant execute on function public.programme_admin_revoke(uuid) to authenticated;
