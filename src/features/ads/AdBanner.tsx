import { getLiveBanners } from "@/db/ads";
import { AdRotator } from "@/features/ads/AdRotator";
import type { BranchId } from "@/config/branches";

/**
 * Slim image advert that stays just under the site header while the visitor
 * scrolls. Several live adverts take turns, each for its admin-set seconds.
 * Renders nothing unless an advert is live.
 */
export async function AdBanner({ branch }: { branch: BranchId }) {
  const ads = await getLiveBanners(branch);
  if (ads.length === 0) return null;

  return (
    <AdRotator
      ads={ads.map((ad) => ({
        id: ad.id,
        label: ad.label,
        imageUrl: ad.image!.url,
        linkUrl: ad.linkUrl,
        seconds: ad.seconds,
      }))}
    />
  );
}
