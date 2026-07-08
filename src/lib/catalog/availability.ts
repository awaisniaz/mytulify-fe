/** Tools with routes but not yet interactive — excluded from sitemap and noindexed. */
export const COMING_SOON_KEYS = new Set<string>([]);

export function toolKey(category: string, slug: string): string {
  return `${category}/${slug}`;
}

export function isToolAvailable(tool: { category?: string; slug: string }): boolean {
  if (!tool.category) return true;
  return !COMING_SOON_KEYS.has(toolKey(tool.category, tool.slug));
}
