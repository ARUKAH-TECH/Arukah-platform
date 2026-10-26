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
  const seconds = Math.round(Number(formData.get("displaySeconds")) || 8);
  const bannerStyle = text(formData, "bannerStyle", 10) === "fit" ? "fit" : "roll";
  const textAdChosen = formData.get("textAd") === "1";

  if (!["pending", "approved", "rejected"].includes(status)) return { status: "error", message: "Choose Pending, Approve or Reject." };
  if (!["unpaid", "part", "full"].includes(paymentStatus)) return { status: "error", message: "Choose how much has been paid." };
  if (startsAt && endsAt && endsAt <= startsAt) return { status: "error", message: "The end must be after the start." };
  if (seconds < 3 || seconds > 120) return { status: "error", message: "Time on screen must be between 3 and 120 seconds." };
  if (link === "invalid") return { status: "error", message: "The link must be a website address (https://…)." };

  let amount: number | null = null;
  if (amountRaw) {
    amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount < 0) return { status: "error", message: "Enter the amount as a number, e.g. 300." };
    amount = Math.round(amount * 100) / 100;
  }

  let videoUrl: string | null = null;
  if (displayKind === "video") {
    const ownVideoPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ad-videos/ai/`;
    if (videoRaw.startsWith(ownVideoPrefix) && /\/ai\/[0-9a-f-]{36}\.mp4$/.test(videoRaw)) {
      videoUrl = videoRaw; // an AI video stored in our own bucket
    } else {
      const video = parseVideoLink(videoRaw);
      if (!video) return { status: "error", message: "Paste a YouTube or TikTok link for the video." };
      videoUrl = video.url;
    }
  }

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("ad_requests")
    .select("request_image_path, display_image_path, display_image_width, display_image_height, is_text_ad")
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

  // A designed text advert is only for adverts that are fully paid.
  const isTextAd =
    displayKind === "image" &&
    ((imageChoice === "uploaded" && textAdChosen) || (imageChoice === "keep" && Boolean(current.is_text_ad) && image.path === current.display_image_path));
  if (isTextAd && paymentStatus !== "full") {
    return { status: "error", message: "A text advert can only be used when the advert is Full paid." };
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
      display_seconds: seconds,
      banner_style: bannerStyle,
      is_text_ad: isTextAd,
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
    .select("request_image_path, display_image_path, ai_video_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("ad_requests").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteAdRequest failed", error.message);
    return;
  }
  if (row?.request_image_path) await supabase.storage.from("ad-requests").remove([row.request_image_path]);
  if (row?.display_image_path) await supabase.storage.from("media").remove([row.display_image_path]);
  if (row?.ai_video_path) await supabase.storage.from("ad-videos").remove([row.ai_video_path]);
  await audit("ad_request.delete", { id });
  revalidateAdPages();
  redirect("/admin/adverts");
}

// AI video -------------------------------------------------------------------

function adVideoPublicUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/ad-videos/${path}`;
}

/** Starts an AI video from the advert's image (or the requester's photo). Costs money, so admin-only. */
export async function startAiVideo(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const { aiVideoConfigured, submitImageToVideo } = await import("@/server/falVideo");
  if (!aiVideoConfigured()) {
    return { status: "error", message: "AI video isn't set up yet — add the fal.ai key in Vercel first." };
  }
  const id = text(formData, "id", 64);
  const prompt = text(formData, "aiPrompt", 1000);
  if (!UUID.test(id)) return { status: "error", message: "Unknown request." };
  if (prompt.length < 10) return { status: "error", message: "Describe the video you want in a sentence or two." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("ad_requests")
    .select("display_image_path, request_image_path, ai_video_status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { status: "error", message: "Request not found." };
  if (row.ai_video_status === "queued") return { status: "error", message: "A video is already being made. Tap “Check progress”." };

  // fal needs a web address for the picture.
  let imageUrl: string | null = null;
  if (row.display_image_path) {
    imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${row.display_image_path}`;
  } else if (row.request_image_path) {
    const { data } = await supabase.storage.from("ad-requests").createSignedUrl(row.request_image_path, 3600);
    imageUrl = data?.signedUrl ?? null;
  }
  if (!imageUrl) return { status: "error", message: "This request has no image to turn into a video." };

  try {
    const job = await submitImageToVideo(imageUrl, prompt);
    const { error } = await supabase
      .from("ad_requests")
      .update({
        ai_video_status: "queued",
        ai_video_prompt: prompt,
        ai_video_status_url: job.statusUrl,
        ai_video_response_url: job.responseUrl,
        ai_video_error: "",
        ai_video_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("[admin] startAiVideo failed", (error as Error).message);
    return { status: "error", message: (error as Error).message || "Couldn't start the video." };
  }

  await audit("ad_request.ai_video_start", { id });
  revalidatePath(`/admin/adverts/${id}`);
  return { status: "saved", message: "Started. It usually takes 1–5 minutes — tap “Check progress” in a minute." };
}

/** Checks the AI job; when it's finished, keeps our own copy of the video. */
export async function checkAiVideo(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const { getJobStatus, fetchFinishedVideo } = await import("@/server/falVideo");
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return { status: "error", message: "Unknown request." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("ad_requests")
    .select("ai_video_status, ai_video_status_url, ai_video_response_url, ai_video_path")
    .eq("id", id)
    .maybeSingle();
  if (!row || row.ai_video_status !== "queued" || !row.ai_video_status_url || !row.ai_video_response_url) {
    return { status: "error", message: "No video is being made right now." };
  }

  try {
    const status = await getJobStatus(row.ai_video_status_url);
    if (status === "IN_QUEUE" || status === "IN_PROGRESS") {
      return { status: "saved", message: status === "IN_QUEUE" ? "Waiting in line… check again in a minute." : "Being made… check again in a minute." };
    }
    if (status !== "COMPLETED") throw new Error(`The AI job ended with status ${status}.`);

    const video = await fetchFinishedVideo(row.ai_video_response_url);
    const path = `ai/${crypto.randomUUID()}.mp4`;
    const { error: uploadError } = await supabase.storage
      .from("ad-videos")
      .upload(path, video, { contentType: "video/mp4", cacheControl: "31536000" });
    if (uploadError) throw new Error(`Couldn't save the video: ${uploadError.message}`);

    if (row.ai_video_path) await supabase.storage.from("ad-videos").remove([row.ai_video_path]);
    await supabase
      .from("ad_requests")
      .update({ ai_video_status: "ready", ai_video_path: path, ai_video_error: "", updated_at: new Date().toISOString() })
      .eq("id", id);
  } catch (error) {
    const message = ((error as Error).message || "The AI video failed.").slice(0, 500);
    console.error("[admin] checkAiVideo failed", message);
    await supabase.from("ad_requests").update({ ai_video_status: "failed", ai_video_error: message }).eq("id", id);
    revalidatePath(`/admin/adverts/${id}`);
    return { status: "error", message };
  }

  await audit("ad_request.ai_video_ready", { id });
  revalidatePath(`/admin/adverts/${id}`);
  return { status: "saved", message: "Your AI video is ready — preview it below." };
}

/** Makes the finished AI video the advert (shown as a video advert). */
export async function useAiVideo(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: row } = await supabase.from("ad_requests").select("ai_video_path").eq("id", id).maybeSingle();
  if (!row?.ai_video_path) return;
  await supabase
    .from("ad_requests")
    .update({ display_kind: "video", video_url: adVideoPublicUrl(row.ai_video_path), updated_at: new Date().toISOString() })
    .eq("id", id);
  await audit("ad_request.ai_video_use", { id });
  revalidateAdPages(id);
}
