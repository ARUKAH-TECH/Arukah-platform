"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { BRANCHES, BRANCH_IDS } from "@/config/branches";
import { parseVideoLink } from "@/lib/video";
import {
  PROJECT_STATUSES,
  fromInputDateTime,
  slugify,
  type CmsFormState,
  type ProjectStatus,
} from "@/features/admin/cms/shared";

/** Refreshes every public page that can show projects. */
function revalidatePublicPages(slug?: string) {
  for (const branch of BRANCHES) revalidatePath(branch.path);
  revalidatePath("/projects");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/projects/${slug}`);
}

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

// Projects -------------------------------------------------------------------

export async function saveProject(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();

  const id = text(formData, "id", 64) || null;
  const title = text(formData, "title", 150);
  const slug = slugify(text(formData, "slug", 80) || title);
  const summary = text(formData, "summary", 300);
  const body = text(formData, "body", 20000);
  const status = text(formData, "status", 20) as ProjectStatus;
  const publishAt = fromInputDateTime(text(formData, "publishAt", 16));
  const unpublishAt = fromInputDateTime(text(formData, "unpublishAt", 16));
  const branches = formData.getAll("branches").map(String).filter((b) => BRANCH_IDS.includes(b));
  const coverMediaId = text(formData, "coverMediaId", 64) || null;

  if (!title) return { status: "error", message: "Give the project a title." };
  if (!slug) return { status: "error", message: "The web address needs at least one letter or number." };
  if (!PROJECT_STATUSES.includes(status)) return { status: "error", message: "Choose a status." };
  if (status === "scheduled" && !publishAt) {
    return { status: "error", message: "A scheduled project needs a publish date and time." };
  }
  if (publishAt && unpublishAt && unpublishAt <= publishAt) {
    return { status: "error", message: "The unpublish time must be after the publish time." };
  }
  if ((status === "published" || status === "scheduled") && branches.length === 0) {
    return { status: "error", message: "Choose at least one place to show this project." };
  }

  const row = {
    title,
    slug,
    summary,
    body,
    status,
    // Publishing now without a date records the moment it went live.
    publish_at: status === "published" && !publishAt ? new Date().toISOString() : publishAt,
    unpublish_at: unpublishAt,
    branches,
    cover_media_id: coverMediaId,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const result = id
    ? await supabase.from("projects").update(row).eq("id", id).select("id").single()
    : await supabase
        .from("projects")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .single();

  if (result.error) {
    if (result.error.code === "23505") {
      return { status: "error", message: "Another project already uses that web address. Change it slightly." };
    }
    console.error("[admin] saveProject failed", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  await audit(id ? "project.update" : "project.create", { id: result.data.id, slug, status });
  revalidatePublicPages(slug);
  if (!id) redirect(`/admin/projects/${result.data.id}?saved=1`);
  return { status: "saved", message: "Saved." };
}

// Media ----------------------------------------------------------------------

/** Records an image the browser has already uploaded to the "media" bucket. */
export async function registerImage(input: {
  storagePath: string;
  width: number;
  height: number;
  altText: string;
  projectId: string | null;
}): Promise<CmsFormState> {
  const admin = await requireAdmin();
  // Uploads are named <uuid>.<ext> by the uploader; refuse anything else.
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(input.storagePath)) {
    return { status: "error", message: "Unexpected file name." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("media_items").insert({
    kind: "image",
    storage_path: input.storagePath,
    width: Math.round(input.width) || null,
    height: Math.round(input.height) || null,
    alt_text: input.altText.trim().slice(0, 300),
    project_id: input.projectId || null,
    created_by: admin.userId,
  });
  if (error) {
    console.error("[admin] registerImage failed", error.message);
    return { status: "error", message: "The image uploaded but couldn't be saved to the library." };
  }

  await audit("media.upload", { storagePath: input.storagePath });
  revalidatePath("/admin/media");
  revalidatePublicPages();
  return { status: "saved", message: "Uploaded." };
}

export async function addVideoLink(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();
  const video = parseVideoLink(text(formData, "videoUrl", 500));
  if (!video) {
    return { status: "error", message: "Paste a full YouTube or TikTok link (starting with https://)." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("media_items").insert({
    kind: "video_link",
    video_url: video.url,
    caption: text(formData, "caption", 500),
    project_id: text(formData, "projectId", 64) || null,
    created_by: admin.userId,
  });
  if (error) {
    console.error("[admin] addVideoLink failed", error.message);
    return { status: "error", message: "Couldn't save the video link." };
  }

  await audit("media.video_link", { url: video.url });
  revalidatePath("/admin/media");
  revalidatePublicPages();
  return { status: "saved", message: "Video link added." };
}

export async function updateMedia(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64);
  const supabase = await createClient();
  const { error } = await supabase
    .from("media_items")
    .update({
      alt_text: text(formData, "altText", 300),
      caption: text(formData, "caption", 500),
      project_id: text(formData, "projectId", 64) || null,
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] updateMedia failed", error.message);
    return { status: "error", message: "Couldn't save changes." };
  }

  await audit("media.update", { id });
  revalidatePath("/admin/media");
  revalidatePublicPages();
  return { status: "saved", message: "Saved." };
}

/** Removes a library item (and its stored file). The project itself is untouched. */
export async function deleteMedia(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("media_items")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!item) return;

  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteMedia failed", error.message);
    return;
  }
  if (item.storage_path) await supabase.storage.from("media").remove([item.storage_path]);

  await audit("media.delete", { id, storagePath: item.storage_path });
  revalidatePath("/admin/media");
  revalidatePublicPages();
}
