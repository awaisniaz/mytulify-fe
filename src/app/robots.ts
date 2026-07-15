import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawl rules:
 * - Index: home, tools, categories, all live tools, about, privacy, /pricing
 * - Block: APIs, auth, login/signup, checkout handoff & success (also meta noindex)
 * Do NOT disallow /_next/static/ — needed for rendering.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/_next/data/",
        "/api/",
        "/login",
        "/signup",
        "/auth/",
        "/pricing/pay",
        "/pricing/success",
      ],
    },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
