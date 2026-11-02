-- Online Programmes, step 4: paid programmes through the existing Paystack.
--
-- Flow: register (name, WhatsApp, consent) → pay on Paystack's page → back on
-- zivarukah.com the server asks Paystack itself; only a verified payment of
-- the right amount marks the place as paid, and only then is the secret code
-- made and shown (once). The Paystack webhook can also mark it paid (if the
-- visitor never comes back); the admin can then send a new code on WhatsApp.
-- An unpaid place holds a seat for one hour only.

create table if not exists public.programme_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.programme_registrations (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  reference text not null unique check (reference ~ '^ZP-[A-Z0-9]{10}$'),
  amount_ghs numeric(12, 2) not null check (amount_ghs > 0),
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'abandoned', 'refunded', 'cancelled')),
  fees_ghs numeric(12, 2) check (fees_ghs is null or fees_ghs >= 0),
  channel text not null default '' check (char_length(channel) <= 40),
  paystack_transaction_id bigint,
  paid_at timestamptz,
  code_delivered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists programme_payments_registration on public.programme_payments (registration_id);
alter table public.programme_payments enable row level security;
revoke all on public.programme_payments from anon, authenticated;
grant select on public.programme_payments to authenticated;
create policy "admins read programme payments" on public.programme_payments for select to authenticated using (public.is_admin());

-- Places: approved/pending registrations, but an unpaid one only for its first hour.
create or replace function public.programme_taken(p_programme uuid)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.programme_registrations g
   where g.programme_id = p_programme and g.status in ('pending', 'approved')
     and (g.payment_status in ('not_required', 'paid') or (g.payment_status = 'pending' and g.created_at > now() - interval '1 hour'));
$$;

create or replace function public.programme_places()
returns table (programme_id uuid, taken int)
language sql stable security definer set search_path = '' as $$
  select p.id, public.programme_taken(p.id) from public.programmes p where p.status <> 'draft';
$$;

-- Register. Free: returns the code now. Paid: returns the registration to pay
-- for (no code yet). Someone retrying an unpaid registration gets the same one back.
create or replace function public.programme_register(p_slug text, p_name text, p_phone text, p_consent boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  p record;
  nm text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  ph text := public.programme_phone(p_phone);
  existing record;
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
  if char_length(nm) < 2 or char_length(nm) > 80 then raise exception 'Please enter your name.'; end if;
  if nm ~ '[0-9]{5,}' or nm ~* '(https?://|www\.)' then raise exception 'Please enter just your name.'; end if;
  if ph is null then raise exception 'Enter a WhatsApp number with country code, e.g. +233 24 123 4567.'; end if;
  if coalesce(p_consent, false) is not true then raise exception 'Please tick the box to agree to programme messages on WhatsApp.'; end if;

  select id, status, payment_status, created_at into existing from public.programme_registrations where programme_id = p.id and phone = ph;
  if existing.id is not null then
    -- A paid programme not paid for yet: let them try paying again.
    if p.price_ghs > 0 and existing.payment_status in ('pending', 'failed') and existing.status in ('pending', 'approved') then
      -- Their held place has lapsed and others have filled the programme.
      if existing.created_at <= now() - interval '1 hour' and p.capacity is not null and public.programme_taken(p.id) >= p.capacity then
        raise exception 'Sorry, this programme is full.';
      end if;
      update public.programme_registrations set name = nm, created_at = now(), payment_status = 'pending', updated_at = now() where id = existing.id;
      return jsonb_build_object('pay', true, 'registration', existing.id, 'amount', p.price_ghs, 'title', p.title, 'status', existing.status);
    end if;
    raise exception 'This WhatsApp number is already registered for this programme. If you lost your code, message us on WhatsApp.';
  end if;

  if p.capacity is not null and public.programme_taken(p.id) >= p.capacity then raise exception 'Sorry, this programme is full.'; end if;
  if (select count(*) from public.programme_registrations where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'Many people are registering right now. Please try again in a few minutes.';
  end if;

  st := case when p.approval = 'auto' then 'approved' else 'pending' end;
  insert into public.programme_registrations (programme_id, name, phone, whatsapp_consent, consent_at, status, payment_status)
  values (p.id, nm, ph, true, now(), st, case when p.price_ghs > 0 then 'pending' else 'not_required' end)
  returning id into reg;

  if p.price_ghs > 0 then
    return jsonb_build_object('pay', true, 'registration', reg, 'amount', p.price_ghs, 'title', p.title, 'status', st);
  end if;
  c := public.programme_issue_code(reg);
  return jsonb_build_object('code', c, 'status', st, 'title', p.title);
end $$;

-- Server only (service role): record a payment Paystack has confirmed, and
-- make the code once. p_deliver = false (webhook) records the payment without
-- making a code, so the code is still shown when the visitor comes back.
create or replace function public.programme_payment_confirmed(p_reference text, p_amount_pesewas bigint, p_fees_pesewas bigint, p_channel text, p_tx bigint, p_paid_at timestamptz, p_deliver boolean)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare pay record; c text;
begin
  select * into pay from public.programme_payments where reference = p_reference for update;
  if pay.id is null then return jsonb_build_object('state', 'unknown'); end if;
  if round(pay.amount_ghs * 100) <> p_amount_pesewas then return jsonb_build_object('state', 'mismatch'); end if;
  if pay.status not in ('pending', 'success', 'failed', 'abandoned') then return jsonb_build_object('state', pay.status); end if;

  if pay.status <> 'success' then
    update public.programme_payments
       set status = 'success', fees_ghs = case when p_fees_pesewas is null then null else p_fees_pesewas / 100.0 end,
           channel = left(coalesce(p_channel, ''), 40), paystack_transaction_id = p_tx, paid_at = coalesce(p_paid_at, now()), updated_at = now()
     where id = pay.id;
    update public.programme_registrations set payment_status = 'paid', updated_at = now() where id = pay.registration_id;
  end if;

  if p_deliver and not pay.code_delivered then
    update public.programme_payments set code_delivered = true where id = pay.id;
    c := public.programme_issue_code(pay.registration_id);
    return jsonb_build_object('state', 'paid', 'code', c);
  end if;
  return jsonb_build_object('state', 'paid', 'delivered', pay.code_delivered or p_deliver);
end $$;

revoke execute on function public.programme_taken(uuid) from public, anon, authenticated;
revoke execute on function public.programme_payment_confirmed(text, bigint, bigint, text, bigint, timestamptz, boolean) from public, anon, authenticated;
grant execute on function public.programme_payment_confirmed(text, bigint, bigint, text, bigint, timestamptz, boolean) to service_role;
grant select, insert, update on public.programme_payments to service_role;
