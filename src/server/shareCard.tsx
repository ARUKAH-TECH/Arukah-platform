import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { bookBySlug } from "@/config/bibleBooks";
import { BIBLE_VERSIONS } from "@/config/bibleVersions";
import { getChapter } from "@/server/bible";
import { todaysQuote } from "@/features/quote/todaysQuote";
import { backdropSvg, monthDesign } from "@/server/backdrop";

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

/** Number from text, so the same verse always gets the same variation. */
function hash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

/** This month's background (style chosen from the month's theme), drawn for this verse. */
async function background(seed: string, W: number, H: number) {
  try {
    const design = await monthDesign();
    const svg = backdropSvg(design, W, H, hash(seed));
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch (error) {
    console.error("[share-card] background", error instanceof Error ? error.message : "error");
    return null;
  }
}

/** PNG → JPEG (about 5× smaller for picture backgrounds). Falls back to the PNG. */
async function asJpeg(png: Response, headers: Record<string, string>) {
  const buffer = Buffer.from(await png.arrayBuffer());
  try {
    const sharp = (await import("sharp")).default;
    const jpeg = await sharp(buffer).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), { headers: { ...headers, "Content-Type": "image/jpeg" } });
  } catch (error) {
    console.error("[share-card] jpeg", error instanceof Error ? error.message : "error");
    return new Response(new Uint8Array(buffer), { headers: { ...headers, "Content-Type": "image/png" } });
  }
}

export async function renderCard(content: CardContent, shape: keyof typeof CARD_SIZES = "tall", headers: Record<string, string> = {}) {
  const wide = shape === "wide";
  const { source, ministry } = content;
  // The link preview is small: keep its text short.
  const text = wide && content.text.length > 280 ? `${content.text.slice(0, 280).replace(/\s+\S*$/, "")}…` : content.text;
  const W = CARD_SIZES[shape].width;
  const H = CARD_SIZES[shape].height;
  const [logoSrc, bgSrc] = await Promise.all([logo(ministry), background(source + text.slice(0, 40), W, H)]);
  const size = wide ? Math.round(fontSize(text.length) * 0.6) : fontSize(text.length);
  const shadow = "0 2px 12px rgba(0,0,0,0.85)";
  const png = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#14110c", color: "#ffffff" }}>
        {bgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgSrc} alt="" width={W} height={H} style={{ position: "absolute", top: 0, left: 0, width: W, height: H, objectFit: "cover" }} />
        )}
        {/* Darkens the picture a little so the words are easy to read. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: W,
            height: H,
            display: "flex",
            background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column", padding: wide ? "28px 44px 24px" : "56px 64px 52px" }}>
          {/* Top: name on the left, app logo on the top right. */}
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", marginTop: wide ? 8 : 20 }}>
              <div style={{ display: "flex", fontSize: wide ? 28 : 40, fontWeight: 700, letterSpacing: 2, color: "#f0c050", textShadow: shadow }}>{ministry ? "R.O.M BIBLE GUIDE" : "ZIVARUKAH BOOKS"}</div>
              <div style={{ display: "flex", fontSize: wide ? 20 : 28, color: "rgba(255,255,255,0.9)", marginTop: 6, textShadow: shadow }}>{ministry ? "Repent Online Ministries" : "Quote of the day"}</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" width={wide ? (ministry ? 150 : 120) : ministry ? 270 : 210} height={wide ? (ministry ? 106 : 80) : ministry ? 191 : 140} style={{ objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", width: "100%" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                padding: wide ? "14px 28px 18px" : "28px 40px 40px",
                borderRadius: wide ? 22 : 36,
                background: "rgba(10,8,5,0.45)",
                border: "2px solid rgba(240,192,80,0.35)",
              }}
            >
              <div style={{ display: "flex", fontSize: wide ? 64 : 120, lineHeight: 1, color: "#f0c050", marginBottom: wide ? -8 : -16 }}>“</div>
              <div style={{ display: "flex", fontSize: size, lineHeight: 1.35, textAlign: "center", justifyContent: "center", textShadow: shadow }}>{text}</div>
              <div style={{ display: "flex", marginTop: wide ? 12 : 32, fontSize: wide ? 26 : 38, fontWeight: 700, color: "#f0c050", textAlign: "center", textShadow: shadow }}>{source}</div>
            </div>
          </div>
          <div style={{ display: "flex", width: "100%", justifyContent: "center", alignItems: "center", fontSize: wide ? 22 : 32, fontWeight: 700, color: "#ffffff", textShadow: shadow }}>
            Read more at zivarukah.com
          </div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
  return asJpeg(png, headers);
}
