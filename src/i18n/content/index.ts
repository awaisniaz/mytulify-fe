import type { Tool } from "@/lib/catalog";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import type { Locale } from "../config";
import { DEFAULT_LOCALE } from "../config";
import type { ContentBundle, LocalizedCategory, LocalizedTool } from "./types";
import enContent from "./locales/en.json";

const cache = new Map<Locale, ContentBundle>();
const fallback = enContent as ContentBundle;
cache.set("en", fallback);

export type { ContentBundle, LocalizedTool, LocalizedCategory };

export function toolContentKey(tool: Pick<Tool, "category" | "slug">) {
  return `${tool.category}/${tool.slug}`;
}

export async function getContent(locale: Locale): Promise<ContentBundle> {
  if (cache.has(locale)) return cache.get(locale)!;
  try {
    const mod = await import(`./locales/${locale}.json`);
    const bundle = mod.default as ContentBundle;
    cache.set(locale, bundle);
    return bundle;
  } catch {
    return fallback;
  }
}

export function localizeTool(content: ContentBundle, tool: Tool): LocalizedTool {
  const hit = content.tools[toolContentKey(tool)];
  return { name: hit?.name ?? tool.name, description: hit?.description ?? tool.description };
}

export function localizeCategory(content: ContentBundle, slug: string, en: LocalizedCategory): LocalizedCategory {
  const hit = content.categories[slug];
  return {
    name: hit?.name ?? en.name,
    description: hit?.description ?? en.description,
    tagline: hit?.tagline ?? en.tagline,
  };
}

function fmt(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

export function buildFaq(content: ContentBundle, name: string, desc: string, clientSide: boolean) {
  const s = content.strings;
  return [
    {
      q: fmt(s.faqIsFreeQ, { name }),
      a: clientSide
        ? fmt(s.faqIsFreeAClient, { name })
        : fmt(s.faqIsFreeAAi, { name, limit: FREE_AI_DAILY_LIMIT }),
    },
    clientSide
      ? { q: fmt(s.faqSafeQ, { name }), a: fmt(s.faqSafeA, { name }) }
      : { q: fmt(s.faqDataQ, { name }), a: fmt(s.faqDataA, { name }) },
    {
      q: fmt(s.faqHowQ, { name }),
      a: clientSide ? fmt(s.faqHowAClient, { desc }) : fmt(s.faqHowAAi, { desc }),
    },
  ];
}

export function toolAboutText(content: ContentBundle, name: string, desc: string, clientSide: boolean) {
  const s = content.strings;
  return clientSide
    ? fmt(s.toolAboutClient, { name, desc, limit: FREE_AI_DAILY_LIMIT })
    : fmt(s.toolAboutAi, { name, desc, limit: FREE_AI_DAILY_LIMIT });
}

export function toolMeta(content: ContentBundle, name: string, desc: string, clientSide: boolean) {
  const s = content.strings;
  return {
    title: fmt(s.toolMetaTitle, { name }),
    description: clientSide
      ? fmt(s.toolMetaClient, { desc })
      : fmt(s.toolMetaAi, { desc, limit: FREE_AI_DAILY_LIMIT }),
  };
}

export function categoryMeta(content: ContentBundle, name: string, desc: string, count: number) {
  const s = content.strings;
  return {
    title: fmt(s.categoryTitle, { name, count }),
    description: fmt(s.categoryDescription, { desc, count }),
  };
}

export async function preloadContent(locale: Locale) {
  if (locale === DEFAULT_LOCALE) return fallback;
  return getContent(locale);
}
