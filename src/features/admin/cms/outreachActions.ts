"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { OUTREACH_TYPE_IDS, needsFacilityPermission } from "@/config/outreach";
import {
  PROJECT_STATUSES,
  fromInputDateTime,
  slugify,
  type CmsFormState,
  type ProjectStatus,
} from "@/features/admin/cms/shared";

function revalidateOutreachPages(slug?: string) {
  revalidatePath("/ministry");
  revalidatePath("/ministry/outreach");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/ministry/outreach/${slug}`);
  revalidatePath("/admin/outreach");
}

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

export async function saveOutreach(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();

  const id = text(formData, "id", 64) || null;
  const title = text(formData, "title", 150);
  const slug = slugify(text(formData, "slug", 80) || title);
  const type = text(formData, "type", 20);
  const purpose = text(formData, "purpose", 600);
  const body = text(formData, "body", 20000);
  const date = text(formData, "date", 10);
  const location = text(formData, "location", 200);
  const needs = String(formData.get("needs") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, 200))
    .filter(Boolean);
  const facilityPermission = formData.get("facilityPermission") === "on";
  const facilityPermissionNote = text(formData, "facilityPermissionNote", 300);
  const status = text(formData, "status", 20) as ProjectStatus;
  const publishAt = fromInputDateTime(text(formData, "publishAt", 16));
  const unpublishAt = fromInputDateTime(text(formData, "unpublishAt", 16));

  if (!title) return { status: "error", message: "Give the outreach a title." };
  if (!slug) return { status: "error", message: "The web address needs at least one letter or number." };
  if (!OUTREACH_TYPE_IDS.includes(type)) return { status: "error", message: "Choose the type of outreach." };
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return { status: "error", message: "Enter a valid date." };
  if (needs.length > 30) return { status: "error", message: "The needs list can have at most 30 lines." };
  if (!PROJECT_STATUSES.includes(status)) return { status: "error", message: "Choose a status." };
  if (status === "scheduled" && !publishAt) {
    return { status: "error", message: "A scheduled outreach needs a publish date and time." };
  }
  if (publishAt && unpublishAt && unpublishAt <= publishAt) {
    return { status: "error", message: "The unpublish time must be after the publish time." };
  }
  const goingLive = status === "published" || status === "scheduled";
  if (goingLive && needsFacilityPermission(type) && !facilityPermission) {
    return {
      status: "error",
      message:
        "Hospital and prison outreaches can't be published until you confirm the facility gave permission. Save it as a draft for now.",
    };
  }
  if (facilityPermission && needsFacilityPermission(type) && !facilityPermissionNote) {
    return { status: "error", message: "Note who gave the facility permission (name/role and date)." };
  }

  const row = {
    title,
    slug,
    outreach_type: type,
    purpose,
    body,
    outreach_date: date || null,
    location,
    needs,
    facility_permission: facilityPermission,
    status,
    publish_at: status === "published" && !publishAt ? new Date().toISOString() : publishAt,
    unpublish_at: unpublishAt,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const result = id
    ? await supabase.from("outreaches").update(row).eq("id", id).select("id").single()
    : await supabase
        .from("outreaches")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .single();

  if (result.error) {
    if (result.error.code === "23505") {
      return { status: "error", message: "Another outreach already uses that web address. Change it slightly." };
    }
    if (result.error.message.includes("outreach_facility_permission_before_publishing")) {
      return { status: "error", message: "Facility permission is required before publishing this outreach." };
    }
    console.error("[admin] saveOutreach failed", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  // The permission note is private, so it lives in an admin-only table.
  const { error: noteError } = await supabase.from("outreach_private_notes").upsert({
    outreach_id: result.data.id,
    facility_permission_note: facilityPermissionNote,
    updated_at: new Date().toISOString(),
  });
  if (noteError) console.error("[admin] saving outreach private note failed", noteError.message);

  await audit(id ? "outreach.update" : "outreach.create", { id: result.data.id, slug, status, type });
  revalidateOutreachPages(slug);
  if (!id) redirect(`/admin/outreach/${result.data.id}?saved=1`);
  return { status: "saved", message: "Saved." };
}

export async function deleteOutreach(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const supabase = await createClient();
  const { data: existing } = await supabase.from("outreaches").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("outreaches").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteOutreach failed", error.message);
    return;
  }

  await audit("outreach.delete", { id });
  revalidateOutreachPages(existing?.slug);
  redirect("/admin/outreach");
}
