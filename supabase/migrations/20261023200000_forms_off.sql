-- The website stopped collecting visitors' personal details (owner's decision,
-- 23 Oct 2026, until registration with the Data Protection Commission).
-- Close the database side too, so nobody can send data in directly.
-- Existing rows are untouched. To reopen later, run the grants at the bottom.

revoke insert on public.inbox_messages from anon;
revoke insert on public.ad_requests from anon;
revoke insert on public.advertisers from anon;
revoke execute on function public.place_book_order(text, text, text, text, text, text, jsonb) from anon;

alter policy "visitors upload request photos" on storage.objects
  with check (false);

-- To reopen (also set ONLINE_FORMS_ENABLED = true in src/config/forms.ts):
--   grant insert on public.inbox_messages to anon;
--   grant insert on public.ad_requests to anon;
--   grant execute on function public.place_book_order(text, text, text, text, text, text, jsonb) to anon;
--   alter policy "visitors upload request photos" on storage.objects
--     with check (bucket_id = 'ad-requests' and name ~ '^requests/[0-9a-f-]{36}\.webp$'
--                 and public.ad_request_upload_allowed());
