import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { getPublishedBooks } from "@/db/books";
import { ListenButton } from "./ListenButton";

// A new line every day (midnight, Ghana time = UTC): days alternate between
// a line from one of our books (the "Lines readers love" in Admin → Books)
// and a Bible verse for Repent Online Ministries. Adding highlights to a book
// adds them to the rotation automatically.

const SITE = process.env.SITE_URL || "https://zivarukah.com";

interface Quote {
  text: string;
  source: string;
  href: string;
  linkLabel: string;
  kind: "book" | "verse";
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

async function todaysQuote(): Promise<Quote> {
  const day = Math.floor(Date.now() / 86_400_000);
  const books = await getPublishedBooks();
  const bookLines: Quote[] = books.flatMap((book) =>
    book.highlights
      .filter((line) => line.trim().length > 0)
      .map((line) => ({
        text: line.trim(),
        source: book.author ? `${book.title} — ${book.author}` : book.title,
        href: `/books/${book.slug}`,
        linkLabel: "Read the book →",
        kind: "book" as const,
      })),
  );
  if (bookLines.length > 0 && day % 2 === 0) return pick(bookLines, day / 2);
  return pick(VERSES, Math.floor(day / 2));
}

export async function QuoteOfTheDay() {
  const quote = await todaysQuote();
  const isVerse = quote.kind === "verse";
  return (
    <section aria-labelledby="quote-title" className="py-10">
      <Container>
        <figure
          className={`relative overflow-hidden rounded-3xl p-8 shadow-lg sm:p-12 ${
            isVerse ? "bg-gradient-to-br from-[#14110c] to-[#3b2f14] text-white" : "bg-gradient-to-br from-[#fdf3dc] to-[#f3d48a] text-[#14110c]"
          }`}
        >
          <span aria-hidden="true" className="pointer-events-none absolute -top-6 right-5 font-serif text-[10rem] leading-none opacity-15">
            “
          </span>
          <p id="quote-title" className={`relative text-xs font-semibold uppercase tracking-widest ${isVerse ? "text-[#f0c050]" : "text-[#7a4a12]"}`}>
            {isVerse ? "✝️ Verse of the day" : "📘 Quote of the day"}
          </p>
          <blockquote className="relative mt-4 max-w-3xl font-serif text-2xl italic leading-snug sm:text-3xl">{quote.text}</blockquote>
          <figcaption className={`relative mt-4 text-sm font-medium ${isVerse ? "text-white/70" : "text-[#14110c]/70"}`}>— {quote.source}</figcaption>
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <ListenButton text={`${quote.text} ${quote.source.replace("(KJV)", "")}`} dark={isVerse} />
            <Link href={quote.href} className={`text-sm font-semibold underline-offset-4 hover:underline ${isVerse ? "text-[#f0c050]" : "text-[#7a4a12]"}`}>
              {quote.linkLabel}
            </Link>
          </div>
          <ShareButtons
            className="relative mt-5"
            dark={isVerse}
            label="Share today's line"
            url={`${SITE}${quote.href}`}
            title={isVerse ? "Verse of the day" : "Quote of the day"}
            message={`${isVerse ? "✝️ *Verse of the day*" : "📘 *Quote of the day*"}\n\n“${quote.text}”\n— ${quote.source}`}
          />
        </figure>
      </Container>
    </section>
  );
}
