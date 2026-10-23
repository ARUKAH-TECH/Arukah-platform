import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { getLiveBanner } from "@/db/ads";
import type { BranchId } from "@/config/branches";

/**
 * Slim, image-only landscape advert at the top of a page (recommended upload
 * 1200 × 150). The whole strip links to the advertiser. Renders nothing
 * unless a fully approved banner is live for this page.
 */
export async function AdBanner({ branch }: { branch: BranchId }) {
  const banner = await getLiveBanner(branch);
  if (!banner?.image) return null;

  return (
    <aside aria-label="Sponsored" className="pt-3">
      <Container>
        <a
          href={banner.destinationUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="relative block overflow-hidden rounded-xl border border-black/10 dark:border-white/10"
        >
          <Image
            src={banner.image.url}
            alt={`Sponsored: ${banner.headline}`}
            width={banner.image.width ?? 1200}
            height={banner.image.height ?? 150}
            sizes="(min-width: 1280px) 1152px, 100vw"
            className="aspect-[8/1] w-full object-cover"
          />
          <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            Sponsored
          </span>
        </a>
      </Container>
    </aside>
  );
}
