import { Container } from "@/components/ui/Container";
import { getLiveVideoAd } from "@/db/ads";
import { parseVideoLink } from "@/lib/video";
import type { BranchId } from "@/config/branches";
import { AdViewPing } from "@/features/ads/AdViewPing";

/** A live video advert (YouTube embed or TikTok link). Renders nothing unless one is live. */
export async function AdSlot({ branch }: { branch: BranchId }) {
  const ad = await getLiveVideoAd(branch);
  if (!ad?.videoUrl) return null;
  // AI-made adverts are MP4 files in our own "ad-videos" bucket.
  const ownFile = ad.videoUrl.includes("/storage/v1/object/public/ad-videos/") && ad.videoUrl.endsWith(".mp4");
  const video = ownFile ? null : parseVideoLink(ad.videoUrl);
  if (!ownFile && !video) return null;

  return (
    <aside aria-label="Sponsored" className="py-10">
      <Container>
        <AdViewPing id={ad.id} />
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Sponsored · {ad.label}</p>
        <div className="mt-3 max-w-2xl">
          {ownFile ? (
            <video
              src={ad.videoUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={`Sponsored video: ${ad.label}`}
              className="aspect-video w-full rounded-xl bg-black object-contain"
            />
          ) : video?.platform === "youtube" ? (
            <iframe
              src={video.embedUrl}
              title={`Sponsored: ${ad.label}`}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full rounded-xl"
            />
          ) : (
            <a
              href={video!.url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="block rounded-xl border border-black/10 p-4 text-sm font-medium hover:border-brand-primary-text dark:border-white/10"
            >
              Watch on TikTok ↗
            </a>
          )}
          {ad.linkUrl && (
            <a
              href={`/ad-click/${ad.id}`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-brand-primary-text hover:underline"
            >
              Visit {ad.label} ↗
            </a>
          )}
        </div>
      </Container>
    </aside>
  );
}
