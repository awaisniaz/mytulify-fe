import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";

const LOCALE_HEADER = "x-mytulify-locale";

export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const fromHeader = h.get(LOCALE_HEADER);
  if (fromHeader && isLocale(fromHeader)) return fromHeader;
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}
