import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { getLiveAds } from "@/db/ads";
import type { BranchId } from "@/config/branches";

/** Clearly labelled sponsored adverts. Renders nothing unless a live advert exists for this page. */
export async function AdSlot({ branch }: { branch: BranchId }) {
  const ads = await getLiveAds(branch);
  if (ads.length === 0) return null;

  return (
    <aside aria-label="Sponsored" className="py-10">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Sponsored</p>
        <div className={`mt-3 grid grid-cols-1 gap-4 ${ads.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {ads.map((ad) => (
            <a
              key={ad.id}
              href={ad.destinationUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="group flex overflow-hidden rounded-2xl border border-black/10 bg-white transition-colors hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900"
            >
              {ad.image && (
                <Image
                  src={ad.image.url}
                  alt=""
                  width={ad.image.width ?? 320}
                  height={ad.image.height ?? 240}
                  sizes="(min-width: 640px) 160px, 120px"
                  className="w-28 shrink-0 object-cover sm:w-40"
                />
              )}
              <div className="flex flex-col justify-center gap-1 p-4">
                <span className="text-sm font-semibold text-foreground group-hover:text-brand-primary-text">{ad.headline}</span>
                {ad.body && <span className="text-xs leading-5 text-foreground/70">{ad.body}</span>}
                <span className="mt-1 text-xs font-semibold text-brand-primary-text">{ad.ctaLabel || "Visit"} ↗</span>
              </div>
            </a>
          ))}
        </div>
      </Container>
    </aside>
  );
}
