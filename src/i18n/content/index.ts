import type { Tool } from "@/lib/catalog";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import type { Locale } from "../config";
import { DEFAULT_LOCALE } from "../config";
import type { ContentBundle, LocalizedCategory, LocalizedTool, ToolFaqItem } from "./types";
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
  const key = toolContentKey(tool);
  const hit = content.tools[key];
  const en = fallback.tools[key];
  const base: LocalizedTool = {
    name: hit?.name ?? tool.name,
    description: hit?.description ?? tool.description,
    metaTitle: hit?.metaTitle ?? en?.metaTitle,
    metaDescription: hit?.metaDescription ?? en?.metaDescription,
    about: hit?.about ?? en?.about,
    howTo: hit?.howTo ?? en?.howTo,
    faq: hit?.faq ?? en?.faq,
    related: hit?.related ?? en?.related,
  };

  // Unique SERP copy for OCR language pages when no hand-written SEO override exists.
  if (tool.category === "handwriting-ocr" && !base.metaTitle) {
    const name = base.name;
    base.metaTitle = `${name} – Free Online OCR | Mytulify`;
    base.metaDescription =
      base.metaDescription ??
      `${base.description} Upload a photo and get editable text in seconds. Free AI OCR on Mytulify — ${FREE_AI_DAILY_LIMIT} runs/day, no signup.`;
    if (!base.about?.length) {
      base.about = [
        `${name} uses AI vision to turn a photo of handwriting into editable digital text. ${base.description}`,
        "Upload a clear photo or scan, wait a few seconds, then copy or download the transcription. The Free plan includes limited daily AI runs; Pro unlocks unlimited OCR.",
      ];
    }
    if (!base.faq?.length) {
      base.faq = [
        {
          q: `Is ${name} free?`,
          a: `Yes. Free accounts get ${FREE_AI_DAILY_LIMIT} AI/OCR runs per day on Mytulify. Upgrade to Pro for unlimited handwriting OCR.`,
        },
        {
          q: "What image quality works best?",
          a: "Use a well-lit, sharp photo with the writing filling most of the frame. Avoid heavy glare or blur for the most accurate transcription.",
        },
        {
          q: "Is my handwriting photo stored?",
          a: "Images are processed to generate your result and are not kept as a long-term archive. Avoid uploading sensitive documents you would not send to any online service.",
        },
      ];
    }
  }

  return base;
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

export function buildFaq(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
): ToolFaqItem[] {
  if (label.faq?.length) return label.faq;
  const s = content.strings;
  const name = label.name;
  const desc = label.description;
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

export function toolAboutParagraphs(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
): string[] {
  if (label.about?.length) return label.about;
  const s = content.strings;
  const text = clientSide
    ? fmt(s.toolAboutClient, { name: label.name, desc: label.description, limit: FREE_AI_DAILY_LIMIT })
    : fmt(s.toolAboutAi, { name: label.name, desc: label.description, limit: FREE_AI_DAILY_LIMIT });
  return [text];
}

/** @deprecated Prefer toolAboutParagraphs — kept for any external callers. */
export function toolAboutText(content: ContentBundle, name: string, desc: string, clientSide: boolean) {
  const s = content.strings;
  return clientSide
    ? fmt(s.toolAboutClient, { name, desc, limit: FREE_AI_DAILY_LIMIT })
    : fmt(s.toolAboutAi, { name, desc, limit: FREE_AI_DAILY_LIMIT });
}

export function toolMeta(content: ContentBundle, label: LocalizedTool, clientSide: boolean) {
  const s = content.strings;
  return {
    title: label.metaTitle ?? `${label.name} — Free Online Tool | Mytulify`,
    absolute: true,
    description: label.metaDescription
      ?? (clientSide
        ? fmt(s.toolMetaClient, { desc: label.description })
        : fmt(s.toolMetaAi, { desc: label.description, limit: FREE_AI_DAILY_LIMIT })),
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
