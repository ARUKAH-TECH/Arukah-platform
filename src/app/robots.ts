import type { MetadataRoute } from "next";

const baseUrl = process.env.SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/dev/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
