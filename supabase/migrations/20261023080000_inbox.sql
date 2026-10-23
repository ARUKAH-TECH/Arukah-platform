-- Inbox: messages from the public Contact form and the Ministry response form.
--
-- Until now these were only written to temporary server logs. Ministry
-- responses can include personal faith and prayer details, so:
--   * visitors may only INSERT a new message — never read, change or delete;
--   * only verified admins (two-factor) can read or manage messages.

create table public.inbox_messages (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('enquiry', 'ministry')),
  full_name     text not null check (char_length(full_name) between 1 and 200),
  organization  text not null default '' check (char_length(organization) <= 200),
  phone         text not null default '' check (char_length(phone) <= 40),
  email         text not null default '' check (char_length(email) <= 200),
  topic         text not null default '' check (char_length(topic) <= 200),
  message       text not null default '' check (char_length(message) <= 5000),
  status        text not null default 'new' check (status in ('new', 'in_progress', 'handled')),
  admin_note    text not null default '' check (char_length(admin_note) <= 2000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (phone <> '' or email <> '')
);

alter table public.inbox_messages enable row level security;

grant insert on public.inbox_messages to anon, authenticated;
grant select, update, delete on public.inbox_messages to authenticated;

create policy "visitors send new messages"
  on public.inbox_messages for insert
  to anon, authenticated
  with check (status = 'new' and admin_note = '');

create policy "admins read messages"
  on public.inbox_messages for select
  to authenticated
  using (public.is_admin());

create policy "admins manage messages"
  on public.inbox_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete messages"
  on public.inbox_messages for delete
  to authenticated
  using (public.is_admin());

create index inbox_messages_status_idx on public.inbox_messages (status, created_at desc);
