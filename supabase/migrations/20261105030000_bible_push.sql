-- R.O.M Bible Guide: daily devotional notifications (web push). Additive only.
-- Only the server (service key) touches these tables; visitors cannot read them.

-- Phones that asked for the daily notification. Only the push address the
-- phone's browser gives us: no name, number or email.
create table if not exists public.bible_push (
  endpoint   text primary key check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  created_at timestamptz not null default now()
);

-- The site's own notification key pair (VAPID), made by the server on first use.
create table if not exists public.push_keys (
  id          int primary key default 1 check (id = 1),
  public_key  text not null,
  private_jwk jsonb not null,
  created_at  timestamptz not null default now()
);

-- One row per day once that day's notification has gone out.
create table if not exists public.bible_push_log (
  day        date primary key,
  sent       int not null default 0,
  failed     int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.bible_push enable row level security;
alter table public.push_keys enable row level security;
alter table public.bible_push_log enable row level security;

revoke all on public.bible_push, public.push_keys, public.bible_push_log from anon, authenticated;
grant select, insert, delete on public.bible_push to service_role;
grant select, insert on public.push_keys to service_role;
grant select, insert, update on public.bible_push_log to service_role;
grant select on public.bible_push_log to authenticated;
create policy "admins read push log" on public.bible_push_log for select to authenticated using (public.is_admin());
