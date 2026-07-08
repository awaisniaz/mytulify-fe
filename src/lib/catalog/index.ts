import type { Category, CategoryData, CategoryMeta, Tool } from "./types";
import { ocrCatalogTools } from "../ai/tools";
import { isToolAvailable } from "./availability";

export { isToolAvailable, COMING_SOON_KEYS } from "./availability";

import textTools from "./categories/text-tools.json";
import aiTools from "./categories/ai-tools.json";
import devopsTools from "./categories/devops-tools.json";
import healthTools from "./categories/health-tools.json";
import developerTools from "./categories/developer-tools.json";
import securityTools from "./categories/security-password-tools.json";
import pdfTools from "./categories/pdf-tools.json";
import imageTools from "./categories/image-tools.json";
import colorTools from "./categories/color-tools.json";
import calculators from "./categories/calculators.json";
import unitConverters from "./categories/unit-converters.json";
import seoTools from "./categories/seo-web-tools.json";
import socialTools from "./categories/social-media-tools.json";
import convertersGenerators from "./categories/converters-generators.json";

export type { Category, Tool, Level, Complexity } from "./types";

/** Per-category presentation metadata (icon + gradient + tagline). */
const META: Record<string, CategoryMeta> = {
  "ai-tools": { icon: "Sparkles", gradient: "from-indigo-500 to-fuchsia-600", tagline: "AI assistants for developers" },
  "handwriting-ocr": { icon: "ScanText", gradient: "from-violet-500 to-indigo-600", tagline: "Handwriting to text in 30+ languages" },
  "devops-tools": { icon: "Server", gradient: "from-cyan-500 to-sky-600", tagline: "Configs, manifests & scripts" },
  "health-tools": { icon: "Activity", gradient: "from-rose-500 to-pink-600", tagline: "Fitness, nutrition & wellbeing" },
  "text-tools": { icon: "Type", gradient: "from-sky-500 to-blue-600", tagline: "Write, clean & transform text" },
  "developer-tools": { icon: "Code2", gradient: "from-violet-500 to-purple-600", tagline: "Format, convert & debug code" },
  "security-password-tools": { icon: "ShieldCheck", gradient: "from-rose-500 to-red-600", tagline: "Passwords, hashing & crypto" },
  "pdf-tools": { icon: "FileText", gradient: "from-orange-500 to-amber-600", tagline: "Merge, split & convert PDFs" },
  "image-tools": { icon: "Image", gradient: "from-emerald-500 to-green-600", tagline: "Resize, compress & convert images" },
  "color-tools": { icon: "Palette", gradient: "from-fuchsia-500 to-pink-600", tagline: "Pick, convert & build palettes" },
  "calculators": { icon: "Calculator", gradient: "from-teal-500 to-cyan-600", tagline: "Finance, health & math"},
  "unit-converters": { icon: "Ruler", gradient: "from-indigo-500 to-blue-600", tagline: "Convert any unit instantly" },
  "seo-web-tools": { icon: "Search", gradient: "from-lime-500 to-green-600", tagline: "On-page & technical SEO" },
  "social-media-tools": { icon: "Share2", gradient: "from-pink-500 to-rose-600", tagline: "Captions, fonts & mockups" },
  "converters-generators": { icon: "Repeat", gradient: "from-amber-500 to-orange-600", tagline: "Data converters & generators" },
};

const handwritingOcr: CategoryData = {
  name: "Handwriting OCR",
  slug: "handwriting-ocr",
  description:
    "AI-powered handwriting-to-text (OCR) tools for 30+ languages. Upload a photo of handwriting and get accurate, editable digital text in seconds.",
  tools: ocrCatalogTools(),
};

const RAW: CategoryData[] = [
  aiTools,
  handwritingOcr,
  devopsTools,
  healthTools,
  textTools,
  developerTools,
  securityTools,
  pdfTools,
  imageTools,
  colorTools,
  calculators,
  unitConverters,
  seoTools,
  socialTools,
  convertersGenerators,
] as CategoryData[];

/** Fully-resolved categories with metadata and category-stamped tools. */
export const CATEGORIES: Category[] = RAW.map((c) => ({
  ...c,
  ...(META[c.slug] ?? { icon: "Wrench", gradient: "from-slate-500 to-slate-700", tagline: c.description }),
  tools: c.tools.map((t) => ({ ...t, category: c.slug })),
}));

/** Flat list of every tool, each stamped with its category slug. */
export const ALL_TOOLS: Tool[] = CATEGORIES.flatMap((c) => c.tools);

/** Tools that are fully interactive (excludes coming-soon placeholders). */
export const AVAILABLE_TOOLS: Tool[] = ALL_TOOLS.filter(isToolAvailable);

export const TOTAL_TOOLS = ALL_TOOLS.length;
export const TOTAL_AVAILABLE_TOOLS = AVAILABLE_TOOLS.length;
export const TOTAL_CATEGORIES = CATEGORIES.length;
export const TOTAL_SERVER_SIDE_TOOLS = ALL_TOOLS.filter((t) => !t.clientSide).length;

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getTool(categorySlug: string, toolSlug: string): Tool | undefined {
  return getCategory(categorySlug)?.tools.find((t) => t.slug === toolSlug);
}

/** Score used to surface the most valuable tools (high volume, low competition). */
function score(t: Tool): number {
  const vol = { high: 3, medium: 2, low: 1 }[t.searchVolume];
  const comp = { low: 3, medium: 2, high: 1 }[t.competition];
  return vol * 2 + comp;
}

export function featuredTools(limit = 12): Tool[] {
  return [...AVAILABLE_TOOLS].sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export function trendingTools(limit = 8): Tool[] {
  return AVAILABLE_TOOLS.filter((t) => t.searchVolume === "high").slice(0, limit);
}

export function relatedTools(tool: Tool, limit = 6): Tool[] {
  const cat = getCategory(tool.category ?? "");
  if (!cat) return [];
  const others = cat.tools.filter((t) => t.slug !== tool.slug);
  const available = others.filter(isToolAvailable);
  const pool = available.length >= limit ? available : others;
  return pool.slice(0, limit);
}

export function searchTools(query: string, limit = 20): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.slug.replace(/-/g, " ").includes(q) ||
      t.description.toLowerCase().includes(q),
  ).slice(0, limit);
}

export function toolHref(tool: Tool): string {
  return `/${tool.category}/${tool.slug}`;
}
