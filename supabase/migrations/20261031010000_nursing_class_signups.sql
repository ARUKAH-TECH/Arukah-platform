-- ZIVA free nursing class (Saturdays on Zoom): sign-ups from zivarukah.com/ziva.
-- Only school, course and subject are kept: no name, phone, email or device
-- details, so nothing here identifies a student. The owner sees the totals
-- and most needed subjects in zivarukah.com/admin/nursing-class.

create table if not exists public.nursing_signups (
  id uuid primary key default gen_random_uuid(),
  school text not null check (char_length(school) between 2 and 120),
  course text not null check (char_length(course) between 2 and 80),
  subject text not null check (char_length(subject) between 2 and 120),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists nursing_signups_created on public.nursing_signups (created_at desc);
alter table public.nursing_signups enable row level security;
revoke all on public.nursing_signups from anon, authenticated;

-- Admin (signed in with two-factor) reads, ticks as checked, and removes spam.
grant select, update (checked), delete on public.nursing_signups to authenticated;
create policy "admins read nursing signups" on public.nursing_signups for select to authenticated using (public.is_admin());
create policy "admins check nursing signups" on public.nursing_signups for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete nursing signups" on public.nursing_signups for delete to authenticated using (public.is_admin());

-- Anyone may sign up. Phone numbers, links and emails are refused, and there is a daily cap against spam.
create or replace function public.nursing_signup(p_school text, p_course text, p_subject text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  s text := btrim(regexp_replace(coalesce(p_school, ''), '\s+', ' ', 'g'));
  c text := btrim(regexp_replace(coalesce(p_course, ''), '\s+', ' ', 'g'));
  j text := btrim(regexp_replace(coalesce(p_subject, ''), '\s+', ' ', 'g'));
  allv text := s || ' ' || c || ' ' || j;
begin
  if char_length(s) < 2 or char_length(c) < 2 or char_length(j) < 2 then raise exception 'Please fill in your school, course and subject.'; end if;
  if char_length(s) > 120 or char_length(c) > 80 or char_length(j) > 120 then raise exception 'Please keep each answer short.'; end if;
  if allv ~ '(\d[\s-]?){9,}' then raise exception 'Please leave out phone numbers.'; end if;
  if allv ~* '(https?://|www\.|@[a-z0-9-]+\.)' then raise exception 'Please leave out links and email addresses.'; end if;
  if (select count(*) from public.nursing_signups where created_at > now() - interval '1 day') >= 500 then
    raise exception 'Too many sign-ups today. Please join the WhatsApp group directly.';
  end if;
  insert into public.nursing_signups (school, course, subject) values (s, c, j);
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.nursing_signup(text, text, text) from public;
grant execute on function public.nursing_signup(text, text, text) to anon, authenticated;
