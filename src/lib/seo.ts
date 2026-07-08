import type { Metadata } from "next";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";

type SocialMeta = Pick<Metadata, "openGraph" | "twitter">;

/** Site-wide share preview (1200×630). */
export const OG_IMAGE = {
  url: "/og-share.png",
  width: 1200,
  height: 630,
  alt: `${site.name} — ${messaging.ogToolsLabel}`,
} as const;

/** Shared Open Graph + Twitter metadata for a page. */
export function socialMeta({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}): SocialMeta {
  const absoluteUrl = url.startsWith("http") ? url : `${site.url}${url}`;
  return {
    openGraph: {
      type: "website",
      locale: site.locale,
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
