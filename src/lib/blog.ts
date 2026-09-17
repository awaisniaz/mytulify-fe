import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import path from "path";
import { marked } from "marked";

export type BlogCategory = {
  slug: string;
  name: string;
  description: string;
  icon: string;
};

export const BLOG_CATEGORIES: readonly BlogCategory[] = [
  {
    slug: "personal-finance",
    name: "Personal Finance",
    description: "SIP, EMI, PPF, FD, EPF, NPS, and other money calculators.",
    icon: "TrendingUp",
  },
  {
    slug: "comparisons",
    name: "Comparisons",
    description: "Side-by-side guides: SIP vs lumpsum, PPF vs FD, EPF vs NPS, and more.",
    icon: "GitCompare",
  },
  {
    slug: "seo",
    name: "SEO",
    description: "Campaign tracking, UTMs, and search-friendly workflows.",
    icon: "Search",
  },
  {
    slug: "photos-design",
    name: "Photos & Design",
    description: "Image workflows, duplicate photos, and social aspect ratios.",
    icon: "Image",
  },
  {
    slug: "career",
    name: "Career",
    description: "Cover letters, freelance emails, and job-search tools.",
    icon: "Briefcase",
  },
] as const;

export const BLOG_CATEGORY_SLUGS = BLOG_CATEGORIES.map((c) => c.slug);

export function getBlogCategory(slug: string | undefined): BlogCategory | undefined {
  if (!slug) return undefined;
  return BLOG_CATEGORIES.find((c) => c.slug === slug);
}

export function inferBlogCategory(slug: string): string {
  if (slug.includes("-vs-")) return "comparisons";
  if (slug.includes("utm")) return "seo";
  if (slug.includes("photo") || slug.includes("aspect-ratio")) return "photos-design";
  if (slug.includes("cover-letter") || slug.includes("freelance-email")) return "career";
  return "personal-finance";
}

export type BlogPostMeta = {
  title: string;
  slug: string;
  excerpt: string;
  publishedDate: string;
  updatedDate: string;
  featuredImage: string;
  category: string;
  relatedToolSlugs: string[];
  metaDescription: string;
  author: string;
};

export type BlogPost = BlogPostMeta & {
  body: string;
  html: string;
  readingMinutes: number;
  /** Absolute path used for sitemap lastmod (content file mtime / git). */
  fileRel: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, unknown> = {};
  let currentKey = "";
  let listMode = false;
  for (const line of match[1].split(/\r?\n/)) {
    if (listMode && /^\s+-\s+/.test(line)) {
      const arr = (data[currentKey] as string[]) ?? [];
      arr.push(line.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
      data[currentKey] = arr;
      continue;
    }
    listMode = false;
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    currentKey = kv[1];
    const val = kv[2].trim();
    if (val === "" || val === "|" || val === ">") {
      data[currentKey] = [];
      listMode = true;
      continue;
    }
    data[currentKey] = val.replace(/^["']|["']$/g, "");
  }
  return { data, body: match[2].trim() };
}

function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function toMeta(data: Record<string, unknown>, fallbackSlug: string): BlogPostMeta {
  const related = data.relatedToolSlugs;
  const slug = String(data.slug ?? fallbackSlug);
  const category = String(data.category ?? inferBlogCategory(slug));
  return {
    title: String(data.title ?? fallbackSlug),
    slug,
    excerpt: String(data.excerpt ?? ""),
    publishedDate: String(data.publishedDate ?? "2026-01-01"),
    updatedDate: String(data.updatedDate ?? data.publishedDate ?? "2026-01-01"),
    featuredImage: String(data.featuredImage ?? `/blog/covers/${slug}.svg`),
    category: getBlogCategory(category) ? category : inferBlogCategory(slug),
    relatedToolSlugs: Array.isArray(related) ? related.map(String) : [],
    metaDescription: String(data.metaDescription ?? data.excerpt ?? ""),
    author: String(data.author ?? "Mytulify Team"),
  };
}

function loadFile(fileRel: string): BlogPost | null {
  const abs = path.join(process.cwd(), fileRel);
  if (!existsSync(abs)) return null;
  const raw = readFileSync(abs, "utf8");
  const { data, body } = parseFrontmatter(raw);
  const slug = path.basename(fileRel, path.extname(fileRel));
  const meta = toMeta(data, slug);
  const html = marked.parse(body, { async: false }) as string;
  return {
    ...meta,
    body,
    html,
    readingMinutes: Math.max(1, Math.ceil(wordCount(body) / 200)),
    fileRel,
  };
}

/** All published posts, newest first. */
export function getAllPosts(): BlogPost[] {
  if (!existsSync(BLOG_DIR)) return [];
  const files = readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
    .map((f) => path.join("content", "blog", f));

  return files
    .map((f) => loadFile(f))
    .filter((p): p is BlogPost => p != null)
    .sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fileRel = path.join("content", "blog", `${slug}.md`);
  return loadFile(fileRel);
}

export function getPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((p) => p.category === category);
}

export function postFileMtime(fileRel: string): Date | null {
  try {
    return statSync(path.join(process.cwd(), fileRel)).mtime;
  } catch {
    return null;
  }
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
