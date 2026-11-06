import { cardContent, type CardRequest } from "@/server/shareCard";
import { renderCard } from "@/server/shareCardImage";

// The share picture (words: src/server/shareCard.tsx, drawing: shareCardImage.tsx).
// It is also the link-preview picture for shared links (/q/...): &shape=wide.
//   /api/share-card?b=john&c=3&v=16-17,19&t=kjv   verses of a chapter
//   /api/share-card?quote=today                     today's verse / quote line
//   /api/share-card?fq=<id>                         one of the founder's quotes (with his photo)
//   &shape=wide                                     1200x630 link-preview size

export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const today = q.get("quote") === "today";
  const fq = q.get("fq");
  const req: CardRequest = today ? { kind: "today" } : fq ? { kind: "founder", id: fq } : { kind: "verse", b: q.get("b") ?? "", c: q.get("c") ?? "", v: q.get("v") ?? "", t: q.get("t") ?? "kjv" };
  const content = await cardContent(req);
  if (!content) return new Response("Not found", { status: 404 });
  const cache = today || fq ? "public, max-age=600, s-maxage=1800" : "public, max-age=3600, s-maxage=86400";
  return renderCard(content, q.get("shape") === "wide" ? "wide" : "tall", { "Cache-Control": cache });
}
