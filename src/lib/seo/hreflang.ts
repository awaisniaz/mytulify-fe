import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { site } from "@/lib/site";

/** hreflang URL for a locale — English uses clean path; others use ?lang= */
export function hreflangUrl(path: string, locale: Locale): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const base = `${site.url}${clean}`;
  return locale === DEFAULT_LOCALE ? base : `${base}?lang=${locale}`;
}

/** All alternates for Next.js metadata.alternates.languages (+ x-default). */
export function hreflangAlternates(path: string): Record<string, string> {
  const langs: Record<string, string> = {};
  for (const loc of LOCALES) {
    langs[loc] = hreflangUrl(path, loc);
  }
  langs["x-default"] = hreflangUrl(path, DEFAULT_LOCALE);
  return langs;
}

/** Self-referencing canonical for current locale. */
export function canonicalForLocale(path: string, locale: Locale): string {
  return hreflangUrl(path, locale);
}

/** Open Graph locale codes per site locale. */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ur: "ur_PK",
  ar: "ar_SA",
  fr: "fr_FR",
  de: "de_DE",
  es: "es_ES",
  pt: "pt_PT",
};
