import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/features/admin/AdminShell";
import { GALLERY_BRANCHES } from "@/config/gallery";
import { GalleryUploader } from "@/features/admin/cms/GalleryUploader";
import { deleteGalleryPhoto, updateGalleryCaption } from "@/features/admin/cms/galleryActions";
import { mediaPublicUrl } from "@/lib/supabase/public";
import { fieldClasses } from "@/features/admin/ui";

export const metadata: Metadata = { title: "Gallery" };

export default async function GalleryAdminPage({ searchParams }: PageProps<"/admin/gallery">) {
  const admin = await requireAdmin();
  const { page } = await searchParams;
  const branch = GALLERY_BRANCHES.find((b) => b.id === page) ?? GALLERY_BRANCHES[0];
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("id, storage_path, caption")
    .eq("branch", branch.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <AdminShell email={admin.email}>
      <h1 className="text-2xl font-semibold tracking-tight">Gallery — photos of your work</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        Photos added here appear in an &quot;Our work&quot; section on that page. Choose the page first.
      </p>
      <nav className="mt-5 flex flex-wrap gap-2 text-sm">
        {GALLERY_BRANCHES.map((b) => (
          <Link
            key={b.id}
            href={`/admin/gallery?page=${b.id}`}
            className={`rounded-full border px-3 py-1 ${b.id === branch.id ? "border-brand-primary-text font-medium" : "border-black/10 dark:border-white/10"}`}
          >
            {b.label}
          </Link>
        ))}
      </nav>

      <section className="mt-6 max-w-xl rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">Add photos to {branch.label}</h2>
        <div className="mt-4">
          <GalleryUploader branch={branch.id} />
        </div>
      </section>

      <h2 className="mt-10 text-sm font-semibold">
        On the page now ({photos?.length ?? 0}) ·{" "}
        <Link href={branch.path} target="_blank" className="font-normal text-brand-primary-text underline">
          view page
        </Link>
      </h2>
      {!photos?.length ? (
        <p className="mt-3 text-sm text-foreground/60">No photos yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo.id} className="flex flex-col gap-2 rounded-xl border border-black/10 p-2 dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
              <img src={mediaPublicUrl(photo.storage_path)} alt="" className="aspect-square w-full rounded-lg object-cover" />
              <form action={updateGalleryCaption} className="flex gap-1">
                <input type="hidden" name="id" value={photo.id} />
                <input name="caption" defaultValue={photo.caption} maxLength={300} placeholder="Caption" className={`${fieldClasses} mt-0 text-xs`} />
                <button type="submit" className="shrink-0 rounded-lg border border-black/15 px-2 text-xs dark:border-white/15">
                  Save
                </button>
              </form>
              <form action={deleteGalleryPhoto}>
                <input type="hidden" name="id" value={photo.id} />
                <button type="submit" className="text-xs text-red-700 underline dark:text-red-400">
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
