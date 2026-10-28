import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { ArticleBody } from "@/features/articles/ArticleBody";
import { ArticleCard, formatArticleDate } from "@/features/articles/ArticleCard";
import type { ArticleSummary } from "@/db/articles";
import { readingMinutes } from "@/lib/articleMarkup";
import { ShareButtons } from "@/components/ui/ShareButtons";

export interface ArticleViewData {
  title: string;
  excerpt: string;
  content: string;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string | null;
  category: { slug: string; name: string } | null;
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
}

/** The article layout — used by the public page and by the admin preview. */
export function ArticleView({ article, related = [], banner, shareUrl }: { article: ArticleViewData; related?: ArticleSummary[]; banner?: ReactNode; shareUrl?: string }) {
  const minutes = readingMinutes(article.content);
  const author = article.authorName || "ZIVARUKAH";
  const updated =
    article.updatedAt && article.publishedAt && new Date(article.updatedAt).getTime() - new Date(article.publishedAt).getTime() > 24 * 3600 * 1000
      ? article.updatedAt
      : null;

  return (
    <article className="py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-3xl">
          {banner}
          <Link href="/articles" className="text-sm text-foreground/60 hover:text-brand-primary-text">
            ← All articles
          </Link>
          {article.category && (
            <p className="mt-6">
              <Link
                href={`/articles?category=${article.category.slug}`}
                className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text"
              >
                {article.category.name}
              </Link>
            </p>
          )}
          <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{article.title}</h1>
          {article.excerpt && <p className="mt-4 text-lg leading-8 text-foreground/70">{article.excerpt}</p>}

          <div className="mt-6 flex items-center gap-3 border-y border-black/10 py-4 text-sm dark:border-white/10">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary font-bold text-brand-on-primary"
            >
              {author.trim().charAt(0).toUpperCase()}
            </span>
            <div>
              <p className="font-semibold">By {author}</p>
              <p className="text-foreground/60">
                {article.publishedAt ? <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time> : "Not published yet"}
                {" · "}
                {minutes} min read
                {updated && (
                  <>
                    {" · Updated "}
                    <time dateTime={updated}>{formatArticleDate(updated)}</time>
                  </>
                )}
              </p>
            </div>
          </div>

          {article.image && (
            <figure className="mt-8">
              <Image
                src={article.image.url}
                alt={article.image.alt}
                width={article.image.width ?? 1600}
                height={article.image.height ?? 900}
                sizes="(min-width: 768px) 768px, 100vw"
                preload
                className="w-full rounded-2xl bg-black/5 object-cover dark:bg-white/5"
              />
            </figure>
          )}

          <div className="mt-8">
            <ArticleBody content={article.content} />
          </div>

          {shareUrl && (
            <ShareButtons
              className="mt-10 border-t border-black/10 pt-6 dark:border-white/10"
              label="Share this article"
              url={shareUrl}
              title={article.title}
              message={`📰 *${article.title}*${article.excerpt ? `\n\n${article.excerpt}` : ""}\n\nRead it on ZIVARUKAH 👇`}
            />
          )}
        </div>

        {related.length > 0 && (
          <section aria-label="Related articles" className="mx-auto mt-16 max-w-5xl">
            <h2 className="text-xl font-bold tracking-tight">Related articles</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </article>
  );
}
