import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { getLiveBanner } from "@/db/ads";
import type { BranchId } from "@/config/branches";

/** Slim landscape image advert at the top of the page. Renders nothing unless one is live. */
export async function AdBanner({ branch }: { branch: BranchId }) {
  const ad = await getLiveBanner(branch);
  if (!ad?.image) return null;

  const picture = (
    <>
      <Image
        src={ad.image.url}
        alt={`Sponsored: ${ad.label}`}
        width={ad.image.width ?? 1200}
        height={ad.image.height ?? 150}
        sizes="(min-width: 1280px) 1152px, 100vw"
        className="aspect-[8/1] w-full object-cover"
      />
      <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        Sponsored
      </span>
    </>
  );
  const frame = "relative block overflow-hidden rounded-xl border border-black/10 dark:border-white/10";

  return (
    <aside aria-label="Sponsored" className="pt-3">
      <Container>
        {ad.linkUrl ? (
          <a href={ad.linkUrl} target="_blank" rel="sponsored noopener noreferrer" className={frame}>
            {picture}
          </a>
        ) : (
          <div className={frame}>{picture}</div>
        )}
      </Container>
    </aside>
  );
}
