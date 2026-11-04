import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getPublishedBook } from "@/db/books";
import { Reader } from "@/features/books/Reader";
import { PayToRead, RememberReading } from "@/features/books/ReaderBits";
import { loadPreview, loadReader } from "@/server/bookReader";
import { quickPaymentsEnabled } from "@/server/quickPayments";
import { whatsappLink } from "@/config/forms";

export const metadata: Metadata = { title: "Read online · ZIVARUKAH BOOKS", robots: { index: false } };

export default async function ReadBookPage({ params, searchParams }: PageProps<"/books/[slug]/read">) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const reference = typeof ref === "string" ? ref.toUpperCase() : "";
  const access = await loadReader(slug, reference);

  if (access.ok) {
    return (
      <div className="py-8">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href={`/books/${access.book.slug}`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
              ← About this book
            </Link>
            <h1 className="mt-4 text-center text-3xl font-bold tracking-tight">{access.book.title}</h1>
            {access.book.author && <p className="mt-1 text-center text-sm text-foreground/60">{access.book.author}</p>}
            {access.mode === "admin" && (
              <p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-xs text-amber-950 dark:bg-amber-950 dark:text-amber-100">
                Admin preview: buyers see this after paying for &quot;Read online&quot;.
              </p>
            )}
            {(access.mode === "paid" || access.mode === "free") && <RememberReading slug={access.book.slug} reference={reference} />}
            {access.mode === "free" && (
              <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
                🎁 Free reading key from ZIVA Literacy, open until{" "}
                <strong>{new Date(access.expiresAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" })}</strong>
                .
              </p>
            )}
            <p className="mt-4 text-center text-xs text-foreground/60">
              Tap <strong>▶ Read aloud</strong> at the bottom to listen from page 1 to the end. Underlined words show their meaning when tapped.
            </p>
            <div className="mt-8">
              <Reader
                title={access.book.title}
                author={access.book.author}
                pages={access.book.pages}
                highlights={access.book.highlights}
                storageKey={`zivarukah-reader:${access.book.slug}`}
              />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Not paid (or no text yet): the free part (chapter 1 and half of chapter 2), then pay.
  const book = await getPublishedBook(slug);
  if (!book) notFound();
  const readPrice = book.prices.find((p) => p.format === "read");
  const preview = access.reason === "no-text" ? null : await loadPreview(slug);
  return (
    <div className="py-8">
      {preview && (
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link href={`/books/${book.slug}`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
              ← About this book
            </Link>
            <h1 className="mt-4 text-center text-3xl font-bold tracking-tight">{book.title}</h1>
            {book.author && <p className="mt-1 text-center text-sm text-foreground/60">{book.author}</p>}
            <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-950 dark:bg-emerald-950 dark:text-emerald-100">
              📖 <strong>Free to read:</strong> Chapter 1 and the first half of Chapter 2. Pay once to read the whole book.
            </p>
            <div className="mt-8">
              <Reader
                title={preview.book.title}
                author={preview.book.author}
                pages={preview.book.pages}
                highlights={preview.book.highlights}
                storageKey={`zivarukah-reader-free:${preview.book.slug}`}
              />
            </div>
          </div>
        </Container>
      )}
      <Container>
        <div id="continue" className="mx-auto mt-10 max-w-xl rounded-3xl text-center border border-black/10 p-6 text-center dark:border-white/10">
          <h2 className="text-2xl font-bold tracking-tight">{preview ? "Enjoying it? Continue reading" : book.title}</h2>
          {access.reason === "expired" ? (
            <p className="mt-4 text-sm text-foreground/70">
              {reference.startsWith("ZF-") ? "Your free reading time has ended. You can buy the book below." : "Your online reading time for this book has ended."}
            </p>
          ) : access.reason === "no-text" ? (
            <p className="mt-4 text-sm text-foreground/70">The online edition is being prepared. Please check back soon.</p>
          ) : (
            <p className="mt-4 text-sm text-foreground/70">
              {preview ? "The rest of the story opens straight after paying, with read-aloud." : "Read the whole book here on your phone, with read-aloud, straight after paying."}
            </p>
          )}
          {readPrice && access.reason !== "no-text" && (
            <div className="mt-6 flex justify-center">
              <PayToRead slug={book.slug} price={readPrice.amount} enabled={quickPaymentsEnabled()} />
            </div>
          )}
          <p className="mt-8 text-sm">
            Paid already but can&apos;t open it?{" "}
            <a href={whatsappLink(`Hello ZIVARUKAH BOOKS, I paid to read "${book.title}" online. My payment reference is: `)} className="font-semibold underline">
              Message us on WhatsApp
            </a>
          </p>
          <Link href={`/books/${book.slug}`} className="mt-4 inline-block text-sm text-foreground/60 underline">
            Back to the book
          </Link>
        </div>
      </Container>
    </div>
  );
}
