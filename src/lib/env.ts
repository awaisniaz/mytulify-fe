/**
 * Single place for env reads. Keep this small — only what the app actually needs.
 *
 * Browser-safe (NEXT_PUBLIC_*):
 *   SITE_URL, API_URL
 *
 * Server-only secrets stay in process.env where used (JWT, Groq, Stripe, DB).
 */

function clean(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  return (v || fallback).replace(/\/$/, "");
}

const PRODUCTION_SITE = "https://mytulify.com";

/**
 * Public site origin (canonical, OG, redirects, sitemap).
 * In production builds, never emit localhost — that poisons canonicals & GSC.
 */
function resolveSiteUrl(): string {
  const raw = clean(process.env.NEXT_PUBLIC_SITE_URL, PRODUCTION_SITE);
  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  if (isProd && /localhost|127\.0\.0\.1/i.test(raw)) return PRODUCTION_SITE;
  return raw;
}

/** Public site origin (canonical, OG, redirects). */
export const SITE_URL = resolveSiteUrl();

/** Auth + payments API (browser + server). */
export const API_URL = clean(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4003");

/**
 * Server → backend base URL.
 * Defaults to API_URL so you don't need a second BACKEND_URL in .env.
 */
export const BACKEND_URL = clean(
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:4003",
);
