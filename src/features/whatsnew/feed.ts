import "server-only";
import { getPublishedBooks } from "@/db/books";
import { listArticles } from "@/db/articles";
import { getPublicProjects } from "@/db/projects";
import { LITERACY_URL } from "@/config/literacy";

// "What's new" on the homepage: the latest things published anywhere on the
// site, newest first. It fills itself — publishing a book, article or project
// in the admin puts it here automatically, linking to its own page.

export type NewsKind = "book" | "article" | "project" | "app";

export interface NewsItem {
  key: string;
  kind: NewsKind;
  label: string; // "New book"
  title: string;
  teaser: string;
  cta: string; // "Read a sample →"
  href: string;
  external?: boolean;
  date: string; // ISO
  image: { url: string; alt: string; width: number | null; height: number | null } | null;
}

// Things launched outside the database (apps, new sections). Add a line here
// to feature them; they drop down the list naturally as newer things arrive.
const LAUNCHES: NewsItem[] = [
  {
    key: "app-literacy",
    kind: "app",
    label: "New app · Free",
    title: "ZIVA Literacy & Handwriting Coach",
    teaser: "Reading, phonics, spelling and handwriting for KG to JHS — with read-aloud, finger tracing and stars. Works offline.",
    cta: "Open the app →",
    href: LITERACY_URL,
    external: true,
    date: "2026-10-27T12:00:00Z",
    image: { url: "/branding/ziva-literacy/logo.webp", alt: "ZIVA Literacy logo", width: 480, height: 480 },
  },
];

const HIDDEN_SLUG = /^system-test/; // internal test content never shows here

function shorten(text: string, max = 140) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export async function getWhatsNew(limit = 6): Promise<NewsItem[]> {
  const [books, { articles }, projects] = await Promise.all([
    getPublishedBooks(),
    listArticles({ limit: 6 }),
    getPublicProjects(undefined, 6),
  ]);

  const items: NewsItem[] = [...LAUNCHES];

  for (const book of books) {
    const prices = book.prices.map((p) => p.amount).filter((n) => n > 0);
    const from = prices.length ? ` From GHS ${Math.min(...prices).toFixed(2)}.` : "";
    items.push({
      key: `book-${book.id}`,
      kind: "book",
      label: "New book",
      title: book.title,
      teaser: shorten(book.highlights[0] ? `“${book.highlights[0]}”` : book.description) + from,
      cta: "Read a sample →",
      href: `/books/${book.slug}`,
      date: book.createdAt,
      image: book.cover ? { ...book.cover, alt: `Cover of ${book.title}` } : null,
    });
  }

  for (const article of articles) {
    if (HIDDEN_SLUG.test(article.slug)) continue;
    items.push({
      key: `article-${article.id}`,
      kind: "article",
      label: article.category ? `New article · ${article.category.name}` : "New article",
      title: article.title,
      teaser: shorten(article.excerpt),
      cta: "Read the article →",
      href: `/articles/${article.slug}`,
      date: article.publishedAt,
      image: article.image ? { ...article.image, alt: article.image.alt || article.title } : null,
    });
  }

  for (const project of projects) {
    if (HIDDEN_SLUG.test(project.slug)) continue;
    items.push({
      key: `project-${project.id}`,
      kind: "project",
      label: "New project",
      title: project.title,
      teaser: shorten(project.summary),
      cta: "See the project →",
      href: `/projects/${project.slug}`,
      date: project.publishAt ?? new Date(0).toISOString(),
      image:
        project.cover?.kind === "image"
          ? { url: project.cover.url, alt: project.cover.altText || project.title, width: project.cover.width, height: project.cover.height }
          : null,
    });
  }

  return items
    .filter((item) => item.date && !Number.isNaN(Date.parse(item.date)))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, limit);
}

/** "NEW" badge for anything from the last 21 days. */
export function isFresh(date: string, now = Date.now()) {
  return now - Date.parse(date) < 21 * 24 * 3600 * 1000;
}
