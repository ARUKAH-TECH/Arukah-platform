import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getPublishedBook } from "@/db/books";
import { formatGhs } from "@/config/books";

// Refreshed at most every minute, and immediately after an admin edit.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/books/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) return {};
  return {
    title: `${book.title} · ZIVARUKAH BOOKS`,
    description: book.description.slice(0, 160) || undefined,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: book.cover ? { images: [book.cover.url] } : undefined,
  };
}

export default async function BookPage({ params }: PageProps<"/books/[slug]">) {
  const { slug } = await params;
  const book = await getPublishedBook(slug);
  if (!book) notFound();

  const paragraphs = book.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const sample = book.sampleText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="py-12">
      <Container>
        <Link href="/books" className="text-sm text-foreground/60 hover:text-brand-primary-text">
          ← All books
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,280px)_1fr]">
          <div>
            {book.cover ? (
              <Image
                src={book.cover.url}
                alt={`Cover of ${book.title}`}
                width={book.cover.width ?? 600}
                height={book.cover.height ?? 900}
                sizes="(min-width: 768px) 280px, 70vw"
                preload
                className="mx-auto w-full max-w-[280px] rounded-xl shadow-lg"
              />
            ) : (
              <div className="mx-auto flex aspect-[2/3] w-full max-w-[280px] items-center justify-center rounded-xl bg-black/5 p-6 text-center font-semibold text-foreground/60 dark:bg-white/5">
                {book.title}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">ZIVARUKAH BOOKS</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{book.title}</h1>
            {book.author && <p className="mt-2 text-foreground/70">by {book.author}</p>}

            {book.prices.length > 0 && (
              <ul className="mt-6 flex flex-col gap-2">
                {book.prices.map((price) => (
                  <li
                    key={price.format}
                    className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 text-sm dark:border-white/10"
                  >
                    <span>{price.label}</span>
                    <span className="font-semibold">{formatGhs(price.amount)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div id="order" className="mt-6">
              <Button href="/contact">Order this book</Button>
              <p className="mt-2 text-xs text-foreground/50">Online ordering is coming soon — for now, send us a message and we&apos;ll arrange it.</p>
            </div>

            {paragraphs.length > 0 && (
              <div className="mt-10 flex flex-col gap-4 text-sm leading-7 text-foreground/80">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}

            {sample.length > 0 && (
              <details className="mt-10 rounded-2xl border border-black/10 p-5 dark:border-white/10">
                <summary className="cursor-pointer text-sm font-semibold">Read a sample</summary>
                <div className="mt-4 flex flex-col gap-4 font-serif text-[15px] leading-8 text-foreground/80">
                  {sample.map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      </Container>
    </article>
  );
}
