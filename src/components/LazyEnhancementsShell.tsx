import { LazyEnhancements } from "@/components/LazyEnhancements";
import { ALL_TOOLS, CATEGORIES, TOTAL_TOOLS } from "@/lib/catalog";
import { getContent, localizeCategory, localizeTool } from "@/i18n/content";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";

export async function LazyEnhancementsShell() {
  const locale = await getLocale();
  const content = await getContent(locale);
  const messages = await getMessages(locale);
  const s = content.strings;

  const searchTools = ALL_TOOLS.map((t) => {
    const label = localizeTool(content, t);
    const cat = CATEGORIES.find((c) => c.slug === t.category)!;
    const catLabel = localizeCategory(content, cat.slug, {
      name: cat.name,
      description: cat.description,
      tagline: cat.tagline,
    });
    return { ...t, name: label.name, description: label.description, categoryName: catLabel.name };
  });

  return (
    <LazyEnhancements
      searchTools={searchTools}
      searchStrings={{
        placeholder: s.searchAllTools.replace("{n}", String(TOTAL_TOOLS)),
        ariaLabel: messages.nav.search,
        trendingHint: s.searchTrendingHint ?? "Trending tools — use ↑↓ and Enter",
        noResults: s.searchNoResults ?? 'No tools found for "{q}"',
        resultsOne: s.searchResultsOne ?? "1 result",
        resultsMany: s.searchResultsMany ?? "{n} results",
        clear: s.searchClear ?? "Clear search",
        comingSoon: s.comingSoon ?? "Coming soon",
      }}
    />
  );
}
