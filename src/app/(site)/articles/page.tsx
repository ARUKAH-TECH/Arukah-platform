import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ArticleCard } from "@/features/articles/ArticleCard";
import { ARTICLES_PER_PAGE, cleanSearch, getArticleCategories, listArticles } from "@/db/articles";
import { SharePage } from "@/components/ui/SharePage";

export const revalidate = 60;

export async function generateMetadata({ searchParams }: PageProps<"/articles">): Promise<Metadata> {
  const { category, q, page } = await searchParams;
  const filtered = Boolean(q) || Boolean(page && page !== "1");
  const categories = await getArticleCategories();
  const cat = categories.find((c) => c.slug === category);
  return {
    title: cat ? `${cat.name}: Articles` : "Articles",
    description: cat
      ? `Articles on ${cat.name.toLowerCase()} from ZIVARUKAH.`
      : "Articles from ZIVARUKAH on technology and innovation, education, entrepreneurship, faith and spiritual growth, and books.",
    alternates: { canonical: cat ? `/articles?category=${cat.slug}` : "/articles" },
    // Search results and later pages shouldn't compete with the main list in Google.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticlesPage({ searchParams }: PageProps<"/articles">) {
  const params = await searchParams;
  const q = cleanSearch(typeof params.q === "string" ? params.q : "");
  const categorySlug = typeof params.category === "string" ? params.category : "";
  const page = Math.max(1, Number(params.page) || 1);
  const categories = await getArticleCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  const { articles, total } = await listArticles({ q, categoryId: category?.id, page });
  const pages = Math.max(1, Math.ceil(total / ARTICLES_PER_PAGE));
  const link = (next: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { q: q || undefined, category: category?.slug, ...next };
    for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "page" && String(v) === "1")) sp.set(k, String(v));
    const s = sp.toString();
    return s ? `/articles?${s}` : "/articles";
  };

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-text">ZIVARUKAH</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{category ? category.name : "Articles"}</h1>
        <p className="mt-3 max-w-2xl text-foreground/70">
          Ideas and lessons on technology, learning, business, faith and books.
        </p>

        <form action="/articles" method="get" role="search" className="mt-8 flex max-w-xl gap-2">
          {category && <input type="hidden" name="category" value={category.slug} />}
          <label htmlFor="article-search" className="sr-only">
            Search articles
          </label>
          <input
            id="article-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search articles…"
            maxLength={80}
            className="w-full rounded-full border border-black/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-primary-text dark:border-white/15"
          />
          <button type="submit" className="rounded-full bg-brand-primary px-5 py-2.5 text-sm font-medium text-brand-on-primary">
            Search
          </button>
        </form>

        <nav aria-label="Categories" className="-mx-4 mt-5 overflow-x-auto px-4">
          <ul className="flex w-max gap-2 text-sm">
            <li>
              <Link
                href={q ? `/articles?q=${encodeURIComponent(q)}` : "/articles"}
                aria-current={!category ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full border px-3 py-1.5 ${!category ? "border-brand-primary-text bg-brand-primary/10 font-semibold" : "border-black/10 dark:border-white/10"}`}
              >
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/articles?category=${c.slug}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  aria-current={category?.id === c.id ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-full border px-3 py-1.5 ${category?.id === c.id ? "border-brand-primary-text bg-brand-primary/10 font-semibold" : "border-black/10 dark:border-white/10"}`}
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {q && (
          <p className="mt-6 text-sm text-foreground/70">
            {total} result{total === 1 ? "" : "s"} for “{q}”.{" "}
            <Link href={category ? `/articles?category=${category.slug}` : "/articles"} className="underline">
              Clear search
            </Link>
          </p>
        )}

        {articles.length === 0 ? (
          <p className="mt-12 text-foreground/60">{q || category ? "No articles found." : "Articles are coming soon."}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link href={link({ page: page - 1 })} className="rounded-full border border-black/15 px-4 py-2 dark:border-white/15">
                ← Newer
              </Link>
            ) : (
              <span />
            )}
            <span className="text-foreground/60">
              Page {page} of {pages}
            </span>
            {page < pages && (
              <Link href={link({ page: page + 1 })} className="rounded-full border border-black/15 px-4 py-2 dark:border-white/15">
                Older →
              </Link>
            )}
          </nav>
        )}
      </Container>
      <SharePage
        path="/articles"
        title="Articles: ZIVARUKAH"
        message={"📰 *Articles on ZIVARUKAH*\n\nEducation, technology, faith and more 👇"}
        heading="📣 Share our articles"
      />
    </div>
  );
}
