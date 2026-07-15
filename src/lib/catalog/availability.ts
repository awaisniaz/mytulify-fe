/** Tools with routes but not yet interactive. */
export const COMING_SOON_KEYS = new Set<string>([]);

export function toolKey(category: string, slug: string): string {
  return `${category}/${slug}`;
}

/**
 * Server-side tools that are live (others stay coming soon).
 * AI / OCR categories are always live when configured — see isToolAvailable.
 * Add non-AI server tools here (e.g. paid converters) when ready.
 */
export const LIVE_SERVER_TOOLS = new Set<string>([
  "seo-web-tools/domain-name-finder",
]);

function isAiCategory(category: string): boolean {
  return category === "ai-tools" || category === "handwriting-ocr";
}

export function isToolAvailable(tool: { category?: string; slug: string; clientSide?: boolean }): boolean {
  if (!tool.category) return true;
  const key = toolKey(tool.category, tool.slug);
  if (COMING_SOON_KEYS.has(key)) return false;
  if (tool.clientSide === false) {
    if (isAiCategory(tool.category)) return true;
    return LIVE_SERVER_TOOLS.has(key);
  }
  return true;
}
