"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { BRANCHES } from "@/config/branches";
import { AD_BRANCH_IDS } from "@/features/admin/cms/adStatus";
import type { CmsFormState } from "@/features/admin/cms/shared";

const UUID = /^[0-9a-f-]{36}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function revalidateAdPages() {
  for (const branch of BRANCHES) revalidatePath(branch.path);
  revalidatePath("/admin/ads");
}

export async function saveAd(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  const admin = await requireAdmin();

  const id = text(formData, "id", 64) || null;
  const advertiserId = text(formData, "advertiserId", 64);
  const headline = text(formData, "headline", 100);
  const body = text(formData, "body", 200);
  const ctaLabel = text(formData, "ctaLabel", 30);
  const imagePath = text(formData, "imagePath", 120) || null;
  const imageWidth = Number(formData.get("imageWidth")) || null;
  const imageHeight = Number(formData.get("imageHeight")) || null;
  const placements = formData.getAll("placements").map(String).filter((b) => AD_BRANCH_IDS.includes(b));
  const contentStatus = text(formData, "contentStatus", 20);
  const format = text(formData, "format", 10) === "banner" ? "banner" : "card";
  const paymentConfirmed = formData.get("paymentConfirmed") === "on";
  const startsOn = text(formData, "startsOn", 10);
  const endsOn = text(formData, "endsOn", 10);
  const amountRaw = text(formData, "amountGhs", 20);
  const reference = text(formData, "paymentReference", 200);
  const paymentNote = text(formData, "paymentNote", 1000);

  let destination = text(formData, "destinationUrl", 500);
  try {
    const url = new URL(destination);
    if (url.protocol !== "https:") throw new Error("not https");
    destination = url.toString();
  } catch {
    return { status: "error", message: "The link must be a full address starting with https://" };
  }

  if (!UUID.test(advertiserId)) return { status: "error", message: "Choose the advertiser." };
  if (!headline) return { status: "error", message: "Give the advert a headline." };
  if (imagePath && !/^ads\/[0-9a-f-]{36}\.webp$/.test(imagePath)) return { status: "error", message: "Unexpected image." };
  if (!["pending", "approved", "rejected"].includes(contentStatus)) return { status: "error", message: "Choose a content decision." };
  if (!DATE.test(startsOn) || !DATE.test(endsOn)) return { status: "error", message: "Enter a start and end date." };
  if (endsOn < startsOn) return { status: "error", message: "The end date must be on or after the start date." };
  if (format === "banner" && !imagePath) {
    return { status: "error", message: "A top banner needs an image. Upload one (ideally 1200 × 150) and save again." };
  }
  if (placements.length === 0) return { status: "error", message: "Choose at least one page to show the advert on." };

  let amount: number | null = null;
  if (amountRaw) {
    amount = Number(amountRaw.replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount < 0) return { status: "error", message: "Enter the amount as a number, e.g. 500." };
    amount = Math.round(amount * 100) / 100;
  }
  if (paymentConfirmed && !reference && !paymentNote) {
    return { status: "error", message: "When confirming payment, add the payment reference or a note on how it was paid." };
  }

  const row = {
    advertiser_id: advertiserId,
    headline,
    body,
    cta_label: ctaLabel,
    image_path: imagePath,
    image_width: imagePath ? imageWidth : null,
    image_height: imagePath ? imageHeight : null,
    destination_url: destination,
    placements,
    content_status: contentStatus,
    format,
    payment_confirmed: paymentConfirmed,
    starts_on: startsOn,
    ends_on: endsOn,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  // Remember the current image so a replaced one doesn't linger in storage.
  const previousImage = id
    ? ((await supabase.from("ads").select("image_path").eq("id", id).maybeSingle()).data?.image_path ?? null)
    : null;
  const result = id
    ? await supabase.from("ads").update(row).eq("id", id).select("id").single()
    : await supabase
        .from("ads")
        .insert({ ...row, created_by: admin.userId })
        .select("id")
        .single();
  if (result.error) {
    console.error("[admin] saveAd failed", result.error.message);
    return { status: "error", message: "Couldn't save. Please try again." };
  }

  if (previousImage && previousImage !== imagePath) {
    await supabase.storage.from("media").remove([previousImage]);
  }

  const { error: payError } = await supabase.from("ad_payments").upsert({
    ad_id: result.data.id,
    amount_ghs: amount,
    reference,
    note: paymentNote,
    updated_at: new Date().toISOString(),
  });
  if (payError) console.error("[admin] saving ad payment failed", payError.message);

  await audit(id ? "ad.update" : "ad.create", { id: result.data.id, contentStatus, paymentConfirmed });
  revalidateAdPages();
  revalidatePath(`/admin/ads/${result.data.id}`);
  if (!id) redirect(`/admin/ads/${result.data.id}?saved=1`);
  return { status: "saved", message: "Saved." };
}

export async function deleteAd(formData: FormData) {
  await requireAdmin();
  const id = text(formData, "id", 64);
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: ad } = await supabase.from("ads").select("image_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("ads").delete().eq("id", id);
  if (error) {
    console.error("[admin] deleteAd failed", error.message);
    return;
  }
  if (ad?.image_path) await supabase.storage.from("media").remove([ad.image_path]);
  await audit("ad.delete", { id });
  revalidateAdPages();
  redirect("/admin/ads");
}

/** Which divisions currently carry adverts. */
export async function saveAdSettings(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const on = new Set(formData.getAll("accepts").map(String));
  const supabase = await createClient();
  for (const branch of AD_BRANCH_IDS) {
    const { error } = await supabase
      .from("ad_settings")
      .update({ accepts_ads: on.has(branch), updated_at: new Date().toISOString() })
      .eq("branch", branch);
    if (error) {
      console.error("[admin] saveAdSettings failed", error.message);
      return { status: "error", message: "Couldn't save. Please try again." };
    }
  }
  await audit("ad.settings", { accepts: [...on] });
  revalidateAdPages();
  return { status: "saved", message: "Saved." };
}
