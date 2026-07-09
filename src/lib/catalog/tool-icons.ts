/** Resolve a per-tool Lucide icon from slug + category fallback. */
import type { Tool } from "./types";
import { TOOL_ICON_MAP } from "./tool-icon-map.generated";

const CATEGORY_FALLBACK: Record<string, string> = {
  "ai-tools": "Sparkles",
  "handwriting-ocr": "ScanText",
  "devops-tools": "Server",
  "health-tools": "Activity",
  "text-tools": "Type",
  "developer-tools": "Code2",
  "security-password-tools": "ShieldCheck",
  "pdf-tools": "FileText",
  "image-tools": "Image",
  "color-tools": "Palette",
  "calculators": "Calculator",
  "unit-converters": "Ruler",
  "seo-web-tools": "Search",
  "social-media-tools": "Share2",
  "converters-generators": "Repeat",
};

export function getToolIcon(tool: Pick<Tool, "slug" | "category">): string {
  return TOOL_ICON_MAP[tool.slug] ?? CATEGORY_FALLBACK[tool.category ?? ""] ?? "Wrench";
}
