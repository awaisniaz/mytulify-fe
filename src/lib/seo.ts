import type { Metadata } from "next";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import type { Locale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { canonicalForLocale, hreflangUrl, OG_LOCALE } from "@/lib/seo/hreflang";

type SocialMeta = Pick<Metadata, "openGraph" | "twitter">;

/** Site-wide share preview (1200×630). */
export const OG_IMAGE = {
  url: "/og-share.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${messaging.ogToolsLabel}`,
} as const;

/** Keep the document title inside the length site audits accept. */
export function clampTitle(text: string, max = 60): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim();
}

/** Clamp meta description to ~155 chars for SERP. */
export function clampMetaDescription(text: string, max = 155): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/**
 * Canonical + hreflang. Only English is advertised.
 * Locale files still leave most tool names and descriptions in English, so a
 * ?lang=ur URL is an English page. Pointing hreflang=ur at it is a language mismatch.
 */
export function pageAlternates(path: string, locale: Locale = "en"): Pick<Metadata, "alternates"> {
  const canonical = canonicalForLocale(path, DEFAULT_LOCALE);
  if (locale !== DEFAULT_LOCALE) {
    return { alternates: { canonical } };
  }
  return {
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "x-default": canonical,
      },
    },
  };
}

/** Index the English URL. ?lang= copies are UI only until the body is translated. */
export function publicRobots(locale: Locale, index = true): NonNullable<Metadata["robots"]> {
  if (!index || locale !== DEFAULT_LOCALE) return { index: false, follow: true };
  return { index: true, follow: true };
}

/**
 * Single canonical URL with no hreflang — for pages whose body is not translated.
 * ?lang= on these paths is 301'd to this URL in middleware. noindex here is only a
 * fallback if that query is still rendered; pairing it with a cross-page canonical
 * is what made Google reject the declared canonical.
 */
export function pageAlternatesSingle(path: string): Pick<Metadata, "alternates"> {
  return {
    alternates: {
      canonical: canonicalForLocale(path, DEFAULT_LOCALE),
    },
  };
}

/** Index only the default-locale URL when content is not translated per language. */
export function robotsForLocale(locale: Locale, index = true): NonNullable<Metadata["robots"]> {
  if (locale !== DEFAULT_LOCALE) return { index: false, follow: true };
  return { index, follow: true };
}

/** Auth, checkout, errors — never index; no canonical (avoids GSC noise). */
export function privatePageMeta({
  title,
  description,
}: {
  title: string;
  description?: string;
}): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: { index: false, follow: false },
  };
}

/** English-only indexable pages (blog, legal, pricing). */
export function englishOnlyPageMeta(
  path: string,
  locale: Locale,
  {
    title,
    description,
    socialTitle,
  }: {
    title: Metadata["title"];
    description: string;
    socialTitle: string;
  },
): Metadata {
  return {
    title,
    description,
    ...pageAlternatesSingle(path),
    robots: robotsForLocale(locale),
    ...socialMeta({
      title: socialTitle,
      description,
      url: path,
      locale: "en",
    }),
  };
}

/** Shared Open Graph + Twitter metadata for a page. */
export function socialMeta({
  title,
  description,
  url,
  locale = "en",
}: {
  title: string;
  description: string;
  url: string;
  locale?: Locale;
}): SocialMeta {
  const absoluteUrl = url.startsWith("http")
    ? url
    : hreflangUrl(url.startsWith("/") ? url : `/${url}`, locale);
  return {
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale] ?? site.locale,
      siteName: site.name,
      title,
      description,
      url: absoluteUrl,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: site.twitter,
      images: [OG_IMAGE.url],
    },
  };
}
