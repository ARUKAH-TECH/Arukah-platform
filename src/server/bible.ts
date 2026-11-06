import "server-only";
import { BIBLE_BOOKS, bookBySlug } from "@/config/bibleBooks";
import { parseReference, refLabel, type BibleRef } from "@/lib/bible";

// The King James Version text (public domain), from public/bible-versions/kjv
// (the same place as the other versions).
//
// The text is deliberately NOT bundled into the server code: 66 books is about
// 4 MB, and Vercel stored a copy inside every server function that reads the
// Bible, on every deployment (the "Function Storage" warning, Nov 2026).
// While the site is being built, the files are read from disk; once it is
// live, they are fetched from the site's own static files (served from
// Vercel's CDN, cached for a day).

type Chapters = string[][];
const cache = new Map<string, Chapters>();
const SITE = process.env.SITE_URL || "https://zivarukah.com";
// Built from parts so the build doesn't copy the folder into every function.
const KJV_DIR = ["public", "bible-versions", "kjv"].join("/");

async function fromDisk(slug: string): Promise<Chapters | null> {
  try {
    const { readFile } = await import("node:fs/promises");
    const file = `${process.cwd()}/${KJV_DIR}/${slug}.json`;
    return JSON.parse(await readFile(file, "utf8")) as Chapters;
  } catch {
    return null; // not on disk (the live site): use the website copy
  }
}

async function fromSite(slug: string): Promise<Chapters | null> {
  try {
    const res = await fetch(`${SITE}/bible-versions/kjv/${slug}.json`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return (await res.json()) as Chapters;
  } catch {
    return null;
  }
}

export async function loadBook(slug: string): Promise<Chapters | null> {
  if (!bookBySlug(slug)) return null;
  const hit = cache.get(slug);
  if (hit) return hit;
  const book = (await fromDisk(slug)) ?? (await fromSite(slug));
  if (book) cache.set(slug, book);
  return book;
}

export async function getChapter(slug: string, chapter: number): Promise<string[] | null> {
  const book = await loadBook(slug);
  return book?.[chapter - 1] ?? null;
}

export interface Passage {
  ref: BibleRef;
  label: string;
  verses: { n: number; text: string }[];
}

/** The verses for a reference like "John 3:16-18" (whole chapter if no verses). */
export async function getPassage(reference: string): Promise<Passage | null> {
  const ref = parseReference(reference);
  if (!ref) return null;
  const chapter = await getChapter(ref.book.slug, ref.chapter);
  if (!chapter) return null;
  const from = ref.from ?? 1;
  const to = Math.min(ref.to ?? chapter.length, chapter.length);
  if (from > chapter.length) return null;
  const verses = [];
  for (let n = from; n <= to; n++) verses.push({ n, text: chapter[n - 1] });
  return { ref, label: refLabel(ref), verses };
}

// Verse of the day: one from this list each day (Ghana time), in order.
const DAILY = [
  "John 3:16", "Psalm 23:1", "Proverbs 3:5-6", "Philippians 4:13", "Isaiah 40:31", "Romans 8:28", "Jeremiah 29:11", "Matthew 11:28",
  "Joshua 1:9", "Psalm 46:1", "2 Corinthians 5:17", "Romans 12:2", "Galatians 5:22-23", "Hebrews 11:1", "1 John 1:9", "Psalm 119:105",
  "Matthew 6:33", "Romans 10:9", "Ephesians 2:8-9", "Isaiah 41:10", "Psalm 37:4", "1 Peter 5:7", "James 1:5", "John 14:6",
  "Psalm 91:1-2", "Lamentations 3:22-23", "Micah 6:8", "Romans 5:8", "Acts 2:38", "John 1:12", "Psalm 51:10", "2 Timothy 1:7",
  "Proverbs 22:6", "Matthew 5:16", "Colossians 3:23", "Hebrews 13:5", "Psalm 121:1-2", "Isaiah 53:5", "John 11:25", "Romans 6:23",
  "2 Chronicles 7:14", "Psalm 34:8", "Matthew 28:19-20", "Galatians 2:20", "Psalm 27:1", "Philippians 4:6-7", "1 Corinthians 13:4-5",
  "Revelation 3:20", "John 8:36", "Psalm 103:2-3", "Isaiah 1:18", "Ezekiel 36:26", "Mark 11:24", "James 4:7", "1 Thessalonians 5:16-18",
  "Psalm 139:14", "Proverbs 18:10", "Joel 2:28", "Luke 15:10", "Acts 1:8", "Hebrews 4:12", "Romans 15:13", "Deuteronomy 31:6",
  "Matthew 7:7", "Jeremiah 33:3", "Zephaniah 3:17", "Nahum 1:7", "Psalm 32:8", "John 10:10", "Ephesians 6:10-11", "Isaiah 26:3",
] as const;

export function todayInGhana() {
  return new Date().toISOString().slice(0, 10); // Ghana is UTC all year
}

export async function verseOfTheDay(day = todayInGhana()): Promise<Passage | null> {
  const index = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000) % DAILY.length;
  return getPassage(DAILY[index]);
}

export interface SearchHit {
  slug: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

/** Finds verses containing all the words searched for (KJV spelling). */
export async function searchBible(query: string, limit = 100): Promise<{ hits: SearchHit[]; total: number }> {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9' ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .slice(0, 8);
  if (!words.length) return { hits: [], total: 0 };
  const hits: SearchHit[] = [];
  let total = 0;
  for (const book of BIBLE_BOOKS) {
    const chapters = await loadBook(book.slug);
    if (!chapters) continue;
    chapters.forEach((verses, c) =>
      verses.forEach((text, v) => {
        const lower = text.toLowerCase();
        if (words.every((w) => new RegExp(`\\b${w.replace(/'/g, "['’]")}`).test(lower))) {
          total++;
          if (hits.length < limit) hits.push({ slug: book.slug, book: book.name, chapter: c + 1, verse: v + 1, text });
        }
      }),
    );
  }
  return { hits, total };
}
