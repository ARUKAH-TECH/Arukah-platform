import type { Metadata } from "next";
import { cardContent, renderCard, type CardRequest } from "@/server/shareCard";

// Shared verse links: /q/v/<book>/<chapter>/<verses>/<version> and /q/today/<day>.
// Link previews show the verse picture (opengraph-image), and anyone who taps
// the link is taken straight to the homepage, which points to R.O.M Bible Guide.

export function verseRequest(p: { b: string; c: string; vs: string; t: string }): CardRequest {
  return { kind: "verse", b: decodeURIComponent(p.b), c: p.c, v: decodeURIComponent(p.vs).replace(/_/g, ","), t: p.t };
}

export async function sharedMetadata(req: CardRequest): Promise<Metadata> {
  const content = await cardContent(req);
  const title = content ? `${content.source}: R.O.M Bible Guide` : "R.O.M Bible Guide | ZIVARUKAH";
  const description = content ? `“${content.text.slice(0, 150)}${content.text.length > 150 ? "…" : ""}”` : "The Holy Bible, daily devotional and studies from Repent Online Ministries.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: true },
    openGraph: { title, description, siteName: "ZIVARUKAH" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export async function sharedImage(req: CardRequest) {
  const content = (await cardContent(req)) || { text: "Thy word is a lamp unto my feet, and a light unto my path.", source: "Psalm 119:105 (KJV)", ministry: true };
  return renderCard(content, "wide");
}

export async function SharedVerse({ req }: { req: CardRequest }) {
  const content = await cardContent(req);
  const picture =
    req.kind === "verse"
      ? `/api/share-card?b=${encodeURIComponent(req.b)}&c=${encodeURIComponent(req.c)}&v=${encodeURIComponent(req.v)}&t=${encodeURIComponent(req.t)}`
      : req.kind === "founder"
        ? `/api/share-card?fq=${encodeURIComponent(req.id)}`
        : "/api/share-card?quote=today";
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
