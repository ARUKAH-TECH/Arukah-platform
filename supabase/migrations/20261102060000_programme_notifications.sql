-- Online Programmes, step 5: WhatsApp messages to participants.
-- No WhatsApp Business API is connected yet, so the admin sends each message
-- from their own WhatsApp: the website opens the chat with the message ready
-- and records "opened" here. It never records "delivered", because WhatsApp
-- does not tell the website. Participants who reply STOP are marked opted out
-- and get no more buttons.

alter table public.programme_registrations add column if not exists whatsapp_opt_out boolean not null default false;
grant update (whatsapp_opt_out) on public.programme_registrations to authenticated;

create table if not exists public.programme_notifications (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.programme_registrations (id) on delete cascade,
  programme_id uuid not null references public.programmes (id) on delete cascade,
  kind text not null check (kind in ('confirmation', 'approved', 'code', 'reminder', 'change', 'cancellation')),
  channel text not null default 'whatsapp_manual' check (channel in ('whatsapp_manual', 'whatsapp_api')),
  status text not null default 'opened' check (status in ('opened', 'sent', 'delivered', 'failed')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists programme_notifications_programme on public.programme_notifications (programme_id, kind, created_at desc);
alter table public.programme_notifications enable row level security;
revoke all on public.programme_notifications from anon, authenticated;
grant select, insert on public.programme_notifications to authenticated;
create policy "admins read notifications" on public.programme_notifications for select to authenticated using (public.is_admin());
create policy "admins record notifications" on public.programme_notifications for insert to authenticated with check (public.is_admin() and channel = 'whatsapp_manual' and status = 'opened');
