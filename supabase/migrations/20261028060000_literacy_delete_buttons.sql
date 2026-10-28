-- ZIVA Literacy: turns on the Sign out, Delete child, Delete class,
-- Remove person and Delete account buttons. Safe to run more than once.
-- It deletes nothing now; it only lets the app delete when a parent,
-- teacher or head taps one of those buttons.

create or replace function public.lit_sign_out(p_token text)
returns void language sql volatile security definer set search_path = '' as $$
  delete from public.lit_sessions where token_hash = extensions.digest(coalesce(p_token, ''), 'sha256');
$$;

create or replace function public.lit_delete_account(p_token text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  delete from public.lit_groups g
   where exists (select 1 from public.lit_members m where m.group_id = g.id and m.account_id = acct)
     and not exists (select 1 from public.lit_members m where m.group_id = g.id and m.account_id <> acct);
  delete from public.lit_accounts where id = acct;
end $$;

create or replace function public.lit_set_member(p_token text, p_group uuid, p_account uuid, p_role text)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); mine text := public.lit_role(acct, p_group);
begin
  if mine is null then raise exception 'Not allowed.'; end if;
  if p_account <> acct and mine not in ('parent', 'head') then raise exception 'Not allowed.'; end if;
  if p_role is null then
    delete from public.lit_members where group_id = p_group and account_id = p_account;
    update public.lit_classes set teacher_id = null where group_id = p_group and teacher_id = p_account;
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

create or replace function public.lit_delete_class(p_token text, p_class uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token); gid uuid;
begin
  select group_id into gid from public.lit_classes where id = p_class;
  if coalesce(public.lit_role(acct, gid), '') <> 'head' then raise exception 'Only the head of school can delete classes.'; end if;
  delete from public.lit_classes where id = p_class;
end $$;

create or replace function public.lit_delete_learner(p_token text, p_learner uuid)
returns void language plpgsql volatile security definer set search_path = '' as $$
declare acct uuid := public.lit_who(p_token);
begin
  if not public.lit_can_manage(acct, p_learner) then raise exception 'Not allowed.'; end if;
  delete from public.lit_learners where id = p_learner;
end $$;

revoke execute on function public.lit_sign_out(text) from public;
revoke execute on function public.lit_delete_account(text) from public;
revoke execute on function public.lit_set_member(text,uuid,uuid,text) from public;
revoke execute on function public.lit_delete_class(text,uuid) from public;
revoke execute on function public.lit_delete_learner(text,uuid) from public;
grant execute on function public.lit_sign_out(text) to anon, authenticated;
grant execute on function public.lit_delete_account(text) to anon, authenticated;
grant execute on function public.lit_set_member(text,uuid,uuid,text) to anon, authenticated;
grant execute on function public.lit_delete_class(text,uuid) to anon, authenticated;
grant execute on function public.lit_delete_learner(text,uuid) to anon, authenticated;
