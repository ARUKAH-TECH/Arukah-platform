import { BIBLE_BOOKS, type BibleBook } from "@/config/bibleBooks";

// Bible references ("John 3:16", "1 Cor 13:4-7", "Psalm 23") — shared by the
// server and the browser.

export interface BibleRef {
  book: BibleBook;
  chapter: number;
  from: number | null; // first verse, or null for the whole chapter
  to: number | null;
}

const ALIASES: Record<string, string> = {
  psalm: "psalms",
  ps: "psalms",
  psa: "psalms",
  songofsongs: "song-of-solomon",
  song: "song-of-solomon",
  canticles: "song-of-solomon",
  jn: "john",
  jhn: "john",
  mt: "matthew",
  mk: "mark",
  lk: "luke",
  revelations: "revelation",
  phil: "philippians",
  phm: "philemon",
  jud: "jude",
  judg: "judges",
};

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Finds a book from a name or a common short form ("Gen", "1 Cor", "Psalm"). */
export function findBook(name: string): BibleBook | null {
  const key = squash(name);
  if (!key) return null;
  const alias = ALIASES[key];
  if (alias) return BIBLE_BOOKS.find((b) => b.slug === alias) ?? null;
  const exact = BIBLE_BOOKS.find((b) => squash(b.name) === key);
  if (exact) return exact;
  if (key.replace(/^\d/, "").length < 2) return null;
  return BIBLE_BOOKS.find((b) => squash(b.name).startsWith(key)) ?? null;
}

/** Reads "John 3:16", "John 3:16-18", "John 3" or "Psalm 23:1–6". */
export function parseReference(text: string): BibleRef | null {
  const m = text
    .trim()
    .replace(/[–—]/g, "-")
    .match(/^((?:[1-3]\s*)?[A-Za-z][A-Za-z .]*?)\s*(\d{1,3})(?:\s*[:.]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?$/);
  if (!m) return null;
  const book = findBook(m[1]);
  if (!book) return null;
  const chapter = Number(m[2]);
  if (chapter < 1 || chapter > book.chapters) return null;
  const from = m[3] ? Number(m[3]) : null;
  const to = m[4] ? Number(m[4]) : from;
  if (from !== null && to !== null && to < from) return null;
  return { book, chapter, from, to };
}

export function refLabel(ref: BibleRef) {
  const verses = ref.from === null ? "" : ref.to !== null && ref.to !== ref.from ? `:${ref.from}-${ref.to}` : `:${ref.from}`;
  // "Psalm 23", not "Psalms 23", for a single psalm.
  const name = ref.book.slug === "psalms" ? "Psalm" : ref.book.name;
  return `${name} ${ref.chapter}${verses}`;
}

/** Address of the share picture (ministry logo + the verses) for a reference. */
export function shareCardHref(ref: BibleRef, version = "kjv") {
  const verses = ref.from === null ? "1-6" : ref.to !== null && ref.to !== ref.from ? `${ref.from}-${ref.to}` : `${ref.from}`;
  return `/api/share-card?b=${ref.book.slug}&c=${ref.chapter}&v=${verses}&t=${version}`;
}

/** Share link for a verse: the link preview shows the verse picture, and tapping it opens the homepage. */
export function shareLinkPath(ref: BibleRef, version = "kjv") {
  const verses = ref.from === null ? "1-6" : ref.to !== null && ref.to !== ref.from ? `${ref.from}-${ref.to}` : `${ref.from}`;
  return `/q/${ref.book.slug}/${ref.chapter}/${verses}/${version}`;
}

export function chapterHref(slug: string, chapter: number, verse?: number | null) {
  return `/bible/${slug}/${chapter}${verse ? `#v${verse}` : ""}`;
}
