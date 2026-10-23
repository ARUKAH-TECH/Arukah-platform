-- AI-made advert videos (image-to-video via fal.ai, generated on the admin's
-- request). The finished MP4 is copied into our own public "ad-videos"
-- bucket, so the advert never depends on the provider's temporary links.
-- A ready AI video is used as a normal video advert: display_kind = 'video'
-- and video_url = its address in our bucket.

alter table public.ad_requests
  add column ai_video_status text not null default 'none'
    check (ai_video_status in ('none', 'queued', 'ready', 'failed')),
  add column ai_video_prompt text not null default '' check (char_length(ai_video_prompt) <= 1000),
  add column ai_video_status_url text check (ai_video_status_url is null or ai_video_status_url ~ '^https://queue\.fal\.run/'),
  add column ai_video_response_url text check (ai_video_response_url is null or ai_video_response_url ~ '^https://queue\.fal\.run/'),
  add column ai_video_path text check (ai_video_path is null or ai_video_path ~ '^ai/[0-9a-f-]{36}\.mp4$'),
  add column ai_video_error text not null default '' check (char_length(ai_video_error) <= 500),
  add column ai_video_requested_at timestamptz;

-- Public bucket for finished advert videos. Only admins add or remove files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ad-videos', 'ad-videos', true, 52428800, array['video/mp4']);

create policy "admins upload ad videos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ad-videos' and public.is_admin());

create policy "admins read ad video records"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'ad-videos' and public.is_admin());

create policy "admins delete ad videos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ad-videos' and public.is_admin());
