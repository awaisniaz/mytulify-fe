export const LOCALES = ["en", "ur", "fr", "de", "es", "pt"] as const;

export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "mytulify_locale";

/** RTL writing direction */
export const RTL_LOCALES: Locale[] = ["ur"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ur: "اردو",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
}

/** Grouped for language picker UI */
export const LOCALE_GROUPS: { label: string; locales: Locale[] }[] = [
  { label: "Language", locales: ["en", "ur", "fr", "de", "es", "pt"] },
];
