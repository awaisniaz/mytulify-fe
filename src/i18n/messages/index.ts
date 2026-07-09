import type { Locale } from "../config";
import { DEFAULT_LOCALE } from "../config";
import { compileMessages } from "./compile";
import type { Messages, RawMessages } from "./types";
import enRaw from "./locales/en.json";

export type { Messages };

const cache = new Map<Locale, Messages>();
const fallback = compileMessages(enRaw as RawMessages);
cache.set("en", fallback);

export async function getMessages(locale: Locale): Promise<Messages> {
  if (cache.has(locale)) return cache.get(locale)!;
  try {
    const mod = await import(`./locales/${locale}.json`);
    const compiled = compileMessages(mod.default as RawMessages);
    cache.set(locale, compiled);
    return compiled;
  } catch {
    return fallback;
  }
}

/** Sync access when locale is already loaded (e.g. after await getMessages). */
export function getCachedMessages(locale: Locale): Messages {
  return cache.get(locale) ?? fallback;
}

export async function preloadMessages(locale: Locale) {
  if (locale === DEFAULT_LOCALE) return fallback;
  return getMessages(locale);
}
