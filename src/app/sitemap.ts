import type { MetadataRoute } from "next";
import { getPublicProjects } from "@/db/projects";
import { getPublicOutreaches } from "@/db/outreaches";
import { getPublishedBooks } from "@/db/books";
import { allArticleSlugs } from "@/db/articles";

// SITE_URL must be set to the real production domain before deploying —
// otherwise the sitemap ships localhost URLs. See docs/ENVIRONMENT.md.
const baseUrl = process.env.SITE_URL || "http://localhost:3000";

const routes = ["", "/tech", "/footwear", "/ziva", "/media", "/books", "/projects", "/ministry", "/ministry/outreach", "/ministry/support", "/contact", "/advertise", "/articles", "/literacy"];

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

  return [...pages, ...projectPages, ...outreachPages, ...bookPages, ...articlePages];
}
