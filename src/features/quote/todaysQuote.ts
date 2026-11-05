import { getPublishedBooks } from "@/db/books";
import { listFounderQuotes } from "@/db/founderQuotes";
import { FOUNDER } from "@/config/founder";

// A new line every day (midnight, Ghana time = UTC): days alternate between
// a line from one of our books, the founder's own quotes (with his photo), (the "Lines readers love" in Admin → Books)
// and a Bible verse for Repent Online Ministries. Adding highlights to a book
// adds them to the rotation automatically.

export interface Quote {
  text: string;
  source: string;
  href: string;
  linkLabel: string;
  kind: "book" | "verse" | "founder";
  /** For the founder's own quotes. */
  id?: string;
}

// King James Version (public domain).
const VERSES: Quote[] = [
  ["Trust in the LORD with all thine heart; and lean not unto thine own understanding.", "Proverbs 3:5"],
  ["I can do all things through Christ which strengtheneth me.", "Philippians 4:13"],
  ["Thy word is a lamp unto my feet, and a light unto my path.", "Psalm 119:105"],
  ["Train up a child in the way he should go: and when he is old, he will not depart from it.", "Proverbs 22:6"],
  [
    "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
    "Matthew 5:16",
  ],
  [
    "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    "Isaiah 40:31",
  ],
  [
    "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    "Joshua 1:9",
  ],
  [
    "Repent ye therefore, and be converted, that your sins may be blotted out, when the times of refreshing shall come from the presence of the Lord.",
    "Acts 3:19",
  ],
].map(([text, ref]) => ({ text, source: `${ref} (KJV)`, href: "/ministry", linkLabel: "Visit Repent Online Ministries →", kind: "verse" as const }));

function pick<T>(list: T[], n: number) {
  return list[((n % list.length) + list.length) % list.length];
}

export function founderQuote(q: { id: string; text: string }): Quote {
  return { id: q.id, text: q.text, source: FOUNDER.name, href: "/about", linkLabel: "About Shepherd Justice →", kind: "founder" };
}

export async function todaysQuote(): Promise<Quote> {
  const day = Math.floor(Date.now() / 86_400_000);
  const [books, founder] = await Promise.all([getPublishedBooks(), listFounderQuotes()]);
  const bookLines: Quote[] = books.flatMap((book) =>
    book.highlights
      .filter((line) => line.trim().length > 0)
      .map((line) => ({
        text: line.trim(),
        source: book.author ? `${book.title} by ${book.author}` : book.title,
        href: `/books/${book.slug}`,
        linkLabel: "Read the book →",
        kind: "book" as const,
      })),
  );
  // Take turns: a Bible verse, a book line, one of the founder's quotes.
  const pools = [VERSES, bookLines, founder.map(founderQuote)].filter((p) => p.length > 0);
  return pick(pools[day % pools.length], Math.floor(day / pools.length));
}
