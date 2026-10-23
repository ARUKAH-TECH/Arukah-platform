-- Tidy-up from Supabase's security advisor: functions visitors never need.
--   * enforce_form_rate_limit() is a trigger — it runs on its own; nobody
--     should call it through the API.
--   * live_ads() and advertiser_is_approved() belong to retired advert
--     designs (replaced by live_ads_v2()); no code uses them.
-- The remaining public functions (live_ads_v2, live_ad_link, record_ad_event,
-- place_book_order, ad_request_upload_allowed) are deliberate, narrow "front
-- doors" that only expose what visitors are meant to see or do.

revoke execute on function public.enforce_form_rate_limit() from public, anon, authenticated;
revoke execute on function public.live_ads() from public, anon, authenticated;
revoke execute on function public.advertiser_is_approved(uuid) from public, anon, authenticated;
