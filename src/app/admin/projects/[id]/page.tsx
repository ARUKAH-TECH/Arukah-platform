import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { ProjectForm } from "@/features/admin/cms/ProjectForm";
import { ImageUploader } from "@/features/admin/cms/ImageUploader";
import { VideoLinkForm } from "@/features/admin/cms/VideoLinkForm";
import { MediaGrid } from "@/features/admin/cms/MediaGrid";

export const metadata: Metadata = { title: "Edit project" };

export default async function EditProjectPage({ params, searchParams }: PageProps<"/admin/projects/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { saved } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: project }, { data: allProjects }, { data: media }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, slug, summary, body, status, publish_at, unpublish_at, branches, cover_media_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("projects").select("id, title").order("title"),
    supabase
      .from("media_items")
      .select("id, kind, storage_path, video_url, alt_text, caption, project_id")
      .eq("project_id", id)
      .order("created_at"),
  ]);
  if (!project) notFound();

  const projects = allProjects ?? [];
  const images = (media ?? [])
    .filter((item) => item.kind === "image")
    .map((item, index) => ({ id: item.id, label: item.alt_text || `Image ${index + 1}` }));
  const isLive = project.status === "published" || project.status === "scheduled";

  return (
    <AdminShell email={admin.email}>
      <Link href="/admin/projects" className="text-sm text-foreground/60 hover:text-brand-primary-text">
        ← All projects
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{project.title}</h1>
        {isLive && (
          <Link href={`/projects/${project.slug}`} target="_blank" className="text-sm text-brand-primary-text hover:underline">
            View on site ↗
          </Link>
        )}
      </div>

      <div className="mt-8 max-w-3xl">
        <ProjectForm
          justSaved={saved === "1"}
          images={images}
          project={{
            id: project.id,
            title: project.title,
            slug: project.slug,
            summary: project.summary,
            body: project.body,
            status: project.status,
            publishAt: project.publish_at,
            unpublishAt: project.unpublish_at,
            branches: project.branches,
            coverMediaId: project.cover_media_id,
          }}
        />
      </div>

      <section className="mt-12 border-t border-black/10 pt-8 dark:border-white/10">
        <h2 className="text-lg font-semibold">Photos and videos</h2>
        <MediaGrid items={media ?? []} projects={projects} />
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold">Upload photos</h3>
            <ImageUploader projects={projects} defaultProjectId={project.id} />
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold">Add a video</h3>
            <VideoLinkForm projects={projects} defaultProjectId={project.id} />
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
