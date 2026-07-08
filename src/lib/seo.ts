import type { Metadata } from "next";
import { site } from "@/lib/site";

type SocialMeta = Pick<Metadata, "openGraph" | "twitter">;

/** Shared Open Graph + Twitter metadata for a page. OG images come from file-based routes. */
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: site.twitter,
    },
  };
}
