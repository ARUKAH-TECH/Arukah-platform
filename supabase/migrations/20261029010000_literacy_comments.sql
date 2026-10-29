-- ZIVA Literacy comments & suggestions.
-- Registered people post; the owner approves in zivarukah.com/admin before
-- anything is public. Public view shows the first name only.

create table if not exists public.lit_comments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.lit_accounts (id) on delete cascade,
  author text not null check (char_length(author) between 1 and 40),
  kind text not null check (kind in ('comment', 'suggestion')),
  body text not null check (char_length(body) between 3 and 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  reply text check (reply is null or char_length(reply) <= 600),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists lit_comments_status on public.lit_comments (status, created_at desc);
create index if not exists lit_comments_account on public.lit_comments (account_id);
alter table public.lit_comments enable row level security;
revoke all on public.lit_comments from anon, authenticated;

-- Admin (website, signed in with two-factor) reads and moderates.
grant select, update (status, reply, reviewed_at) on public.lit_comments to authenticated;
create policy "admins read literacy comments" on public.lit_comments for select to authenticated using (public.is_admin());
create policy "admins moderate literacy comments" on public.lit_comments for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Post (signed-in person). Phone numbers, links and emails are refused.
create or replace function public.lit_comment_post(p_token text, p_kind text, p_body text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); b text := btrim(regexp_replace(coalesce(p_body, ''), '\s+', ' ', 'g')); nm text;
begin
  if p_kind not in ('comment', 'suggestion') then raise exception 'Choose comment or suggestion.'; end if;
  if char_length(b) < 3 then raise exception 'Please write a little more.'; end if;
  if char_length(b) > 600 then raise exception 'Please keep it under 600 letters.'; end if;
  if b ~ '(\d[\s-]?){9,}' then raise exception 'Please leave out phone numbers.'; end if;
  if b ~* '(https?://|www\.|\.com\y|\.gh\y|@[a-z0-9-]+\.)' then raise exception 'Please leave out links and email addresses.'; end if;
  if (select count(*) from public.lit_comments where account_id = acct and created_at > now() - interval '1 day') >= 5 then
    raise exception 'You can send up to 5 a day. Thank you!';
  end if;
  select split_part(name, ' ', 1) into nm from public.lit_accounts where id = acct;
  insert into public.lit_comments (account_id, author, kind, body) values (acct, left(coalesce(nullif(nm, ''), 'Friend'), 40), p_kind, b);
  return jsonb_build_object('ok', true);
end $$;

-- Everyone: approved comments, newest first.
create or replace function public.lit_comments_public(p_limit int)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'author', author, 'kind', kind, 'body', body, 'reply', reply, 'at', created_at) order by created_at desc), '[]'::jsonb)
    from (select * from public.lit_comments where status = 'approved' order by created_at desc limit least(greatest(coalesce(p_limit, 50), 1), 200)) c;
$$;

-- My own posts and whether they are approved yet.
create or replace function public.lit_my_comments(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  return (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'body', body, 'status', status, 'reply', reply, 'at', created_at) order by created_at desc), '[]'::jsonb)
            from (select * from public.lit_comments where account_id = acct order by created_at desc limit 20) c);
end $$;

revoke execute on function public.lit_comment_post(text, text, text) from public;
revoke execute on function public.lit_comments_public(int) from public;
revoke execute on function public.lit_my_comments(text) from public;
grant execute on function public.lit_comment_post(text, text, text) to anon, authenticated;
grant execute on function public.lit_comments_public(int) to anon, authenticated;
grant execute on function public.lit_my_comments(text) to anon, authenticated;
