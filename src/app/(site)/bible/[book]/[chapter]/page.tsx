import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { BIBLE_BOOKS, bookBySlug } from "@/config/bibleBooks";
import { BibleShell } from "@/features/bible/BibleShell";
import { ChapterReader } from "@/features/bible/ChapterReader";
import { getChapter } from "@/server/bible";

export const dynamicParams = false;
export function generateStaticParams() {
  return BIBLE_BOOKS.flatMap((b) => Array.from({ length: b.chapters }, (_, i) => ({ book: b.slug, chapter: String(i + 1) })));
}

const nameOf = (slug: string, chapter: number) => (slug === "psalms" ? `Psalm ${chapter}` : `${bookBySlug(slug)?.name} ${chapter}`);

export async function generateMetadata({ params }: PageProps<"/bible/[book]/[chapter]">): Promise<Metadata> {
  const { book: slug, chapter: c } = await params;
  const book = bookBySlug(slug);
  const verses = book ? await getChapter(slug, Number(c)) : null;
  if (!book || !verses) return {};
  const label = nameOf(slug, Number(c));
  return {
    title: { absolute: `${label} (KJV): Read Online with Audio | Repent Online Ministries` },
    description: `${label} KJV: “${verses[0].slice(0, 120)}${verses[0].length > 120 ? "…" : ""}” Read the full chapter with read-aloud.`,
    alternates: { canonical: `/bible/${slug}/${c}` },
  };
}

export default async function ChapterPage({ params }: PageProps<"/bible/[book]/[chapter]">) {
  const { book: slug, chapter: c } = await params;
  const book = bookBySlug(slug);
  const chapter = Number(c);
  const verses = book ? await getChapter(slug, chapter) : null;
  if (!book || !verses) notFound();

  // Previous / next chapter, across books.
  const index = BIBLE_BOOKS.indexOf(book);
  const prev = chapter > 1 ? { slug, chapter: chapter - 1 } : index > 0 ? { slug: BIBLE_BOOKS[index - 1].slug, chapter: BIBLE_BOOKS[index - 1].chapters } : null;
  const next = chapter < book.chapters ? { slug, chapter: chapter + 1 } : index < BIBLE_BOOKS.length - 1 ? { slug: BIBLE_BOOKS[index + 1].slug, chapter: 1 } : null;
  const label = nameOf(slug, chapter);

  return (
    <BibleShell active="read">
      <Container>
        <article className="mx-auto max-w-3xl pb-28 pt-6">
          <Link href={`/bible/${slug}`} className="text-sm text-foreground/60 hover:text-brand-primary-text">
            ← {book.name}: all chapters
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{label}</h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground/60">
            <span>Choose the version (KJV, BSB, WEB…) in the bar below.</span>
            <span>
              Also on BibleGateway:{" "}
              {["NIV", "AMP", "NKJV"].map((v, i) => (
                <span key={v}>
                  {i > 0 && " · "}
                  <a
                    href={`https://www.biblegateway.com/passage/?search=${encodeURIComponent(`${book.name} ${chapter}`)}&version=${v}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-primary-text underline"
                  >
                    {v}
                  </a>
                </span>
              ))}
            </span>
          </p>
          <div className="mt-2">
            <ChapterReader slug={slug} label={label} chapter={chapter} verses={verses} />
          </div>
          <nav aria-label="Chapters" className="mt-10 flex items-center justify-between gap-3">
            {prev ? (
              <Link href={`/bible/${prev.slug}/${prev.chapter}`} className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold dark:border-white/15">
                ← {nameOf(prev.slug, prev.chapter)}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/bible/${next.slug}/${next.chapter}`} className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-brand-on-primary">
                {nameOf(next.slug, next.chapter)} →
              </Link>
            )}
          </nav>
        </article>
      </Container>
    </BibleShell>
  );
}
