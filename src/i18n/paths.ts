import { DEFAULT_LOCALE, type Locale } from "./config";

/** Routes with English-only body — no per-locale hreflang; ?lang= is UI chrome only. */
export const ENGLISH_ONLY_PREFIXES = ["/blog", "/pricing", "/privacy", "/request-tool"] as const;

export function isEnglishOnlyPath(pathname: string): boolean {
  const p = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if ((ENGLISH_ONLY_PREFIXES as readonly string[]).includes(p)) return true;
  return p.startsWith("/blog/");
}

/** Build in-app URL for a locale (clean path for en / English-only pages). */
export function pathWithLocale(pathname: string, locale: Locale): string {
  const base = pathname.split("?")[0] || "/";
  if (locale === DEFAULT_LOCALE || isEnglishOnlyPath(base)) return base;
  return `${base}?lang=${locale}`;
}

/** Strip ?lang= from pathname + search if present. */
export function stripLangParam(pathname: string, search = ""): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  params.delete("lang");
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}
