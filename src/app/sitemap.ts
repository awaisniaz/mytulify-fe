import type { MetadataRoute } from "next";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { AVAILABLE_TOOLS, CATEGORIES, toolHref } from "@/lib/catalog";
import { site } from "@/lib/site";

const ROOT = process.cwd();

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

const CONTENT_FILE = "src/i18n/content/locales/en.json";

const STATIC_PAGES: { path: string; file: string; priority: number }[] = [
  { path: "", file: "src/app/page.tsx", priority: 1 },
  { path: "/tools", file: "src/app/tools/page.tsx", priority: 0.8 },
  { path: "/pricing", file: "src/app/pricing/page.tsx", priority: 0.8 },
  { path: "/about", file: "src/app/about/page.tsx", priority: 0.8 },
  { path: "/privacy", file: "src/app/privacy/page.tsx", priority: 0.8 },
];

function fileMtime(rel: string): Date | null {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return null;
  try {
    return statSync(abs).mtime;
  } catch {
    return null;
  }
}

function maxDate(...dates: (Date | null | undefined)[]): Date {
  let best = 0;
  for (const d of dates) {
    if (d && !Number.isNaN(d.getTime())) best = Math.max(best, d.getTime());
  }
  return best ? new Date(best) : new Date(0);
}

function git(args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }).trim();
  } catch {
    return "";
  }
}

function gitFileLastmod(rel: string): Date | null {
  const out = git(["log", "-1", "--format=%cI", "--", rel]);
  return out ? new Date(out) : null;
}

function hashToolRecord(tool: { name?: string; slug?: string; description?: string; searchVolume?: string; competition?: string; complexity?: string; clientSide?: boolean }): string {
  // Stable content fingerprint — ignores JSON key order / formatting noise.
  const payload = JSON.stringify({
    name: tool.name ?? "",
    slug: tool.slug ?? "",
    description: tool.description ?? "",
    searchVolume: tool.searchVolume ?? "",
    competition: tool.competition ?? "",
    complexity: tool.complexity ?? "",
    clientSide: tool.clientSide ?? true,
  });
  return createHash("sha1").update(payload).digest("hex");
}

function parseToolsFromCategoryJson(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const data = JSON.parse(raw) as { tools?: Array<Record<string, unknown>> };
    for (const t of data.tools ?? []) {
      const slug = String(t.slug ?? "");
      if (!slug) continue;
      map.set(slug, hashToolRecord(t as Parameters<typeof hashToolRecord>[0]));
    }
  } catch {
    /* ignore unreadable revisions */
  }
  return map;
}

/**
 * Walk category JSON history (oldest → newest). Update a slug's lastmod only when
 * that tool's content hash changes — bulk prettier/rewrite commits do not bump dates.
 */
function slugLastmodsFromContentHistory(categoryFile: string): Map<string, Date> {
  const lastmod = new Map<string, Date>();
  const prevHash = new Map<string, string>();
  if (!existsSync(path.join(ROOT, categoryFile))) return lastmod;

  const log = git(["log", "--pretty=format:%H %cI", "--reverse", "--", categoryFile]);
  if (!log) return lastmod;

  for (const line of log.split("\n")) {
    const space = line.indexOf(" ");
    if (space < 0) continue;
    const sha = line.slice(0, space);
    const date = new Date(line.slice(space + 1));
    const raw = git(["show", `${sha}:${categoryFile}`]);
    if (!raw) continue;
    const hashes = parseToolsFromCategoryJson(raw);
    for (const [slug, hash] of hashes) {
      if (prevHash.get(slug) !== hash) {
        prevHash.set(slug, hash);
        lastmod.set(slug, date);
      }
    }
  }

  // Current working tree (includes uncommitted catalog edits)
  try {
    const current = parseToolsFromCategoryJson(readFileSync(path.join(ROOT, categoryFile), "utf8"));
    const now = fileMtime(categoryFile) ?? new Date();
    for (const [slug, hash] of current) {
      if (prevHash.get(slug) !== hash) lastmod.set(slug, now);
    }
  } catch {
    /* ignore */
  }

  return lastmod;
}

function hashContentBlock(block: unknown): string {
  return createHash("sha1").update(JSON.stringify(block ?? null)).digest("hex");
}

/**
 * Per-tool i18n content lastmod from en.json history (name/description/SEO fields).
 */
function contentKeyLastmods(contentFile: string): Map<string, Date> {
  const lastmod = new Map<string, Date>();
  const prevHash = new Map<string, string>();
  if (!existsSync(path.join(ROOT, contentFile))) return lastmod;

  const log = git(["log", "--pretty=format:%H %cI", "--reverse", "--", contentFile]);
  for (const line of log.split("\n")) {
    const space = line.indexOf(" ");
    if (space < 0) continue;
    const sha = line.slice(0, space);
    const date = new Date(line.slice(space + 1));
    const raw = git(["show", `${sha}:${contentFile}`]);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw) as { tools?: Record<string, unknown> };
      for (const [key, block] of Object.entries(data.tools ?? {})) {
        const hash = hashContentBlock(block);
        if (prevHash.get(key) !== hash) {
          prevHash.set(key, hash);
          lastmod.set(key, date);
        }
      }
    } catch {
      /* ignore bad revisions */
    }
  }

  try {
    const data = JSON.parse(readFileSync(path.join(ROOT, contentFile), "utf8")) as {
      tools?: Record<string, unknown>;
    };
    const now = fileMtime(contentFile) ?? new Date();
    for (const [key, block] of Object.entries(data.tools ?? {})) {
      const hash = hashContentBlock(block);
      if (prevHash.get(key) !== hash) lastmod.set(key, now);
    }
  } catch {
    /* ignore */
  }

  return lastmod;
}

/** OCR tools live in TS — use file lastmod (shared) as best available signal. */
function handwritingFallback(): Date {
  return maxDate(gitFileLastmod("src/lib/ai/tools.ts"), fileMtime("src/lib/ai/tools.ts"));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const contentDates = contentKeyLastmods(CONTENT_FILE);
  const slugDatesByFile = new Map<string, Map<string, Date>>();

  for (const file of new Set(Object.values(CATEGORY_FILE))) {
    if (file.endsWith(".json")) {
      slugDatesByFile.set(file, slugLastmodsFromContentHistory(file));
    }
  }

  const staticPages = STATIC_PAGES.map((p) => ({
    url: `${site.url}${p.path}`,
    lastModified: maxDate(gitFileLastmod(p.file), fileMtime(p.file)),
    changeFrequency: "weekly" as const,
    priority: p.priority,
  }));

  const categoryPages = CATEGORIES.map((c) => {
    const file = CATEGORY_FILE[c.slug] ?? `src/lib/catalog/categories/${c.slug}.json`;
    return {
      url: `${site.url}/${c.slug}`,
      lastModified: maxDate(gitFileLastmod(file), fileMtime(file)),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    };
  });

  const ocrDate = handwritingFallback();

  const toolPages = AVAILABLE_TOOLS.map((t) => {
    const file = CATEGORY_FILE[t.category!] ?? `src/lib/catalog/categories/${t.category}.json`;
    const key = `${t.category}/${t.slug}`;
    const slugDate =
      t.category === "handwriting-ocr"
        ? ocrDate
        : (slugDatesByFile.get(file)?.get(t.slug) ?? null);
    const contentDate = contentDates.get(key) ?? null;

    return {
      url: `${site.url}${toolHref(t)}`,
      lastModified: maxDate(
        slugDate,
        contentDate,
        // Only if history missing (shallow clone / new tool) use category file mtime
        slugDate || contentDate ? null : gitFileLastmod(file),
        slugDate || contentDate ? null : fileMtime(file),
      ),
      changeFrequency: "monthly" as const,
      priority: t.searchVolume === "high" ? 0.8 : 0.6,
    };
  });

  return [...staticPages, ...categoryPages, ...toolPages];
}
