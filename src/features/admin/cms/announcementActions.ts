"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { BRANCHES, BRANCH_IDS } from "@/config/branches";
import {
  ANNOUNCEMENT_TONES,
  PROJECT_STATUSES,
  fromInputDateTime,
  type AnnouncementToneValue,
  type CmsFormState,
  type ProjectStatus,
} from "@/features/admin/cms/shared";

/** Refreshes every public page that can show a banner. */
function revalidateBannerPages() {
  for (const branch of BRANCHES) revalidatePath(branch.path);
}

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

/**
 * Accepts a path on this site ("/contact") or a full https:// address.
 * Protocol-relative "//host" and any other scheme are refused.
 */
function cleanLink(value: string): string | null | "invalid" {
  if (!value) return null;
  if (value === "/" || /^\/[^/]/.test(value)) return value;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "invalid";
  } catch {
    return "invalid";
  }
}

export async function saveAnnouncement(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();

  const id = text(formData, "id", 64) || null;
  const title = text(formData, "title", 120);
  const message = text(formData, "message", 500);
  const link = cleanLink(text(formData, "linkUrl", 500));
  const linkLabel = text(formData, "linkLabel", 40);
  const tone = text(formData, "tone", 20) as AnnouncementToneValue;
  const status = text(formData, "status", 20) as ProjectStatus;
  const publishAt = fromInputDateTime(text(formData, "publishAt", 16));
  const unpublishAt = fromInputDateTime(text(formData, "unpublishAt", 16));
  const branches = formData.getAll("branches").map(String).filter((b) => BRANCH_IDS.includes(b));

  if (!title) return { status: "error", message: "Give the announcement a headline." };
  if (link === "invalid") {
    return { status: "error", message: "The link must start with / (a page on this site) or https://." };
  }
  if (!ANNOUNCEMENT_TONES.includes(tone)) return { status: "error", message: "Choose a style." };
  if (!PROJECT_STATUSES.includes(status)) return { status: "error", message: "Choose a status." };
  if (status === "scheduled" && !publishAt) {
    return { status: "error", message: "A scheduled announcement needs a publish date and time." };
  }
  if (publishAt && unpublishAt && unpublishAt <= publishAt) {
    return { status: "error", message: "The end time must be after the start time." };
  }
  if ((status === "published" || status === "scheduled") && branches.length === 0) {
    return { status: "error", message: "Choose at least one page to show this announcement on." };
  }

  const row = {
    title,
    message,
    link_url: link,
    link_label: link ? linkLabel : "",
    tone,
    status,
    publish_at: status === "published" && !publishAt ? new Date().toISOString() : publishAt,
    unpublish_at: unpublishAt,
    branches,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const result = id
    ? await supabase.from("announcements").update(row).eq("id", id).select("id").single()
    : await supabase
        .from("announcements")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .single();

  if (result.error) {
    console.error("[admin] saveAnnouncement failed", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  await audit(id ? "announcement.update" : "announcement.create", { id: result.data.id, status });
  revalidateBannerPages();
  revalidatePath("/admin/announcements");
  if (!id) redirect(`/admin/announcements/${result.data.id}?saved=1`);
  return { status: "saved", message: "Saved." };
}

export async function deleteAnnouncement(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteAnnouncement failed", error.message);
    return;
  }

  await audit("announcement.delete", { id });
  revalidateBannerPages();
  revalidatePath("/admin/announcements");
  redirect("/admin/announcements");
}
