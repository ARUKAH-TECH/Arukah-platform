import type { MetadataRoute } from "next";
import { getPublicProjects } from "@/db/projects";

// SITE_URL must be set to the real production domain before deploying —
// otherwise the sitemap ships localhost URLs. See docs/ENVIRONMENT.md.
const baseUrl = process.env.SITE_URL || "http://localhost:3000";

const routes = ["", "/tech", "/footwear", "/ziva", "/media", "/books", "/projects", "/ministry", "/contact"];

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

  return [...pages, ...projectPages];
}
