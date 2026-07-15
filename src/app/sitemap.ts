import type { MetadataRoute } from "next";
import { execFileSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { AVAILABLE_TOOLS, CATEGORIES, toolHref } from "@/lib/catalog";
import { site } from "@/lib/site";

const ROOT = process.cwd();

/** Prefer git last-commit date for a file; fall back to filesystem mtime. */
function lastmodForFiles(files: string[]): Date {
  const existing = files.map((f) => path.join(ROOT, f)).filter((f) => existsSync(f));
  if (!existing.length) return new Date(0);

  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cI", "--", ...existing.map((f) => path.relative(ROOT, f))],
      { encoding: "utf8", cwd: ROOT },
    ).trim();
    if (out) return new Date(out);
  } catch {
    /* git unavailable in some deploy environments */
  }

  let latest = 0;
  for (const f of existing) {
    try {
      latest = Math.max(latest, statSync(f).mtimeMs);
    } catch {
      /* ignore */
    }
  }
  return latest ? new Date(latest) : new Date(0);
}

const CATEGORY_FILE: Record<string, string> = {
  "ai-tools": "src/lib/catalog/categories/ai-tools.json",
  "handwriting-ocr": "src/lib/ai/tools.ts",
  "devops-tools": "src/lib/catalog/categories/devops-tools.json",
  "health-tools": "src/lib/catalog/categories/health-tools.json",
  "text-tools": "src/lib/catalog/categories/text-tools.json",
  "developer-tools": "src/lib/catalog/categories/developer-tools.json",
  "security-password-tools": "src/lib/catalog/categories/security-password-tools.json",
  "pdf-tools": "src/lib/catalog/categories/pdf-tools.json",
  "image-tools": "src/lib/catalog/categories/image-tools.json",
  "color-tools": "src/lib/catalog/categories/color-tools.json",
  calculators: "src/lib/catalog/categories/calculators.json",
  "unit-converters": "src/lib/catalog/categories/unit-converters.json",
  "seo-web-tools": "src/lib/catalog/categories/seo-web-tools.json",
  "social-media-tools": "src/lib/catalog/categories/social-media-tools.json",
  "converters-generators": "src/lib/catalog/categories/converters-generators.json",
};

const STATIC_PAGES: { path: string; file: string; priority: number }[] = [
  { path: "", file: "src/app/page.tsx", priority: 1 },
  { path: "/tools", file: "src/app/tools/page.tsx", priority: 0.8 },
  { path: "/pricing", file: "src/app/pricing/page.tsx", priority: 0.8 },
  { path: "/about", file: "src/app/about/page.tsx", priority: 0.8 },
  { path: "/privacy", file: "src/app/privacy/page.tsx", priority: 0.8 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = STATIC_PAGES.map((p) => ({
    url: `${site.url}${p.path}`,
    lastModified: lastmodForFiles([p.file]),
    changeFrequency: "weekly" as const,
    priority: p.priority,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${site.url}/${c.slug}`,
    lastModified: lastmodForFiles([
      CATEGORY_FILE[c.slug] ?? `src/lib/catalog/categories/${c.slug}.json`,
      "src/app/[category]/page.tsx",
    ]),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // AVAILABLE_TOOLS already excludes coming-soon placeholders.
  const toolPages = AVAILABLE_TOOLS.map((t) => ({
    url: `${site.url}${toolHref(t)}`,
    lastModified: lastmodForFiles([
      CATEGORY_FILE[t.category!] ?? `src/lib/catalog/categories/${t.category}.json`,
      "src/app/[category]/[tool]/page.tsx",
      "src/i18n/content/locales/en.json",
    ]),
    changeFrequency: "monthly" as const,
    priority: t.searchVolume === "high" ? 0.8 : 0.6,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
