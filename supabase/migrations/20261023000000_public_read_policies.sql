-- Fix: anonymous visitors could not read published projects.
--
-- The original read policies covered both `anon` and `authenticated` and
-- called public.is_admin(), but EXECUTE on is_admin() is (deliberately)
-- revoked from anon. Postgres therefore raised "permission denied for
-- function is_admin" for every anonymous read, so the public site would
-- never have shown a published project.
--
-- Split each read policy by role: visitors get the plain visibility rule;
-- signed-in users additionally see everything when they are a verified admin.
-- is_admin() stays non-executable for anon. (Done with ALTER rather than
-- DROP/CREATE so the existing policy is changed in place.)

alter policy "public reads visible projects" on public.projects
  rename to "visitors read visible projects";
alter policy "visitors read visible projects" on public.projects
  to anon
  using (public.project_is_public(projects));

create policy "signed-in users read visible projects, admins read all"
  on public.projects for select
  to authenticated
  using (public.project_is_public(projects) or public.is_admin());

alter policy "public reads media of visible projects" on public.media_items
  rename to "visitors read media of visible projects";
alter policy "visitors read media of visible projects" on public.media_items
  to anon
  using (
    exists (
      select 1 from public.projects p
      where p.id = media_items.project_id and public.project_is_public(p)
    )
  );

create policy "signed-in users read media of visible projects, admins read all"
  on public.media_items for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = media_items.project_id and public.project_is_public(p)
    )
  );
