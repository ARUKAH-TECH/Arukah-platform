import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { bookBySlug } from "@/config/bibleBooks";
import { BIBLE_VERSIONS } from "@/config/bibleVersions";
import { getChapter } from "@/server/bible";
import { todaysQuote } from "@/features/quote/todaysQuote";

// A picture to share on WhatsApp (chat or Status): the Repent Online
// Ministries logo with a Bible verse, or today's quote.
// The text always comes from our own Bible files or today's quote — never
// from the address — so nobody can put other words under the ministry logo.
//   /api/share-card?b=john&c=3&v=16-17,19&t=kjv   verses of a chapter
//   /api/share-card?quote=today                     today's verse / quote line

export const runtime = "nodejs";

const W = 1080;
const H = 1350;
const MAX_CHARS = 620;

async function logo(ministry: boolean) {
  // Literal paths so Vercel bundles both files with this function.
  const data = ministry
    ? await readFile(join(process.cwd(), "public/branding/ministry/repent-logo-share.png"))
    : await readFile(join(process.cwd(), "public/branding/arukah/arukah-logo-transparent.png"));
  return `data:image/png;base64,${data.toString("base64")}`;
}

/** "16-17,19" → [16, 17, 19] (at most 12 verses). */
function verseList(spec: string, max: number) {
  const out: number[] = [];
  for (const part of spec.split(",")) {
    const m = /^(\d{1,3})(?:-(\d{1,3}))?$/.exec(part.trim());
    if (!m) return [];
    const from = Number(m[1]);
    const to = Number(m[2] ?? m[1]);
    if (from < 1 || to < from || to > max) return [];
    for (let n = from; n <= to && out.length < 12; n++) if (!out.includes(n)) out.push(n);
  }
  return out.sort((a, b) => a - b);
}

function label(numbers: number[]) {
  const parts: string[] = [];
  let start = numbers[0];
  let prev = numbers[0];
  for (const n of [...numbers.slice(1), -1]) {
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = n;
    prev = n;
  }
  return parts.join(",");
}

async function versionChapter(origin: string, version: string, slug: string, chapter: number) {
  if (version === "kjv") return getChapter(slug, chapter);
  try {
    const res = await fetch(`${origin}/bible-versions/${version}/${slug}.json`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const book = (await res.json()) as string[][];
    return book[chapter - 1] ?? null;
  } catch {
    return null;
  }
}

function fontSize(length: number) {
  if (length <= 110) return 64;
  if (length <= 200) return 54;
  if (length <= 320) return 46;
  if (length <= 450) return 40;
  return 34;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams;

  let text = "";
  let source = "";
  let ministry = true;
  let cache = "public, max-age=3600, s-maxage=604800";

  if (q.get("quote") === "today") {
    const quote = await todaysQuote();
    text = quote.text;
    source = quote.source;
    ministry = quote.kind === "verse";
    cache = "public, max-age=600, s-maxage=1800";
  } else {
    const book = bookBySlug(q.get("b") ?? "");
    const chapter = Number(q.get("c"));
    const version = BIBLE_VERSIONS.find((v) => v.id === (q.get("t") ?? "kjv"));
    if (!book || !version || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
      return new Response("Not found", { status: 404 });
    }
    const verses = await versionChapter(url.origin, version.id, book.slug, chapter);
    const numbers = verses ? verseList(q.get("v") ?? "", verses.length) : [];
    if (!verses || numbers.length === 0) return new Response("Not found", { status: 404 });
    text = numbers
      .map((n) => verses[n - 1])
      .filter(Boolean)
      .join(" ");
    if (!text) return new Response("Not found", { status: 404 });
    const name = book.slug === "psalms" ? "Psalm" : book.name;
    source = `${name} ${chapter}:${label(numbers)} (${version.short})`;
  }

  text = text.replace(/\s+/g, " ").trim();
  if (text.length > MAX_CHARS) text = `${text.slice(0, MAX_CHARS).replace(/\s+\S*$/, "")}…`;

  const logoSrc = await logo(ministry);
  const size = fontSize(text.length);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "70px 80px 60px",
          background: "linear-gradient(160deg, #14110c 0%, #2a2210 60%, #3b2f14 100%)",
          color: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={ministry ? 460 : 300} height={ministry ? 326 : 200} style={{ objectFit: "contain" }} />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div style={{ display: "flex", fontSize: 120, lineHeight: 1, color: "#e3a82a", marginBottom: -10 }}>“</div>
          <div style={{ display: "flex", fontSize: size, lineHeight: 1.35, textAlign: "center", justifyContent: "center" }}>{text}</div>
          <div style={{ display: "flex", marginTop: 36, fontSize: 38, fontWeight: 700, color: "#e3a82a", textAlign: "center" }}>{source}</div>
        </div>
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", borderTop: "2px solid rgba(227,168,42,0.5)", paddingTop: 24, fontSize: 28, color: "rgba(255,255,255,0.75)" }}>
          <span>{ministry ? "Repent Online Ministries" : "ZIVARUKAH BOOKS"}</span>
          <span>{ministry ? "zivarukah.com/bible" : "zivarukah.com/books"}</span>
        </div>
      </div>
    ),
    { width: W, height: H, headers: { "Cache-Control": cache } },
  );
}
