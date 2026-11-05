import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { bookBySlug } from "@/config/bibleBooks";
import { BIBLE_VERSIONS } from "@/config/bibleVersions";
import { getChapter } from "@/server/bible";
import { todaysQuote } from "@/features/quote/todaysQuote";

// The share picture: a Bible verse (or today's quote) with the R.O.M Bible
// Guide logo on the top right. The words always come from our own Bible files
// or today's quote — never from the address — so nobody can put other words
// under the ministry logo.

const SITE = process.env.SITE_URL || "https://zivarukah.com";
const MAX_CHARS = 620;

export type CardRequest = { kind: "today" } | { kind: "verse"; b: string; c: string; v: string; t: string };

/** Picture size: "tall" for WhatsApp Status / chats, "wide" for link previews. */
export const CARD_SIZES = { tall: { width: 1080, height: 1350 }, wide: { width: 1200, height: 630 } } as const;

async function logo(ministry: boolean) {
  // Literal paths so Vercel bundles both files with this function.
  const data = ministry
    ? await readFile(join(process.cwd(), "public/branding/ministry/repent-logo-share.png"))
    : await readFile(join(process.cwd(), "public/branding/arukah/arukah-logo-share.png"));
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

async function versionChapter(version: string, slug: string, chapter: number) {
  if (version === "kjv") return getChapter(slug, chapter);
  try {
    const res = await fetch(`${SITE}/bible-versions/${version}/${slug}.json`, { next: { revalidate: 86400 } });
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


interface CardContent {
  text: string;
  source: string;
  ministry: boolean;
}

/** The words for a card, or null if the address doesn't point to real verses. */
export async function cardContent(req: CardRequest): Promise<CardContent | null> {
  let text = "";
  let source = "";
  let ministry = true;
  if (req.kind === "today") {
    const quote = await todaysQuote();
    text = quote.text;
    source = quote.source;
    ministry = quote.kind === "verse";
  } else {
    const book = bookBySlug(req.b);
    const chapter = Number(req.c);
    const version = BIBLE_VERSIONS.find((x) => x.id === (req.t || "kjv"));
    if (!book || !version || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) return null;
    const verses = await versionChapter(version.id, book.slug, chapter);
    const numbers = verses ? verseList(req.v, verses.length) : [];
    if (!verses || numbers.length === 0) return null;
    text = numbers
      .map((n) => verses[n - 1])
      .filter(Boolean)
      .join(" ");
    if (!text) return null;
    const name = book.slug === "psalms" ? "Psalm" : book.name;
    source = `${name} ${chapter}:${label(numbers)} (${version.short})`;
  }
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > MAX_CHARS) text = `${text.slice(0, MAX_CHARS).replace(/\s+\S*$/, "")}…`;
  return { text, source, ministry };
}

export async function renderCard(content: CardContent, shape: keyof typeof CARD_SIZES = "tall", headers: Record<string, string> = {}) {
  const wide = shape === "wide";
  const { source, ministry } = content;
  // The link preview is small: keep its text short.
  const text = wide && content.text.length > 280 ? `${content.text.slice(0, 280).replace(/\s+\S*$/, "")}…` : content.text;
  const W = CARD_SIZES[shape].width;
  const H = CARD_SIZES[shape].height;
  const logoSrc = await logo(ministry);
  const size = wide ? Math.round(fontSize(text.length) * 0.62) : fontSize(text.length);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: wide ? "34px 50px 30px" : "56px 70px 56px",
          background: "linear-gradient(180deg, #14110c 0%, #2a2210 60%, #3b2f14 100%)",
          color: "#ffffff",
        }}
      >
        {/* Top: name on the left, app logo on the top right. */}
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
            <div style={{ display: "flex", fontSize: wide ? 30 : 40, fontWeight: 700, letterSpacing: 2, color: "#e3a82a" }}>{ministry ? "R.O.M BIBLE GUIDE" : "ZIVARUKAH BOOKS"}</div>
            <div style={{ display: "flex", fontSize: wide ? 22 : 28, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>{ministry ? "Repent Online Ministries" : "Quote of the day"}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt="" width={wide ? (ministry ? 170 : 130) : ministry ? 270 : 210} height={wide ? (ministry ? 120 : 87) : ministry ? 191 : 140} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div style={{ display: "flex", fontSize: wide ? 80 : 130, lineHeight: 1, color: "#e3a82a", marginBottom: wide ? -10 : -16 }}>“</div>
          <div style={{ display: "flex", fontSize: size, lineHeight: 1.35, textAlign: "center", justifyContent: "center" }}>{text}</div>
          <div style={{ display: "flex", marginTop: wide ? 16 : 36, fontSize: wide ? 28 : 38, fontWeight: 700, color: "#e3a82a", textAlign: "center" }}>{source}</div>
        </div>
        <div style={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center", borderTop: "2px solid rgba(227,168,42,0.5)", paddingTop: wide ? 14 : 24, fontSize: wide ? 24 : 32, fontWeight: 700, color: "#ffffff" }}>
          Read more at zivarukah.com
        </div>
      </div>
    ),
    { width: W, height: H, headers },
  );
}
