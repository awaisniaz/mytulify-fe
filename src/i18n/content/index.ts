import type { Tool } from "@/lib/catalog";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import {
  defaultHowTo,
  descClause,
  directAnswerLead,
  ensureDirectAbout,
} from "@/lib/aeo";
import { clampMetaDescription } from "@/lib/seo";
import type { Locale } from "../config";
import { DEFAULT_LOCALE } from "../config";
import type { ContentBundle, LocalizedCategory, LocalizedTool, ToolFaqItem, ToolHowTo } from "./types";
import enContent from "./locales/en.json";

const cache = new Map<Locale, ContentBundle>();
const fallback = enContent as ContentBundle;
cache.set("en", fallback);

export type { ContentBundle, LocalizedTool, LocalizedCategory, ToolFaqItem, ToolHowTo };

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
        directAnswerLead(name, base.description),
        "Upload a clear photo or scan, wait a few seconds, then copy or download the transcription. The Free plan includes limited daily AI runs; Pro unlocks unlimited OCR.",
      ];
    }
    if (!base.faq?.length) {
      base.faq = [
        {
          q: `What is ${name}?`,
          a: `${name} is a free AI OCR tool on Mytulify that turns a photo of handwriting into editable digital text. Upload a clear image, wait a few seconds, then copy or download the transcription for notes, forms, or archives.`,
        },
        {
          q: `Is ${name} free?`,
          a: `Yes. Free accounts get ${FREE_AI_DAILY_LIMIT} AI/OCR runs per day on Mytulify. Upgrade to Pro for unlimited handwriting OCR when you need higher daily volume.`,
        },
        {
          q: "What image quality works best?",
          a: "Use a well-lit, sharp photo with the writing filling most of the frame. Avoid heavy glare, blur, or extreme angles for the most accurate transcription from the OCR model.",
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

/** Visible FAQ for every tool page — mirrors FAQPage JSON-LD exactly. */
export function buildFaq(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
): ToolFaqItem[] {
  if (label.faq?.length) return label.faq;
  const s = content.strings;
  const name = label.name;
  const desc = label.description;
  const clause = descClause(desc);
  const vars = { name, desc, descClause: clause, limit: FREE_AI_DAILY_LIMIT };

  return [
    {
      q: fmt(s.faqWhatIsQ, vars),
      a: clientSide ? fmt(s.faqWhatIsAClient, vars) : fmt(s.faqWhatIsAAi, vars),
    },
    {
      q: fmt(s.faqIsFreeQ, vars),
      a: clientSide
        ? fmt(s.faqIsFreeAClient, vars)
        : fmt(s.faqIsFreeAAi, vars),
    },
    clientSide
      ? { q: fmt(s.faqSafeQ, vars), a: fmt(s.faqSafeA, vars) }
      : { q: fmt(s.faqDataQ, vars), a: fmt(s.faqDataA, vars) },
    {
      q: fmt(s.faqHowQ, vars),
      a: clientSide ? fmt(s.faqHowAClient, vars) : fmt(s.faqHowAAi, vars),
    },
  ];
}

/** Always returns HowTo steps for visible `<ol>` + HowTo JSON-LD. */
export function buildHowTo(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
): ToolHowTo {
  if (label.howTo?.steps?.length) {
    return {
      title: label.howTo.title || fmt(content.strings.howToTitle, { name: label.name }),
      steps: label.howTo.steps,
    };
  }
  const generated = defaultHowTo(label.name, clientSide);
  return {
    title: fmt(content.strings.howToTitle ?? generated.title, { name: label.name }),
    steps: generated.steps,
  };
}

export function toolAboutParagraphs(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
): string[] {
  if (label.about?.length) {
    return ensureDirectAbout(label.about, label.name, label.description, !clientSide);
  }
  const lead = directAnswerLead(label.name, label.description, !clientSide);
  const second = clientSide
    ? "It runs entirely in your browser on Mytulify — fast, private, and unlimited on the Free plan. No account or installation is required."
    : `The Free plan includes ${FREE_AI_DAILY_LIMIT} runs per day; Pro unlocks unlimited runs. Input is processed on our server — avoid pasting secrets and review output before use.`;
  const useCases = clientSide
    ? `Use the ${label.name} for everyday tasks, school or office work, and freelance projects when you need quick results without installing software. It works on phones, tablets, and shared computers — ideal when you are on the go or on restricted networks.`
    : `Use the ${label.name} for marketing copy, research drafts, brainstorming, and content repurposing. Freelancers, students, and small teams rely on it to save time while keeping a free daily quota; power users upgrade to Pro for unlimited AI runs.`;
  const benefits = `Key benefits: free to start, no download, copy-ready output, and a clean interface designed for repeat use. Explore related tools in the same category below to complete multi-step workflows without leaving Mytulify.`;
  return [lead, second, useCases, benefits];
}

export function toolMeta(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
  categoryName?: string,
) {
  const s = content.strings;
  const catLabel = categoryName ? `${categoryName} ` : "";
  const defaultTitle = `${label.name} – Free Online ${catLabel}Tool | Mytulify`;
  const rawDesc =
    label.metaDescription ??
    (clientSide
      ? fmt(s.toolMetaClient, { desc: label.description })
      : fmt(s.toolMetaAi, { desc: label.description, limit: FREE_AI_DAILY_LIMIT }));
  return {
    title: label.metaTitle ?? defaultTitle,
    absolute: true,
    description: clampMetaDescription(rawDesc),
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
