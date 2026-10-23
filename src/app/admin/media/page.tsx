import type { Metadata } from "next";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { ImageUploader } from "@/features/admin/cms/ImageUploader";
import { VideoLinkForm } from "@/features/admin/cms/VideoLinkForm";
import { MediaGrid } from "@/features/admin/cms/MediaGrid";

export const metadata: Metadata = { title: "Media library" };

export default async function AdminMediaPage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ data: media }, { data: projects }] = await Promise.all([
    supabase
      .from("media_items")
      .select("id, kind, storage_path, video_url, alt_text, caption, project_id")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("projects").select("id, title").order("title"),
  ]);

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Media library</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Items only appear on the public site once they&apos;re attached to a published project.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold">Upload photos</h2>
          <ImageUploader projects={projects ?? []} />
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold">Add a video</h2>
          <VideoLinkForm projects={projects ?? []} />
        </div>
      </div>

      <h2 className="mt-12 text-lg font-semibold">All items</h2>
      <MediaGrid items={media ?? []} projects={projects ?? []} />
    </AdminShell>
  );
}
