import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { getPublishedBook } from "@/db/books";
import { AddToBasket } from "@/features/books/AddToBasket";
import { quickPaymentsEnabled } from "@/server/quickPayments";
import { JsonLd } from "@/components/seo/JsonLd";
import { ContinueReading } from "@/features/books/ReaderBits";
import { ShareButtons } from "@/components/ui/ShareButtons";

const SITE = process.env.SITE_URL || "https://zivarukah.com";

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
    openGraph: {
      title: book.title,
      description: (book.highlights[0] ? `“${book.highlights[0]}” ` : "") + book.description.slice(0, 140),
      url: `/books/${book.slug}`,
      siteName: "ZIVARUKAH",
      type: "book",
      ...(book.cover ? { images: [{ url: book.cover.url, alt: `Cover of ${book.title}` }] } : {}),
    },
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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: book.title,
          ...(book.author
            ? {
                author: /sarpong|oduro/i.test(book.author)
                  ? { "@type": "Person", "@id": `${SITE.replace(/\/$/, "")}/#founder`, name: book.author, url: `${SITE.replace(/\/$/, "")}/about` }
                  : { "@type": "Person", name: book.author },
              }
            : {}),
          ...(book.description ? { description: book.description.slice(0, 500) } : {}),
          ...(book.cover ? { image: book.cover.url } : {}),
          url: `${SITE}/books/${book.slug}`,
          publisher: { "@type": "Organization", name: "ZIVARUKAH BOOKS" },
          offers: book.prices.map((price) => ({
            "@type": "Offer",
            name: price.label,
            price: price.amount.toFixed(2),
            priceCurrency: "GHS",
            availability: "https://schema.org/InStock",
            url: `${SITE}/books/${book.slug}`,
          })),
        }}
      />
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

            {book.prices.some((p) => p.format === "read") && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ContinueReading slug={book.slug} />
                <Link
                  href={`/books/${book.slug}/read`}
                  className="inline-flex items-center justify-center rounded-full border border-brand-primary-text px-5 py-2 text-sm font-semibold text-brand-primary-text"
                >
                  📖 Read online now, with read-aloud 🔊
                </Link>
              </div>
            )}

            {book.highlights.length > 0 && (
              <section aria-label="Lines readers love" className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">Lines readers love</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {book.highlights.slice(0, 4).map((line) => (
                    <blockquote key={line} className="rounded-2xl bg-brand-primary/10 p-4 font-serif text-base italic leading-7">
                      <span aria-hidden="true" className="mr-1 font-sans text-2xl leading-none text-brand-primary-text">“</span>
                      {line}
                    </blockquote>
                  ))}
                </div>
              </section>
            )}

            <div id="order" className="mt-6">
              {book.prices.length > 0 ? (
                <AddToBasket book={{ id: book.id, slug: book.slug, title: book.title }} prices={book.prices} quickPay={quickPaymentsEnabled()} />
              ) : (
                <>
                  <Button href="/contact">Ask about this book</Button>
                </>
              )}
            </div>

            <ShareButtons
              className="mt-6"
              label="Tell a friend"
              url={`${SITE}/books/${book.slug}`}
              title={book.title}
              message={`📘 *${book.title}*${book.author ? ` by ${book.author}` : ""}${book.highlights[0] ? `\n\n“${book.highlights[0]}”` : ""}\n\nRead a sample on ZIVARUKAH BOOKS 👇`}
            />

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
