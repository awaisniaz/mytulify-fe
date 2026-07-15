import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Block JSON/API crawl surfaces that waste budget.
 * Do NOT disallow /_next/static/ — needed for page rendering.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_next/data/", "/api/"],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
