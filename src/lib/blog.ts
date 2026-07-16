import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import path from "path";
import { marked } from "marked";

export type BlogPostMeta = {
  title: string;
  slug: string;
  excerpt: string;
  publishedDate: string;
  updatedDate: string;
  featuredImage: string;
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
  return {
    title: String(data.title ?? fallbackSlug),
    slug: String(data.slug ?? fallbackSlug),
    excerpt: String(data.excerpt ?? ""),
    publishedDate: String(data.publishedDate ?? "2026-01-01"),
    updatedDate: String(data.updatedDate ?? data.publishedDate ?? "2026-01-01"),
    featuredImage: String(data.featuredImage ?? "/og-share.png"),
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
