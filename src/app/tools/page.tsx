import type { Metadata } from "next";
import { Suspense } from "react";
import { AllToolsBrowser } from "@/components/AllToolsBrowser";
import { ALL_TOOLS, CATEGORIES, TOTAL_TOOLS, TOTAL_CATEGORIES } from "@/lib/catalog";
import { site } from "@/lib/site";
import { socialMeta } from "@/lib/seo";
import { getLocale } from "@/i18n/locale";
import { getContent, localizeTool } from "@/i18n/content";
import { categoryLabelFrom } from "@/i18n/messaging";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = await getContent(locale);
  const description = content.strings.toolsPageSub.replace("{cats}", String(TOTAL_CATEGORIES));
  const title = content.strings.toolsPageTitle.replace("{n}", String(TOTAL_TOOLS));
  return {
    title,
    description,
    alternates: { canonical: "/tools" },
    robots: { index: true, follow: true },
    ...socialMeta({ title: `${title} · ${site.name}`, description, url: "/tools" }),
  };
}

export default async function ToolsPage() {
  const locale = await getLocale();
  const content = await getContent(locale);
  const messages = await getMessages(locale);
  const s = content.strings;

  const tools = ALL_TOOLS.map((t) => ({
    ...t,
    label: localizeTool(content, t),
  }));

  const categories = CATEGORIES.map((c) => ({
    slug: c.slug,
    name: categoryLabelFrom(messages, c.slug, c.name),
    icon: c.icon,
    gradient: c.gradient,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{s.toolsPageTitle.replace("{n}", String(TOTAL_TOOLS))}</h1>
        <p className="mt-1 text-muted">{s.toolsPageSub.replace("{cats}", String(TOTAL_CATEGORIES))}</p>
      </div>
      <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
        <AllToolsBrowser
          tools={tools}
          categories={categories}
          totalTools={TOTAL_TOOLS}
          searchPlaceholder={s.searchAllTools.replace("{n}", String(TOTAL_TOOLS))}
          allLabel={messages.nav.allTools}
          hotLabel={s.hot}
          clearLabel={s.searchClear ?? "Clear"}
          comingSoonLabel={s.comingSoon}
        />
      </Suspense>
    </div>
  );
}
