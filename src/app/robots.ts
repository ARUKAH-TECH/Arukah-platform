import type { MetadataRoute } from "next";

const baseUrl = process.env.SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dev/", "/admin", "/ad-click/", "/outreach-photo/", "/books/basket"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
