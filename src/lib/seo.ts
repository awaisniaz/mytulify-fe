import type { Metadata } from "next";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import type { Locale } from "@/i18n/config";
import { canonicalForLocale, hreflangAlternates, OG_LOCALE } from "@/lib/seo/hreflang";

type SocialMeta = Pick<Metadata, "openGraph" | "twitter">;

/** Site-wide share preview (1200×630). */
export const OG_IMAGE = {
  url: "/og-share.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${messaging.ogToolsLabel}`,
} as const;

/** Clamp meta description to ~155 chars for SERP. */
export function clampMetaDescription(text: string, max = 155): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

/** Canonical + hreflang alternates for indexable pages. */
export function pageAlternates(path: string, locale: Locale = "en"): Pick<Metadata, "alternates"> {
  return {
    alternates: {
      canonical: canonicalForLocale(path, locale),
      languages: hreflangAlternates(path),
    },
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
  const absoluteUrl = url.startsWith("http") ? url : `${site.url}${url}`;
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
