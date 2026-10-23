"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { parseVideoLink } from "@/lib/video";
import type { CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

async function revalidateOutreach(outreachId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("outreaches").select("slug").eq("id", outreachId).maybeSingle();
  revalidatePath(`/admin/outreach/${outreachId}`);
  revalidatePath("/ministry");
  revalidatePath("/ministry/outreach");
  if (data?.slug) revalidatePath(`/ministry/outreach/${data.slug}`);
}

/** Records an image the browser has already uploaded to the private "outreach-media" bucket. */
export async function registerOutreachImage(input: {
  outreachId: string;
  storagePath: string;
  width: number;
  height: number;
  altText: string;
}): Promise<CmsFormState> {
  const admin = await requireAdmin();
  if (!UUID.test(input.outreachId)) return { status: "error", message: "Unknown outreach." };
  // The uploader names files <outreach id>/<uuid>.webp; refuse anything else.
  if (!new RegExp(`^${input.outreachId}/[0-9a-f-]{36}\\.webp$`).test(input.storagePath)) {
    return { status: "error", message: "Unexpected file name." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("outreach_media").insert({
    outreach_id: input.outreachId,
    kind: "image",
    storage_path: input.storagePath,
    width: Math.round(input.width) || null,
    height: Math.round(input.height) || null,
    alt_text: input.altText.trim().slice(0, 300),
    created_by: admin.userId,
  });
  if (error) {
    console.error("[admin] registerOutreachImage failed", error.message);
    // Don't leave an unreferenced private file behind.
    await supabase.storage.from("outreach-media").remove([input.storagePath]);
    return { status: "error", message: "The image uploaded but couldn't be saved. Please try again." };
  }

  await audit("outreach_media.upload", { outreachId: input.outreachId });
  await revalidateOutreach(input.outreachId);
  return { status: "saved", message: "Uploaded." };
}

export async function addOutreachVideo(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();
  const outreachId = text(formData, "outreachId", 64);
  if (!UUID.test(outreachId)) return { status: "error", message: "Unknown outreach." };
  const video = parseVideoLink(text(formData, "videoUrl", 500));
  if (!video) return { status: "error", message: "Paste a full YouTube or TikTok link (starting with https://)." };

  const supabase = await createClient();
  const { error } = await supabase.from("outreach_media").insert({
    outreach_id: outreachId,
    kind: "video_link",
    video_url: video.url,
    caption: text(formData, "caption", 500),
    created_by: admin.userId,
  });
  if (error) {
    console.error("[admin] addOutreachVideo failed", error.message);
    return { status: "error", message: "Couldn't save the video link." };
  }

  await audit("outreach_media.video_link", { outreachId });
  await revalidateOutreach(outreachId);
  return { status: "saved", message: "Video added. Complete its consent checklist to show it on the site." };
}

/** Saves the description, caption and consent checklist for one item. */
export async function updateOutreachMedia(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return { status: "error", message: "Unknown item." };

  const flags = {
    shows_identifiable_people: formData.get("identifiable") === "on",
    shows_children: formData.get("children") === "on",
    shows_patients: formData.get("patients") === "on",
    shows_prisoners: formData.get("prisoners") === "on",
  };
  const sensitive = Object.values(flags).some(Boolean);
  const writtenPermission = formData.get("writtenPermission") === "on";
  const permissionNote = text(formData, "permissionNote", 500);
  const reviewed = formData.get("reviewed") === "on";

  if (writtenPermission && !permissionNote) {
    return { status: "error", message: "Note who gave written permission and where it is kept." };
  }

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("outreach_media")
    .update({
      alt_text: text(formData, "altText", 300),
      caption: text(formData, "caption", 500),
      ...flags,
      written_permission: writtenPermission,
      consent_reviewed: reviewed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("outreach_id")
    .single();
  if (error || !item) {
    console.error("[admin] updateOutreachMedia failed", error?.message);
    return { status: "error", message: "Couldn't save changes." };
  }

  const { error: noteError } = await supabase.from("outreach_media_private_notes").upsert({
    media_id: id,
    permission_note: permissionNote,
    updated_at: new Date().toISOString(),
  });
  if (noteError) console.error("[admin] saving outreach media note failed", noteError.message);

  const cleared = reviewed && (!sensitive || writtenPermission);
  await audit("outreach_media.consent", { id, reviewed, sensitive, writtenPermission, cleared });
  await revalidateOutreach(item.outreach_id);
  return {
    status: "saved",
    message: cleared
      ? "Saved. Cleared to show on the site (once the outreach is published)."
      : sensitive && !writtenPermission
        ? "Saved. Hidden from the site until written permission is recorded."
        : "Saved. Hidden from the site until you tick “I have reviewed this”.",
  };
}

export async function deleteOutreachMedia(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("outreach_media")
    .select("outreach_id, storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!item) return;

  // File first: the storage policy needs the row to still exist.
  if (item.storage_path) await supabase.storage.from("outreach-media").remove([item.storage_path]);
  const { error } = await supabase.from("outreach_media").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteOutreachMedia failed", error.message);
    return;
  }

  await audit("outreach_media.delete", { id });
  await revalidateOutreach(item.outreach_id);
}
