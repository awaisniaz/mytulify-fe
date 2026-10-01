import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolDirectoryFilter } from "@/components/ToolDirectoryFilter";
import { DisplayAd } from "@/components/ads/DisplayAd";
import { ALL_TOOLS, CATEGORIES, TOTAL_TOOLS, TOTAL_CATEGORIES } from "@/lib/catalog";
import { toolDirectoryHtml } from "@/lib/catalog/directory-html";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates, clampMetaDescription } from "@/lib/seo";
import { getLocale, getMetadataLocale } from "@/i18n/locale";
import { getContent, localizeTool } from "@/i18n/content";
import { categoryLabelFrom } from "@/i18n/messaging";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const content = await getContent(locale);
  const description = content.strings.toolsPageSub.replace("{cats}", String(TOTAL_CATEGORIES));
  const title = content.strings.toolsPageTitle.replace("{n}", String(TOTAL_TOOLS));
  return {
    title,
    description: clampMetaDescription(description),
    ...pageAlternates("/tools", locale),
    robots: { index: true, follow: true },
    ...socialMeta({ title: `${title} · ${site.name}`, description, url: "/tools", locale }),
  };
}

export default async function ToolsPage() {
  const locale = await getLocale();
  const content = await getContent(locale);
  const messages = await getMessages(locale);
  const s = content.strings;

  const categories = CATEGORIES.map((c) => ({
    slug: c.slug,
    name: categoryLabelFrom(messages, c.slug, c.name),
  }));
  const directory = toolDirectoryHtml(
    ALL_TOOLS.map((t) => {
      const label = localizeTool(content, t);
      return { tool: t, name: label.name, description: label.description, soonLabel: s.comingSoon };
    }),
    { categoryAttr: true },
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 border-b border-border pb-5 sm:mb-8 sm:pb-6">
        <h1 className="text-xl font-bold sm:text-3xl">{s.toolsPageTitle.replace("{n}", String(TOTAL_TOOLS))}</h1>
        <p className="mt-1 text-sm text-muted sm:text-base">{s.toolsPageSub.replace("{cats}", String(TOTAL_CATEGORIES))}</p>
      </div>
      <div className="mb-6 sm:mb-8">
        <DisplayAd />
      </div>
      <Suspense fallback={<div className="skeleton h-24 rounded-xl" />}>
        <ToolDirectoryFilter
          categories={categories}
          totalTools={TOTAL_TOOLS}
          searchPlaceholder={s.searchAllTools.replace("{n}", String(TOTAL_TOOLS))}
          allLabel={messages.nav.allTools}
          clearLabel={s.searchClear ?? "Clear"}
        />
      </Suspense>
      <div id="tool-directory" className="tool-grid mt-4" dangerouslySetInnerHTML={{ __html: directory }} />
    </div>
  );
}
