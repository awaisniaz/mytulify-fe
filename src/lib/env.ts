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

/** Public site origin (canonical, OG, redirects). */
export const SITE_URL = clean(process.env.NEXT_PUBLIC_SITE_URL, "https://mytulify.com");

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
