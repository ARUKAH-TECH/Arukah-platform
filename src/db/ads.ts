import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";
import type { BranchId } from "@/config/branches";

export interface LiveAd {
  id: string;
  kind: "image" | "video";
  label: string;
  image: { url: string; width: number | null; height: number | null } | null;
  videoUrl: string | null;
  linkUrl: string | null;
}

interface LiveAdRow {
  id: string;
  display_kind: "image" | "video";
  display_image_path: string | null;
  display_image_width: number | null;
  display_image_height: number | null;
  video_url: string | null;
  link_url: string | null;
  label: string;
}

/**
 * Adverts that are approved and inside their start/end time, via the
 * database's live_ads() function — which exposes display fields only, never
 * the requester's contact or payment details. Any failure means "no adverts".
 */
async function getLiveAds(): Promise<LiveAd[]> {
  let client;
  try {
    client = createPublicClient();
  } catch {
    return [];
  }
  const { data, error } = await client.rpc("live_ads");
  if (error) {
    console.error("[ads] live_ads failed", error.message);
    return [];
  }
  return ((data ?? []) as LiveAdRow[]).map((row) => ({
    id: row.id,
    kind: row.display_kind,
    label: row.label,
    image: row.display_image_path
      ? { url: mediaPublicUrl(row.display_image_path), width: row.display_image_width, height: row.display_image_height }
      : null,
    videoUrl: row.video_url,
    linkUrl: row.link_url,
  }));
}

function pickOne<T>(items: T[]): T | null {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

/** One live image advert for the top banner (several take turns). Never on ministry pages. */
export async function getLiveBanner(branch: BranchId): Promise<LiveAd | null> {
  if (branch === "ministry") return null;
  return pickOne((await getLiveAds()).filter((ad) => ad.kind === "image" && ad.image));
}

/** One live video advert. Never on ministry pages. */
export async function getLiveVideoAd(branch: BranchId): Promise<LiveAd | null> {
  if (branch === "ministry") return null;
  return pickOne((await getLiveAds()).filter((ad) => ad.kind === "video" && ad.videoUrl));
}
