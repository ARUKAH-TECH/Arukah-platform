import Image from "next/image";
import Link from "next/link";
import type { ArticleSummary } from "@/db/articles";

export function formatArticleDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" });
}

export function ArticleCard({ article }: { article: ArticleSummary }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white transition-colors hover:border-brand-primary-text dark:border-white/10 dark:bg-zinc-900">
      <Link href={`/articles/${article.slug}`} tabIndex={-1} aria-hidden="true">
        {article.image ? (
          <Image
            src={article.image.url}
            alt=""
            width={article.image.width ?? 1200}
            height={article.image.height ?? 675}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="aspect-[16/9] w-full bg-black/5 object-cover"
          />
        ) : (
          <div className="flex aspect-[16/9] w-full items-center justify-center bg-brand-primary/10 p-6 text-center text-sm font-semibold text-brand-primary-text">
            {article.category?.name ?? "ZIVARUKAH"}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-foreground/60">
          {article.category && (
            <Link href={`/articles?category=${article.category.slug}`} className="font-semibold uppercase tracking-wider text-brand-primary-text">
              {article.category.name}
            </Link>
          )}
          <time dateTime={article.publishedAt}>{formatArticleDate(article.publishedAt)}</time>
        </p>
        <h2 className="text-lg font-semibold leading-snug">
          <Link href={`/articles/${article.slug}`} className="hover:text-brand-primary-text">
            {article.title}
          </Link>
        </h2>
        {article.excerpt && <p className="line-clamp-3 text-sm leading-6 text-foreground/70">{article.excerpt}</p>}
        <Link href={`/articles/${article.slug}`} className="mt-auto pt-2 text-sm font-semibold text-brand-primary-text">
          Read article →<span className="sr-only">: {article.title}</span>
        </Link>
      </div>
    </article>
  );
}
