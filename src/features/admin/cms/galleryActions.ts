"use server";

import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/server/auth";
import { createClient } from "@/lib/supabase/server";
import { GALLERY_BRANCHES } from "@/config/gallery";

function revalidateBranch(branch: string) {
  const path = GALLERY_BRANCHES.find((b) => b.id === branch)?.path;
  if (path) revalidatePath(path);
  revalidatePath("/admin/gallery");
}

export async function registerGalleryPhoto(input: {
  branch: string;
  storagePath: string;
  width: number;
  height: number;
  caption: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = await requireAdmin();
  if (!GALLERY_BRANCHES.some((b) => b.id === input.branch)) return { ok: false, message: "Choose a page." };
  if (!/^gallery\/[0-9a-f-]{36}\.webp$/.test(input.storagePath)) return { ok: false, message: "Unexpected file name." };
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_photos").insert({
    branch: input.branch,
    storage_path: input.storagePath,
    width: Math.round(input.width) || null,
    height: Math.round(input.height) || null,
    caption: input.caption.trim().slice(0, 300),
    created_by: admin.userId,
  });
  if (error) {
    console.error("[admin] gallery insert failed", error.message);
    return { ok: false, message: "The photo uploaded but couldn't be saved. Please try again." };
  }
  await audit("gallery.add", { branch: input.branch, storagePath: input.storagePath });
  revalidateBranch(input.branch);
  return { ok: true, message: "Added." };
}

export async function updateGalleryCaption(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("gallery_photos")
    .update({ caption: String(formData.get("caption") ?? "").trim().slice(0, 300) })
    .eq("id", id)
    .select("branch")
    .maybeSingle();
  if (data) revalidateBranch(data.branch);
}

export async function deleteGalleryPhoto(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  const supabase = await createClient();
  const { data } = await supabase.from("gallery_photos").select("branch, storage_path").eq("id", id).maybeSingle();
  if (!data) return;
  const { error } = await supabase.from("gallery_photos").delete().eq("id", id);
  if (error) {
    console.error("[admin] gallery delete failed", error.message);
    return;
  }
  await supabase.storage.from("media").remove([data.storage_path]);
  await audit("gallery.delete", { id });
  revalidateBranch(data.branch);
}
