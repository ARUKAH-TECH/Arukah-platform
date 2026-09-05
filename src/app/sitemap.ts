import type { MetadataRoute } from "next";

// NEXT_PUBLIC_SITE_URL must be set to the real production domain before
// deploying — otherwise the sitemap ships localhost URLs. See
// docs/ENVIRONMENT.md.
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const routes = ["", "/tech", "/footwear", "/ziva", "/media", "/projects", "/ministry", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
