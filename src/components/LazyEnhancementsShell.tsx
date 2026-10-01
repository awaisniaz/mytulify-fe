import { LazyEnhancements } from "@/components/LazyEnhancements";
import { TOTAL_TOOLS } from "@/lib/catalog";
import { getContent } from "@/i18n/content";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";

export async function LazyEnhancementsShell() {
  const locale = await getLocale();
  const content = await getContent(locale);
  const messages = await getMessages(locale);
  const s = content.strings;

  return (
    <LazyEnhancements
      locale={locale}
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
