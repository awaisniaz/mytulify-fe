import type { Tool } from "@/lib/catalog";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import {
  defaultHowTo,
  descClause,
  directAnswerLead,
  ensureDirectAbout,
} from "@/lib/aeo";
import { clampMetaDescription, clampTitle } from "@/lib/seo";
import {
  ocrScriptNote,
  toolGuideKind,
  type ToolGuideKind,
} from "@/lib/seo/tool-guide-kind";
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
    sections: hit?.sections ?? en?.sections,
    howTo: hit?.howTo ?? en?.howTo,
    faq: hit?.faq ?? en?.faq,
    related: hit?.related ?? en?.related,
  };

  // Unique SERP + FAQ for OCR language pages when no hand-written SEO override exists.
  // Do NOT inject a thin `about` array here — that blocked semanticSections and clipped leads
  // mid-sentence ("…translation into."). Semantic + howToProse own the on-page body.
  if (tool.category === "handwriting-ocr" && !base.metaTitle) {
    const name = base.name;
    const note = ocrScriptNote(tool.slug);
    base.metaTitle = `${name} – Free Online OCR | Mytulify`;
    base.metaDescription =
      base.metaDescription ??
      `${base.description} Upload a photo and get editable text in seconds. Free AI OCR on Mytulify — ${FREE_AI_DAILY_LIMIT} runs/day, no signup.`;
    if (!base.faq?.length) {
      const scriptFaq = note
        ? ` It targets ${note.language} handwriting in the ${note.script}. ${note.tip}`
        : "";
      const qualityFaq = note
        ? `Use even light, a flat page, and a tight crop so ${note.language} characters stay sharp. ${note.tip} Avoid heavy glare, blur, and extreme angles.`
        : "Use a well-lit, sharp photo with the writing filling most of the frame. Avoid heavy glare, blur, or extreme angles for the most accurate transcription from the OCR model.";
      base.faq = [
        {
          q: `What is ${name}?`,
          a: `${name} is a free handwriting OCR tool on Mytulify that turns a photo of handwriting into editable digital text.${scriptFaq} Upload a clear image, wait a few seconds, then copy or download the transcription for notes, forms, or archives.`,
        },
        {
          q: `Is ${name} free?`,
          a: `Yes. Free accounts get ${FREE_AI_DAILY_LIMIT} AI/OCR runs per day on Mytulify. Upgrade to Pro for unlimited handwriting OCR when you need higher daily volume.`,
        },
        {
          q: "What image quality works best?",
          a: qualityFaq,
        },
        {
          q: "Can I translate the extracted text?",
          a: "Yes. After OCR, choose a language under Translate to. You will see the original transcription and a translation side by side. Pick Original only if you just want the source text.",
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

function resolveKind(
  clientSideOrKind: boolean | ToolGuideKind,
  opts?: { categorySlug?: string; slug?: string },
): ToolGuideKind {
  if (typeof clientSideOrKind !== "boolean") return clientSideOrKind;
  return toolGuideKind({
    clientSide: clientSideOrKind,
    categorySlug: opts?.categorySlug,
    slug: opts?.slug,
  });
}

/** Visible FAQ for every tool page — mirrors FAQPage JSON-LD exactly. */
export function buildFaq(
  content: ContentBundle,
  label: LocalizedTool,
  clientSideOrKind: boolean | ToolGuideKind,
  opts?: { categorySlug?: string; slug?: string },
): ToolFaqItem[] {
  if (label.faq?.length) return label.faq;
  const kind = resolveKind(clientSideOrKind, opts);
  const s = content.strings;
  const name = label.name;
  const desc = label.description;
  const clause = descClause(desc);
  const vars = { name, desc, descClause: clause, limit: FREE_AI_DAILY_LIMIT };

  if (kind === "ocr") {
    const note = opts?.slug ? ocrScriptNote(opts.slug) : null;
    const scriptBit = note
      ? ` It is aimed at ${note.language} handwriting (${note.script}).`
      : "";
    return [
      {
        q: fmt(s.faqWhatIsQ, vars),
        a: `${name} is a free handwriting OCR tool on Mytulify that can ${clause}.${scriptBit} Upload a photo, run OCR, then copy or optionally translate the text. The Free plan includes ${FREE_AI_DAILY_LIMIT} runs per day.`,
      },
      {
        q: fmt(s.faqIsFreeQ, vars),
        a: fmt(s.faqIsFreeAAi, vars),
      },
      {
        q: "What happens to my photo?",
        a: `The ${name} sends the image you upload to Mytulify’s server so a vision model can read the handwriting. We use it to complete that request — do not upload ID cards, bank documents, or other sensitive pages. Always compare the text with the photo before you rely on it.`,
      },
      {
        q: fmt(s.faqHowQ, vars),
        a: note
          ? `Open the ${name}, upload a clear photo of ${note.language} handwriting, run OCR, then check the text against the image. ${note.tip}`
          : `Open the ${name}, upload a clear photo of the page, run OCR, then check the text against the image before you copy or translate it.`,
      },
    ];
  }

  const clientSide = kind === "browser";
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
  clientSideOrKind: boolean | ToolGuideKind,
  opts?: { categorySlug?: string; slug?: string },
): ToolHowTo {
  if (label.howTo?.steps?.length) {
    return {
      title: label.howTo.title || fmt(content.strings.howToTitle, { name: label.name }),
      steps: label.howTo.steps,
    };
  }
  const kind = resolveKind(clientSideOrKind, opts);
  const generated = defaultHowTo(label.name, kind, opts?.slug);
  return {
    title: fmt(content.strings.howToTitle ?? generated.title, { name: label.name }),
    steps: generated.steps,
  };
}

export function toolAboutParagraphs(
  content: ContentBundle,
  label: LocalizedTool,
  clientSideOrKind: boolean | ToolGuideKind,
  opts?: { categorySlug?: string; slug?: string },
): string[] {
  const kind = resolveKind(clientSideOrKind, opts);
  const poweredByAi = kind !== "browser";
  if (label.about?.length) {
    return ensureDirectAbout(label.about, label.name, label.description, poweredByAi);
  }
  const lead = directAnswerLead(label.name, label.description, poweredByAi);
  if (kind === "ocr") {
    const note = opts?.slug ? ocrScriptNote(opts.slug) : null;
    const second = `The Free plan includes ${FREE_AI_DAILY_LIMIT} OCR runs per day; Pro unlocks unlimited runs. Your photo is sent to our server so a vision model can read it — avoid ID documents and other sensitive pages, and compare every line with the image.`;
    const useCases = note
      ? `Use the ${label.name} when you need editable ${note.language} text from paper notes, worksheets, or a phone photo. ${note.tip}`
      : `Use the ${label.name} when the words exist on paper or in a photo and you need them as text you can edit, search, or translate.`;
    const benefits = `Key habits for better OCR: even light, a flat page, a tight crop around the writing, and enough resolution that thin strokes stay visible. Explore related handwriting tools below when you need math, tables, Markdown, or a summary next.`;
    const detail = `${label.name} is built around one job: ${label.description} The upload form on this page is the whole product.`;
    const reading = `Gaps in the text usually mean blur, glare, or a crop that cut marks off the page — fix the photo and run again rather than guessing missing words.`;
    return [lead, second, useCases, benefits, detail, reading];
  }
  const clientSide = kind === "browser";
  const second = clientSide
    ? "It runs entirely in your browser on Mytulify — fast, private, and unlimited on the Free plan. No account or installation is required."
    : `The Free plan includes ${FREE_AI_DAILY_LIMIT} runs per day; Pro unlocks unlimited runs. Input is processed on our server (which may call a third-party AI model) — avoid pasting secrets and review output before use.`;
  const useCases = clientSide
    ? `Use the ${label.name} for everyday tasks, school or office work, and freelance projects when you need quick results without installing software. It works on phones, tablets, and shared computers — ideal when you are on the go or on restricted networks.`
    : `Use the ${label.name} for drafting, rewriting, and structured AI assistance when you already have source material. Freelancers, students, and small teams rely on it to save setup time while keeping a free daily quota; power users upgrade to Pro for unlimited AI runs.`;
  const benefits = `Key benefits: free to start, no download, copy-ready output, and a clean interface designed for repeat use. Explore related tools in the same category below to complete multi-step workflows without leaving Mytulify.`;
  const detail = `${label.name} is built around one job: ${label.description} The form on this page is the whole product. Change a value and the result updates from that input, so you can compare a second scenario without starting over. Read the field labels before you trust a number. Units, percentages, dates, and file types are easy to mix up, and the description above is the scope of this tool.`;
  const reading = `If your case needs a rule this page does not mention, treat the output as a starting estimate and check it against the source that actually applies to you. You can copy the result, keep the page open, and come back on a phone or a laptop. Nothing here asks you to install an app. Related tools in the same category sit under the questions when the next step is a different calculation or a different file.`;
  return [lead, second, useCases, benefits, detail, reading];
}

export function toolMeta(
  content: ContentBundle,
  label: LocalizedTool,
  clientSide: boolean,
) {
  const s = content.strings;
  const shortTitle = `${label.name} | Mytulify`;
  const rawTitle = label.metaTitle ?? shortTitle;
  const title = rawTitle.length <= 60 ? rawTitle : shortTitle.length <= 60 ? shortTitle : clampTitle(shortTitle);
  const rawDesc =
    label.metaDescription ??
    (clientSide
      ? fmt(s.toolMetaClient, { desc: label.description })
      : fmt(s.toolMetaAi, { desc: label.description, limit: FREE_AI_DAILY_LIMIT }));
  return {
    title,
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
