-- Phase 4: projects and the media library.
--
-- Visibility rule used everywhere below: a project is public when it is
-- published or scheduled, its publish time has passed, and its unpublish
-- time (if any) hasn't. Everything else is admin-only.

-- Divisions an item can be shown on.
create function public.valid_branches(branches text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select branches <@ array['home', 'tech', 'wear', 'ziva', 'media', 'books', 'ministry']::text[];
$$;

-- Projects -----------------------------------------------------------------
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title         text not null check (char_length(title) between 1 and 150),
  summary       text not null default '' check (char_length(summary) <= 300),
  body          text not null default '' check (char_length(body) <= 20000),
  status        text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'archived')),
  publish_at    timestamptz,
  unpublish_at  timestamptz,
  branches      text[] not null default '{}' check (public.valid_branches(branches)),
  cover_media_id uuid,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (status <> 'scheduled' or publish_at is not null),
  check (unpublish_at is null or publish_at is null or unpublish_at > publish_at)
);

create function public.project_is_public(p public.projects)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p.status in ('published', 'scheduled')
     and (p.publish_at is null or p.publish_at <= now())
     and (p.unpublish_at is null or p.unpublish_at > now());
$$;

alter table public.projects enable row level security;

grant select on public.projects to anon, authenticated;
grant insert, update on public.projects to authenticated;

create policy "public reads visible projects"
  on public.projects for select
  to anon, authenticated
  using (public.project_is_public(projects) or public.is_admin());

create policy "admins insert projects"
  on public.projects for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update projects"
  on public.projects for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index projects_branches_idx on public.projects using gin (branches);

-- Media library --------------------------------------------------------------
-- Images live in the "media" storage bucket; videos are links to YouTube or
-- TikTok (hosting raw video is expensive and the free plan has 1 GB).
create table public.media_items (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('image', 'video_link')),
  storage_path text check (char_length(storage_path) <= 300),
  video_url    text check (char_length(video_url) <= 500),
  alt_text     text not null default '' check (char_length(alt_text) <= 300),
  caption      text not null default '' check (char_length(caption) <= 500),
  width        int,
  height       int,
  project_id   uuid references public.projects (id) on delete set null,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  check ((kind = 'image' and storage_path is not null and video_url is null)
      or (kind = 'video_link' and video_url is not null and storage_path is null))
);

alter table public.projects
  add constraint projects_cover_media_fk
  foreign key (cover_media_id) references public.media_items (id) on delete set null;

alter table public.media_items enable row level security;

grant select on public.media_items to anon, authenticated;
grant insert, update, delete on public.media_items to authenticated;

-- Media is public only through a visible project; unattached library items
-- are admin-only.
create policy "public reads media of visible projects"
  on public.media_items for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = media_items.project_id and public.project_is_public(p)
    )
  );

create policy "admins insert media"
  on public.media_items for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update media"
  on public.media_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete media"
  on public.media_items for delete
  to authenticated
  using (public.is_admin());

create index media_items_project_idx on public.media_items (project_id);

-- Storage bucket for images --------------------------------------------------
-- Public-read (these are website images), 10 MB cap, images only. Only a
-- verified admin can upload, replace or remove files.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

-- Storage needs select alongside update/delete; public files are still
-- served to everyone through the public bucket URL.
create policy "admins read media file records"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "admins upload media files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "admins update media files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin());

create policy "admins delete media files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());
