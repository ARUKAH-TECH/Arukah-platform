import type { MetadataRoute } from "next";
import { getPublicProjects } from "@/db/projects";
import { getPublicOutreaches } from "@/db/outreaches";
import { getPublishedBooks } from "@/db/books";
import { allArticleSlugs } from "@/db/articles";
import { getPublicProgrammes } from "@/db/programmes";
import { BIBLE_BOOKS } from "@/config/bibleBooks";
import { listDevotionals, listSeries } from "@/db/bible";

// SITE_URL must be set to the real production domain before deploying —
// otherwise the sitemap ships localhost URLs. See docs/ENVIRONMENT.md.
const baseUrl = process.env.SITE_URL || "http://localhost:3000";

const routes = ["", "/about", "/tech", "/footwear", "/ziva", "/books", "/projects", "/ministry", "/ministry/outreach", "/ministry/support", "/contact", "/advertise", "/articles", "/literacy", "/programmes", "/terms", "/refunds", "/bible", "/bible/books", "/bible/devotionals", "/bible/studies"];

// Refreshed at most every hour, and immediately after an admin edit
// (the CMS actions revalidate /sitemap.xml).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  // Only published, currently visible projects (Row Level Security hides
  // the rest). On a database error this is an empty list, never a failure.
  const projects = await getPublicProjects(undefined, 500);
  const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: project.publishAt ? new Date(project.publishAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const outreaches = await getPublicOutreaches(500);
  const outreachPages: MetadataRoute.Sitemap = outreaches.map((outreach) => ({
    url: `${baseUrl}/ministry/outreach/${outreach.slug}`,
    lastModified: outreach.date ? new Date(`${outreach.date}T00:00:00Z`) : new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const books = await getPublishedBooks();
  const bookPages: MetadataRoute.Sitemap = books.map((book) => ({
    url: `${baseUrl}/books/${book.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const articles = await allArticleSlugs();
  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const programmes = await getPublicProgrammes();
  const programmePages: MetadataRoute.Sitemap = programmes
    .filter((p) => p.status !== "cancelled")
    .map((p) => ({ url: `${baseUrl}/programmes/${p.slug}`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 }));

  // The Bible: every book and chapter, plus devotionals and studies.
  const biblePages: MetadataRoute.Sitemap = BIBLE_BOOKS.flatMap((b) => [
    { url: `${baseUrl}/bible/${b.slug}`, changeFrequency: "yearly" as const, priority: 0.4 },
    ...Array.from({ length: b.chapters }, (_, i) => ({ url: `${baseUrl}/bible/${b.slug}/${i + 1}`, changeFrequency: "yearly" as const, priority: 0.4 })),
  ]);
  const [devotionals, series] = await Promise.all([listDevotionals(400), listSeries()]);
  const devotionalPages: MetadataRoute.Sitemap = devotionals.map((d) => ({ url: `${baseUrl}/bible/devotionals/${d.day}`, lastModified: new Date(`${d.day}T00:00:00Z`), changeFrequency: "yearly", priority: 0.5 }));
  const studyPages: MetadataRoute.Sitemap = series.flatMap((s) => [
    { url: `${baseUrl}/bible/studies/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 },
    ...Array.from({ length: s.lessonCount }, (_, i) => ({ url: `${baseUrl}/bible/studies/${s.slug}/${i + 1}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ]);

  return [...pages, ...projectPages, ...outreachPages, ...bookPages, ...articlePages, ...programmePages, ...biblePages, ...devotionalPages, ...studyPages];
}
