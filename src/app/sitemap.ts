import type { MetadataRoute } from "next";
import { AVAILABLE_TOOLS, CATEGORIES, toolHref } from "@/lib/catalog";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "/tools", "/pricing", "/about", "/privacy"].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const categoryPages = CATEGORIES.map((c) => ({
    url: `${site.url}/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));
  const toolPages = AVAILABLE_TOOLS.map((t) => ({
    url: `${site.url}${toolHref(t)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: t.searchVolume === "high" ? 0.8 : 0.6,
  }));
  return [...staticPages, ...categoryPages, ...toolPages];
}
