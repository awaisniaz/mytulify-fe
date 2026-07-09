/** Tools with routes but not yet interactive. */
export const COMING_SOON_KEYS = new Set<string>([]);

export function toolKey(category: string, slug: string): string {
  return `${category}/${slug}`;
}

/** Server-side / AI-dependent tools are visible but not usable yet. */
export function isToolAvailable(tool: { category?: string; slug: string; clientSide?: boolean }): boolean {
  if (!tool.category) return true;
  if (COMING_SOON_KEYS.has(toolKey(tool.category, tool.slug))) return false;
  if (tool.clientSide === false) return false;
  return true;
}
