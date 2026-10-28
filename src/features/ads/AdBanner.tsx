import { getLiveBanners } from "@/db/ads";
import Link from "next/link";
import { AdRotator } from "@/features/ads/AdRotator";
import type { BranchId } from "@/config/branches";
import { HouseRotator } from "@/features/ads/HouseRotator";
import { getHouseAds, HOUSE_SECONDS } from "@/features/ads/houseAds";

/**
 * Slim image advert that stays just under the site header while the visitor
 * scrolls. Several live adverts take turns, each for its admin-set seconds.
 * When no advert is live, the same space shows our own works (books, the
 * literacy app, projects, articles, giving…) taking turns every 15 seconds,
 * with one slide inviting businesses to advertise.
 */
export async function AdBanner({ branch }: { branch: BranchId }) {
  const ads = await getLiveBanners(branch);
  if (ads.length === 0) {
    const works = await getHouseAds();
    return works.length > 0 ? <HouseRotator ads={works} seconds={HOUSE_SECONDS} /> : <AdvertiseHere />;
  }

  return (
    <AdRotator
      ads={ads.map((ad) => ({
        id: ad.id,
        label: ad.label,
        imageUrl: ad.image!.url,
        width: ad.image!.width,
        height: ad.image!.height,
        style: ad.bannerStyle,
        hasLink: Boolean(ad.linkUrl),
        seconds: ad.seconds,
      }))}
    />
  );
}

/** Shown in the advert strip while it's empty. Not sticky, so it never gets in the way. */
function AdvertiseHere() {
  return (
    <aside aria-label="Advertise with us" className="border-b border-black/10 bg-background dark:border-white/10">
      <div className="mx-auto w-full max-w-6xl px-2 py-1.5 sm:px-6 lg:px-8">
        <Link
          href="/advertise"
          className="group relative flex aspect-[8/1] w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-gradient-to-r from-[#001a4d] via-[#002f80] to-[#001a4d] px-3 text-center text-white"
        >
          <span aria-hidden="true" className="ad-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <span aria-hidden="true" className="text-lg sm:text-2xl">📣</span>
          <span className="flex flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-2">
            <span className="text-sm font-bold text-[#f0c050] sm:text-lg">Your advert here</span>
            <span className="text-[11px] text-white/85 sm:text-sm">Reach visitors across ZIVARUKAH</span>
          </span>
          <span className="rounded-full bg-[#e3a82a] px-3 py-1 text-[11px] font-semibold text-[#14110c] transition-transform group-hover:scale-105 sm:text-sm">
            Advertise →
          </span>
        </Link>
      </div>
    </aside>
  );
}
