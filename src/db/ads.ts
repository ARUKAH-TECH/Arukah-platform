import "server-only";
import { createPublicClient, mediaPublicUrl } from "@/lib/supabase/public";
import type { BranchId } from "@/config/branches";

export interface LiveAd {
  id: string;
  headline: string;
  body: string;
  image: { url: string; width: number | null; height: number | null } | null;
  destinationUrl: string;
  ctaLabel: string;
}

/**
 * Up to `limit` live adverts for one page, in a shuffled order so advertisers
 * share the space. The database (RLS) already returns only adverts whose
 * advertiser, content and payment are approved and whose dates include today;
 * here we also respect the admin's per-division on/off switch. Any failure
 * means no adverts — never a broken page.
 */
export async function getLiveAds(
  branch: BranchId,
  limit = 2,
  format: "card" | "banner" = "card",
): Promise<LiveAd[]> {
  if (branch === "ministry") return [];
  let client;
  try {
    client = createPublicClient();
  } catch {
    return [];
  }

  const [{ data: setting, error: settingError }, { data: ads, error: adsError }] = await Promise.all([
    client.from("ad_settings").select("accepts_ads").eq("branch", branch).maybeSingle(),
    client
      .from("ads")
      .select("id, headline, body, image_path, image_width, image_height, destination_url, cta_label")
      .contains("placements", [branch])
      .eq("format", format),
  ]);
  if (settingError || adsError) {
    console.error("[ads] read failed", settingError?.message ?? adsError?.message);
    return [];
  }
  if (!setting?.accepts_ads || !ads?.length) return [];

  const shuffled = [...ads].sort(() => Math.random() - 0.5).slice(0, limit);
  return shuffled.map((ad) => ({
    id: ad.id,
    headline: ad.headline,
    body: ad.body,
    image: ad.image_path ? { url: mediaPublicUrl(ad.image_path), width: ad.image_width, height: ad.image_height } : null,
    destinationUrl: ad.destination_url,
    ctaLabel: ad.cta_label,
  }));
}

/** At most one live top banner for this page (several live banners take turns). */
export async function getLiveBanner(branch: BranchId): Promise<LiveAd | null> {
  const [banner] = await getLiveAds(branch, 1, "banner");
  return banner?.image ? banner : null;
}
