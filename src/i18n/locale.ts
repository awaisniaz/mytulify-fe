import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

const LOCALE_HEADER = "x-mytulify-locale";

type LangParam = Promise<{ lang?: string | string[] }> | { lang?: string | string[] };

function localeFromLangParam(sp: { lang?: string | string[] }): Locale | undefined {
  const raw = sp.lang;
  const lang = Array.isArray(raw) ? raw[0] : raw;
  return lang && isLocale(lang) ? lang : undefined;
}

/** UI/content locale — cookie + header fallback. */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const fromHeader = h.get(LOCALE_HEADER);
  if (fromHeader && isLocale(fromHeader)) return fromHeader;
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Locale for canonical/hreflang — must match the URL, not a stored cookie.
 * Cookie-based Arabic on a clean /path URL would otherwise emit ?lang=ar canonical → conflict.
 */
export async function getMetadataLocale(searchParams?: LangParam): Promise<Locale> {
  if (searchParams) {
    const fromQuery = localeFromLangParam(await Promise.resolve(searchParams));
    if (fromQuery) return fromQuery;
  }
  const h = await headers();
  const fromHeader = h.get(LOCALE_HEADER);
  if (fromHeader && isLocale(fromHeader)) return fromHeader;
  return DEFAULT_LOCALE;
}
