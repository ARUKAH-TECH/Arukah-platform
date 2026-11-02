"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "@/server/auth";
import { slugify, type CmsFormState } from "@/features/admin/cms/shared";
import { PLATFORMS, PROGRAMME_STATUSES, isTimeZone, zonedInputToIso, type Platform, type ProgrammeStatus } from "@/features/programmes/shared";

const UUID = /^[0-9a-f-]{36}$/;
const IMAGE = /^programmes\/[0-9a-f-]{36}\.webp$/;

function text(formData: FormData, key: string, max: number) {
  return String(formData.get(key) ?? "").trim().slice(0, max);
}

function revalidateProgrammePages(slug?: string) {
  revalidatePath("/admin/programmes");
  revalidatePath("/programmes");
  if (slug) revalidatePath(`/programmes/${slug}`);
}

export async function saveProgramme(_prev: CmsFormState, formData: FormData): Promise<CmsFormState> {
  await requireAdmin();
  const id = text(formData, "id", 64) || null;
  if (id && !UUID.test(id)) return { status: "error", message: "Unknown programme." };

  const title = text(formData, "title", 140);
  const tz = text(formData, "timeZone", 60) || "Africa/Accra";
  if (!isTimeZone(tz)) return { status: "error", message: "Choose a time zone." };
  const when = (key: string) => zonedInputToIso(text(formData, key, 16), tz);
  const startsAt = when("startsAt");
  const endsAt = when("endsAt");
  const regOpensAt = when("regOpensAt");
  const regClosesAt = when("regClosesAt");
  const status = text(formData, "status", 20) as ProgrammeStatus;
  const platform = text(formData, "platform", 20) as Platform;
  const platformName = text(formData, "platformName", 60);
  const approval = text(formData, "approval", 10) === "manual" ? "manual" : "auto";
  const paid = text(formData, "paid", 5) === "yes";
  const priceRaw = text(formData, "price", 20).replace(/,/g, "");
  const capacityRaw = text(formData, "capacity", 10);
  const codeHoursRaw = text(formData, "codeValidHours", 6);
  const joinLinkRaw = text(formData, "joinLink", 500);
  const joinInstructions = text(formData, "joinInstructions", 3000);
  const imagePath = text(formData, "imagePath", 120);
  const imageWidth = Number(formData.get("imageWidth")) || null;
  const imageHeight = Number(formData.get("imageHeight")) || null;
  let slug = slugify(text(formData, "slug", 80) || title);

  if (title.length < 3) return { status: "error", message: "Give the programme a title." };
  if (!slug) return { status: "error", message: "Give the programme a web address (letters and numbers)." };
  if (!PROGRAMME_STATUSES.includes(status)) return { status: "error", message: "Choose a status." };
  if (!PLATFORMS.includes(platform)) return { status: "error", message: "Choose the meeting platform." };
  if (platform === "other" && !platformName) return { status: "error", message: "Type the name of the meeting platform." };
  if (!startsAt || !endsAt) return { status: "error", message: "Set the date with start and end time." };
  if (endsAt <= startsAt) return { status: "error", message: "The end time must be after the start time." };
  if (regOpensAt && regClosesAt && regClosesAt <= regOpensAt) return { status: "error", message: "Registration must close after it opens." };
  if (imagePath && !IMAGE.test(imagePath)) return { status: "error", message: "Upload the picture again, please." };

  let price = 0;
  if (paid) {
    price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 1) return { status: "error", message: "Enter the price in cedis (at least GHS 1), or choose Free." };
    price = Math.round(price * 100) / 100;
  }
  let capacity: number | null = null;
  if (capacityRaw) {
    capacity = Math.round(Number(capacityRaw));
    if (!Number.isFinite(capacity) || capacity < 1) return { status: "error", message: "Places must be a number (or leave it empty for no limit)." };
  }
  const codeValidHours = codeHoursRaw === "" ? 24 : Math.round(Number(codeHoursRaw));
  if (!Number.isFinite(codeValidHours) || codeValidHours < 0 || codeValidHours > 8760) return { status: "error", message: "Code hours must be between 0 and 8760." };

  let joinLink: string | null = null;
  if (joinLinkRaw) {
    try {
      const url = new URL(/^https?:\/\//i.test(joinLinkRaw) ? joinLinkRaw : `https://${joinLinkRaw}`);
      if (url.protocol !== "https:") throw new Error();
      joinLink = url.toString();
    } catch {
      return { status: "error", message: "The joining link must be a web address starting with https://" };
    }
  }

  const row = {
    slug,
    title,
    summary: text(formData, "summary", 300),
    description: text(formData, "description", 6000),
    category: text(formData, "category", 60),
    image_path: imagePath || null,
    image_width: imagePath ? imageWidth : null,
    image_height: imagePath ? imageHeight : null,
    starts_at: startsAt,
    ends_at: endsAt,
    time_zone: tz,
    schedule_note: text(formData, "scheduleNote", 120),
    reg_opens_at: regOpensAt,
    reg_closes_at: regClosesAt,
    capacity,
    price_ghs: price,
    approval,
    status,
    platform,
    platform_name: platform === "other" ? platformName : "",
    code_valid_hours: codeValidHours,
    code_single_use: formData.get("codeSingleUse") === "on",
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  // Keep web addresses unique.
  const { data: clash } = await supabase.from("programmes").select("id").eq("slug", slug).maybeSingle();
  if (clash && clash.id !== id) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  row.slug = slug;

  let savedId = id;
  let oldImage: string | null = null;
  if (id) {
    const { data: current } = await supabase.from("programmes").select("image_path").eq("id", id).maybeSingle();
    if (!current) return { status: "error", message: "Programme not found." };
    oldImage = current.image_path;
    const { error } = await supabase.from("programmes").update(row).eq("id", id);
    if (error) {
      console.error("[admin] programme update failed", error.message);
      return { status: "error", message: "Couldn't save. Please check the details and try again." };
    }
  } else {
    const { data, error } = await supabase.from("programmes").insert(row).select("id").single();
    if (error || !data) {
      console.error("[admin] programme insert failed", error?.message);
      return { status: "error", message: "Couldn't save. Please check the details and try again." };
    }
    savedId = data.id;
  }

  const { error: privError } = await supabase
    .from("programme_private")
    .upsert({ programme_id: savedId, join_link: joinLink, join_instructions: joinInstructions, updated_at: new Date().toISOString() });
  if (privError) {
    console.error("[admin] joining details failed", privError.message);
    return { status: "error", message: "The programme was saved, but the joining details weren't. Please save again." };
  }

  if (oldImage && oldImage !== row.image_path) await supabase.storage.from("media").remove([oldImage]);
  await audit(id ? "programme.update" : "programme.create", { id: savedId, status });
  revalidateProgrammePages(slug);
  if (!id) redirect(`/admin/programmes/${savedId}?saved=1`);
  return { status: "saved", message: status === "published" ? "Saved. It is published." : "Saved." };
}

export async function deleteProgramme(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return;
  const supabase = await createClient();
  const { data: current } = await supabase.from("programmes").select("image_path, slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("programmes").delete().eq("id", id);
  if (error) {
    console.error("[admin] programme delete failed", error.message);
    return;
  }
  if (current?.image_path) await supabase.storage.from("media").remove([current.image_path]);
  await audit("programme.delete", { id });
  revalidateProgrammePages(current?.slug);
  redirect("/admin/programmes");
}
