"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { BRANCHES } from "@/config/branches";
import { parseVideoLink } from "@/lib/video";
import { fromInputDateTime, type CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;
const AD_IMAGE = /^ads\/[0-9a-f-]{36}\.webp$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function revalidateAdPages(id?: string) {
  for (const branch of BRANCHES) revalidatePath(branch.path);
  revalidatePath("/admin/adverts");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/adverts/${id}`);
}

function httpsOrNull(raw: string): string | null | "invalid" {
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:") return "invalid";
    return url.toString();
  } catch {
    return "invalid";
  }
}

export async function saveAdRequest(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return { status: "error", message: "Unknown request." };

  const status = text(formData, "status", 20);
  const startsAt = fromInputDateTime(text(formData, "startsAt", 16));
  const endsAt = fromInputDateTime(text(formData, "endsAt", 16));
  const paymentStatus = text(formData, "paymentStatus", 10);
  const reference = text(formData, "paymentReference", 200);
  const amountRaw = text(formData, "amountGhs", 20).replace(/,/g, "");
  const displayKind = text(formData, "displayKind", 10) === "video" ? "video" : "image";
  const imageChoice = text(formData, "imageChoice", 20); // "keep" | "requester" | "uploaded" | "none"
  const uploadedPath = text(formData, "uploadedPath", 120);
  const uploadedWidth = Number(formData.get("uploadedWidth")) || null;
  const uploadedHeight = Number(formData.get("uploadedHeight")) || null;
  const videoRaw = text(formData, "videoUrl", 500);
  const link = httpsOrNull(text(formData, "linkUrl", 500));
  const note = text(formData, "adminNote", 2000);

  if (!["pending", "approved", "rejected"].includes(status)) return { status: "error", message: "Choose Pending, Approve or Reject." };
  if (!["unpaid", "part", "full"].includes(paymentStatus)) return { status: "error", message: "Choose how much has been paid." };
  if (startsAt && endsAt && endsAt <= startsAt) return { status: "error", message: "The end must be after the start." };
  if (link === "invalid") return { status: "error", message: "The link must be a website address (https://…)." };

  let amount: number | null = null;
  if (amountRaw) {
    amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount < 0) return { status: "error", message: "Enter the amount as a number, e.g. 300." };
    amount = Math.round(amount * 100) / 100;
  }

  let videoUrl: string | null = null;
  if (displayKind === "video") {
    const video = parseVideoLink(videoRaw);
    if (!video) return { status: "error", message: "Paste a YouTube or TikTok link for the video." };
    videoUrl = video.url;
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("ad_requests")
    .select("request_image_path, display_image_path, display_image_width, display_image_height")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { status: "error", message: "Request not found." };

  // Work out which image to show.
  let image = {
    path: current.display_image_path as string | null,
    width: current.display_image_width as number | null,
    height: current.display_image_height as number | null,
  };
  if (displayKind === "image") {
    if (imageChoice === "uploaded") {
      if (!AD_IMAGE.test(uploadedPath)) return { status: "error", message: "Upload the image again, please." };
      image = { path: uploadedPath, width: uploadedWidth, height: uploadedHeight };
    } else if (imageChoice === "requester") {
      if (!current.request_image_path) return { status: "error", message: "This request has no photo." };
      // Copy the requester's photo from private storage into the public media bucket.
      const target = `ads/${crypto.randomUUID()}.webp`;
      const { error: copyError } = await supabase.storage
        .from("ad-requests")
        .copy(current.request_image_path, target, { destinationBucket: "media" });
      if (copyError) {
        console.error("[admin] copying request photo failed", copyError.message);
        return { status: "error", message: "Couldn't use the requester's photo. Try uploading it instead." };
      }
      image = { path: target, width: null, height: null };
    } else if (imageChoice === "none") {
      image = { path: null, width: null, height: null };
    }
  }

  if (status === "approved") {
    if (!startsAt || !endsAt) return { status: "error", message: "Set the start and end date and time before approving." };
    if (displayKind === "image" && !image.path) {
      return { status: "error", message: "Choose the image to show (the requester's photo, or upload one) before approving." };
    }
  }

  const { error } = await supabase
    .from("ad_requests")
    .update({
      status,
      starts_at: startsAt,
      ends_at: endsAt,
      amount_ghs: amount,
      payment_status: paymentStatus,
      payment_reference: reference,
      display_kind: displayKind,
      display_image_path: image.path,
      display_image_width: image.width,
      display_image_height: image.height,
      video_url: videoUrl,
      link_url: link,
      admin_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    console.error("[admin] saveAdRequest failed", error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  // Tidy up an image that's no longer used.
  if (current.display_image_path && current.display_image_path !== image.path) {
    await supabase.storage.from("media").remove([current.display_image_path]);
  }

  await audit("ad_request.update", { id, status, paymentStatus, displayKind });
  revalidateAdPages(id);
  return { status: "saved", message: status === "approved" ? "Saved. The advert shows during its dates." : "Saved." };
}

export async function deleteAdRequest(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("ad_requests")
    .select("request_image_path, display_image_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("ad_requests").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteAdRequest failed", error.message);
    return;
  }
  if (row?.request_image_path) await supabase.storage.from("ad-requests").remove([row.request_image_path]);
  if (row?.display_image_path) await supabase.storage.from("media").remove([row.display_image_path]);
  await audit("ad_request.delete", { id });
  revalidateAdPages();
  redirect("/admin/adverts");
}
