import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { BIBLE_BOOKS, bookBySlug } from "@/config/bibleBooks";
import { BibleShell } from "@/features/bible/BibleShell";

export const dynamicParams = false;
export function generateStaticParams() {
  return BIBLE_BOOKS.map((b) => ({ book: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/bible/[book]">): Promise<Metadata> {
  const book = bookBySlug((await params).book);
  if (!book) return {};
  return {
    title: { absolute: `${book.name}: All Chapters (KJV) | R.O.M Bible Guide` },
    description: `Read the book of ${book.name} in the King James Bible: ${book.chapters} chapter${book.chapters === 1 ? "" : "s"}, with read-aloud.`,
    alternates: { canonical: `/bible/${book.slug}` },
  };
}

export default async function BookPage({ params }: PageProps<"/bible/[book]">) {
  const book = bookBySlug((await params).book);
  if (!book) notFound();
  return (
    <BibleShell active="read">
      <Container>
        <div className="py-10">
          <Link href="/bible/books" className="text-sm text-foreground/60 hover:text-brand-primary-text">
            ← All books
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{book.name}</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {book.testament === "old" ? "Old Testament" : "New Testament"} · {book.chapters} chapter{book.chapters === 1 ? "" : "s"} · Choose a chapter
          </p>
          <ul className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-12">
            {Array.from({ length: book.chapters }, (_, i) => (
              <li key={i}>
                <Link
                  href={`/bible/${book.slug}/${i + 1}`}
                  className="flex aspect-square items-center justify-center rounded-xl border border-black/10 bg-white text-base font-semibold hover:border-brand-primary-text dark:border-white/10 dark:bg-white/5"
                >
                  {i + 1}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </BibleShell>
  );
}
