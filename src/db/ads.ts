import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";
import type { BranchId } from "@/config/branches";
import type { AdContactAction } from "@/features/ads/adContact";

export interface LiveAd {
  id: string;
  kind: "image" | "video";
  label: string;
  image: { url: string; width: number | null; height: number | null } | null;
  videoUrl: string | null;
  linkUrl: string | null;
  /** How long it stays on screen when several adverts take turns. */
  seconds: number;
  /** Top banner: "roll" fills the strip and moves through the image; "fit" shows it whole and still. */
  bannerStyle: "roll" | "fit";
  /** The advertiser's number to show on the website ("" = none). */
  phone: string;
  /** What a tap on the advert does. */
  action: AdContactAction;
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
  display_seconds: number;
  banner_style: string;
  public_phone?: string | null;
  contact_action?: string | null;
}

const ACTIONS: AdContactAction[] = ["whatsapp", "call", "link", "none"];

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
  let { data, error } = await client.rpc("live_ads_v4");
  // Older database without phone/tap settings: fall back to the previous function.
  if (error) ({ data, error } = await client.rpc("live_ads_v3"));
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
    seconds: row.display_seconds,
    bannerStyle: row.banner_style === "fit" ? "fit" : "roll",
    phone: row.public_phone ?? "",
    action: ACTIONS.includes(row.contact_action as AdContactAction) ? (row.contact_action as AdContactAction) : row.link_url ? "link" : "none",
  }));
}

function pickOne<T>(items: T[]): T | null {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}

/** Every live image advert, in order, for the rotating top banner. Never on ministry pages. */
export async function getLiveBanners(branch: BranchId): Promise<LiveAd[]> {
  if (branch === "ministry") return [];
  return (await getLiveAds()).filter((ad) => ad.kind === "image" && ad.image);
}

/** One live video advert. Never on ministry pages. */
export async function getLiveVideoAd(branch: BranchId): Promise<LiveAd | null> {
  if (branch === "ministry") return null;
  return pickOne((await getLiveAds()).filter((ad) => ad.kind === "video" && ad.videoUrl));
}
