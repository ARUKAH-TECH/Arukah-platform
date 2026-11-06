import "server-only";
import { bookBySlug } from "@/config/bibleBooks";
import { BIBLE_VERSIONS } from "@/config/bibleVersions";
import { getChapter } from "@/server/bible";
import { todaysQuote } from "@/features/quote/todaysQuote";
import { getFounderQuote } from "@/db/founderQuotes";
import { FOUNDER } from "@/config/founder";

// The share picture: a Bible verse (or today's quote) with the R.O.M Bible
// Guide logo on the top right. The words always come from our own Bible files
// or today's quote — never from the address — so nobody can put other words
// under the ministry logo.
//
// This file only works out the words. Drawing the picture (next/og + sharp,
// which are large) lives in shareCardImage.tsx, used only by /api/share-card,
// so those tools are stored in one server function instead of seven.

const SITE = process.env.SITE_URL || "https://zivarukah.com";
const MAX_CHARS = 620;

export type CardRequest = { kind: "today" } | { kind: "founder"; id: string } | { kind: "verse"; b: string; c: string; v: string; t: string };

/** Picture size: "tall" for WhatsApp Status / chats, "wide" for link previews. */
export const CARD_SIZES = { tall: { width: 1080, height: 1350 }, wide: { width: 1200, height: 630 } } as const;

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


export interface CardContent {
  text: string;
  source: string;
  ministry: boolean;
  /** The founder's own words: shown with his photo and name. */
  founder?: boolean;
}

/** The words for a card, or null if the address doesn't point to real verses. */
export async function cardContent(req: CardRequest): Promise<CardContent | null> {
  let text = "";
  let source = "";
  let ministry = true;
  let founder = false;
  if (req.kind === "today") {
    const quote = await todaysQuote();
    text = quote.text;
    source = quote.source;
    ministry = quote.kind !== "book";
    founder = quote.kind === "founder";
  } else if (req.kind === "founder") {
    const quote = await getFounderQuote(req.id);
    if (!quote) return null;
    text = quote.text;
    source = FOUNDER.name;
    founder = true;
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
  return { text, source, ministry, founder };
}
