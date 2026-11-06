import type { Metadata } from "next";
import { CARD_SIZES, cardContent, type CardRequest } from "@/server/shareCard";
import { todayInGhana } from "@/server/bible";

// Shared verse links: /q/v/<book>/<chapter>/<verses>/<version> and /q/today/<day>.
// Link previews show the verse picture (from /api/share-card, so the picture
// tools live in one server function only), and anyone who taps the link is
// taken straight to the homepage, which points to R.O.M Bible Guide.

export function verseRequest(p: { b: string; c: string; vs: string; t: string }): CardRequest {
  return { kind: "verse", b: decodeURIComponent(p.b), c: p.c, v: decodeURIComponent(p.vs).replace(/_/g, ","), t: p.t };
}

/** The share picture's address. Link previews use the wide shape. */
function pictureUrl(req: CardRequest, wide = false) {
  const shape = wide ? "&shape=wide" : "";
  if (req.kind === "verse") return `/api/share-card?b=${encodeURIComponent(req.b)}&c=${encodeURIComponent(req.c)}&v=${encodeURIComponent(req.v)}&t=${encodeURIComponent(req.t)}${shape}`;
  if (req.kind === "founder") return `/api/share-card?fq=${encodeURIComponent(req.id)}${shape}`;
  // The day is in the address so WhatsApp doesn't reuse yesterday's picture.
  return `/api/share-card?quote=today&d=${todayInGhana()}${shape}`;
}

// When the address doesn't point to real verses, the preview shows this one.
// Link previews need a full address (WhatsApp fetches the picture itself).
const SITE = process.env.SITE_URL || "https://zivarukah.com";

const FALLBACK: CardRequest = { kind: "verse", b: "psalms", c: "119", v: "105", t: "kjv" };

export async function sharedMetadata(req: CardRequest): Promise<Metadata> {
  const content = await cardContent(req);
  const title = content ? `${content.source}: R.O.M Bible Guide` : "R.O.M Bible Guide | ZIVARUKAH";
  const image = { url: `${SITE}${pictureUrl(content ? req : FALLBACK, true)}`, ...CARD_SIZES.wide, type: "image/jpeg", alt: content ? `${content.source}: R.O.M Bible Guide` : "R.O.M Bible Guide" };
  const description = content ? `“${content.text.slice(0, 150)}${content.text.length > 150 ? "…" : ""}”` : "The Holy Bible, daily devotional and studies from Repent Online Ministries.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, siteName: "ZIVARUKAH", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export async function SharedVerse({ req }: { req: CardRequest }) {
  const content = await cardContent(req);
  const picture = pictureUrl(req);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#14110c] p-6 text-center text-white">
      {/* Straight on to the homepage (keeps ?utm_source so visits from WhatsApp are counted). */}
      <script dangerouslySetInnerHTML={{ __html: 'location.replace("/" + location.search);' }} />
      {content && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={picture} alt={`${content.source}: ${content.text}`} width={360} height={450} className="h-auto w-full max-w-[360px] rounded-2xl" />
      )}
      <p className="text-white/80">Opening ZIVARUKAH…</p>
      <a href="/" className="rounded-full bg-[#e3a82a] px-6 py-3 font-semibold text-[#14110c]">
        Go to zivarukah.com →
      </a>
    </main>
  );
}
