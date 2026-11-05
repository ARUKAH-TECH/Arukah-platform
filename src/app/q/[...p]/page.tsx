import type { Metadata } from "next";
import { cardContent } from "@/server/shareCard";
import { requestFromPath } from "./share";

// A shared verse: link previews show the verse picture (opengraph-image.tsx),
// and anyone who taps the link is taken straight to the homepage, which
// points to R.O.M Bible Guide.

export const revalidate = 1800;

export async function generateMetadata({ params }: PageProps<"/q/[...p]">): Promise<Metadata> {
  const req = requestFromPath((await params).p);
  const content = req ? await cardContent(req) : null;
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

export default async function SharedVerse({ params }: PageProps<"/q/[...p]">) {
  const parts = (await params).p;
  const req = requestFromPath(parts);
  const content = req ? await cardContent(req) : null;
  const picture = req?.kind === "verse" ? `/api/share-card?b=${encodeURIComponent(req.b)}&c=${encodeURIComponent(req.c)}&v=${encodeURIComponent(req.v)}&t=${encodeURIComponent(req.t)}` : "/api/share-card?quote=today";
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
