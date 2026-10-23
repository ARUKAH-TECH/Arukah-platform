-- Spam limits for the public forms. Visitors' requests reach the database
-- from our server, so the database can't see their IP address; instead it
-- limits (a) the same phone/email and (b) the total per hour. Real visitors
-- never come close to these numbers.

create function public.enforce_form_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  same_contact int;
  total int;
  per_contact_limit int := tg_argv[0]::int;
  total_limit int := tg_argv[1]::int;
begin
  execute format(
    'select count(*) filter (where (nullif($1, '''') is not null and phone = $1) or (nullif($2, '''') is not null and lower(email) = lower($2))),
            count(*)
       from %I.%I where created_at > now() - interval ''1 hour''',
    tg_table_schema, tg_table_name)
  into same_contact, total
  using new.phone, new.email;

  if same_contact >= per_contact_limit then
    raise exception 'You have sent several requests already. Please wait a while before sending another.'
      using errcode = 'P0001';
  end if;
  if total >= total_limit then
    raise exception 'We are receiving a lot of requests right now. Please try again in a little while.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger ad_requests_rate_limit before insert on public.ad_requests
  for each row execute function public.enforce_form_rate_limit('5', '40');

create trigger inbox_messages_rate_limit before insert on public.inbox_messages
  for each row execute function public.enforce_form_rate_limit('5', '60');

create trigger book_orders_rate_limit before insert on public.book_orders
  for each row execute function public.enforce_form_rate_limit('10', '60');

-- Photo uploads to the private advert-request bucket: at most 60 an hour in
-- total. (Visitors can't read the bucket, so the check runs as definer.)
create function public.ad_request_upload_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) < 60 from storage.objects
  where bucket_id = 'ad-requests' and created_at > now() - interval '1 hour';
$$;

revoke execute on function public.ad_request_upload_allowed() from public;
grant execute on function public.ad_request_upload_allowed() to anon, authenticated;

alter policy "visitors upload request photos" on storage.objects
  with check (
    bucket_id = 'ad-requests'
    and name ~ '^requests/[0-9a-f-]{36}\.webp$'
    and public.ad_request_upload_allowed()
  );
