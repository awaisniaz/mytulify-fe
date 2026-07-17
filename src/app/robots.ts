import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawl rules:
 * - Index: home, tools, categories, all live tools, about, privacy, /pricing
 * - Block: APIs, auth, login/signup, checkout handoff & success (also meta noindex)
 * - Explicitly allow major AI / answer-engine crawlers for GEO citations
 * Do NOT disallow /_next/static/ — needed for rendering.
 */
const DISALLOW = [
  "/_next/data/",
  "/api/",
  "/login",
  "/signup",
  "/auth/",
  "/pricing/pay",
  "/pricing/success",
];

/** AI crawlers we want to cite Mytulify (GEO). */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "GoogleOther",
  "PerplexityBot",
  "Amazonbot",
  "Applebot-Extended",
  "Bytespider",
  "meta-externalagent",
  "FacebookBot",
  "cohere-ai",
  "Diffbot",
  "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      // Explicit allow for AI crawlers (GEO) — same public paths, same private blocks
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
