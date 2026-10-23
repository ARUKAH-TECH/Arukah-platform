-- Phase 5 step 2: outreach photos and videos, gated by a consent checklist.
--
-- Outreach media is kept apart from the general media library because the
-- people in it (patients, prisoners, children) need stronger protection:
--   * images live in a PRIVATE bucket and are only ever served through
--     short-lived signed links;
--   * a visitor can see an item (row AND file) only when its outreach is
--     public AND the item's consent is cleared. Both checks are in the
--     database, so a bug in a page can't leak an uncleared photo.
--
-- Consent is cleared when an admin has reviewed the item and, if it shows
-- identifiable people, children, patients or prisoners, written permission
-- has been recorded. Who gave permission is a private note in its own
-- admin-only table (public rows are readable in full through the API).

create table public.outreach_media (
  id                        uuid primary key default gen_random_uuid(),
  outreach_id               uuid not null references public.outreaches (id) on delete cascade,
  kind                      text not null check (kind in ('image', 'video_link')),
  storage_path              text unique check (char_length(storage_path) <= 300),
  video_url                 text check (char_length(video_url) <= 500),
  alt_text                  text not null default '' check (char_length(alt_text) <= 300),
  caption                   text not null default '' check (char_length(caption) <= 500),
  width                     int,
  height                    int,
  shows_identifiable_people boolean not null default false,
  shows_children            boolean not null default false,
  shows_patients            boolean not null default false,
  shows_prisoners           boolean not null default false,
  written_permission        boolean not null default false,
  consent_reviewed          boolean not null default false,
  created_by                uuid references auth.users (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check ((kind = 'image' and storage_path is not null and video_url is null)
      or (kind = 'video_link' and video_url is not null and storage_path is null))
);

create function public.outreach_media_consent_cleared(m public.outreach_media)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select m.consent_reviewed
     and (
       not (m.shows_identifiable_people or m.shows_children or m.shows_patients or m.shows_prisoners)
       or m.written_permission
     );
$$;

alter table public.outreach_media enable row level security;

grant select on public.outreach_media to anon, authenticated;
grant insert, update, delete on public.outreach_media to authenticated;

create policy "visitors read cleared media of visible outreaches"
  on public.outreach_media for select
  to anon
  using (
    public.outreach_media_consent_cleared(outreach_media)
    and exists (
      select 1 from public.outreaches o
      where o.id = outreach_media.outreach_id and public.outreach_is_public(o)
    )
  );

create policy "signed-in users read cleared media, admins read all"
  on public.outreach_media for select
  to authenticated
  using (
    public.is_admin()
    or (
      public.outreach_media_consent_cleared(outreach_media)
      and exists (
        select 1 from public.outreaches o
        where o.id = outreach_media.outreach_id and public.outreach_is_public(o)
      )
    )
  );

create policy "admins insert outreach media"
  on public.outreach_media for insert
  to authenticated
  with check (public.is_admin());

create policy "admins update outreach media"
  on public.outreach_media for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins delete outreach media"
  on public.outreach_media for delete
  to authenticated
  using (public.is_admin());

create index outreach_media_outreach_idx on public.outreach_media (outreach_id, created_at);

-- Private consent notes ------------------------------------------------------
create table public.outreach_media_private_notes (
  media_id        uuid primary key references public.outreach_media (id) on delete cascade,
  permission_note text not null default '' check (char_length(permission_note) <= 500),
  updated_at      timestamptz not null default now()
);

alter table public.outreach_media_private_notes enable row level security;

grant select, insert, update, delete on public.outreach_media_private_notes to authenticated;

create policy "admins manage outreach media notes"
  on public.outreach_media_private_notes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Private storage bucket ------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('outreach-media', 'outreach-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']);

-- A file is readable (so a signed link can be made) only when its
-- outreach_media row is readable — i.e. the RLS above already decided the
-- outreach is public and consent is cleared (or the reader is an admin).
create policy "outreach files readable when their media row is"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'outreach-media'
    and exists (select 1 from public.outreach_media m where m.storage_path = storage.objects.name)
  );

create policy "admins upload outreach files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'outreach-media' and public.is_admin());

create policy "admins update outreach files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'outreach-media' and public.is_admin());

create policy "admins delete outreach files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'outreach-media' and public.is_admin());
