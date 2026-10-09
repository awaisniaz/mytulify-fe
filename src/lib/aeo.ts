import type { ToolHowTo } from "@/i18n/content/types";
import type { ToolFaqItem } from "@/i18n/content/types";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { site } from "@/lib/site";
import type { ToolGuideKind } from "@/lib/seo/tool-guide-kind";
import { isHandwritingTextOcrSlug, ocrScriptNote } from "@/lib/seo/tool-guide-kind";

/** Trim description into a clause suitable for “what is” lead sentences. */
export function descClause(description: string): string {
  let d = description.trim().replace(/\s+/g, " ").replace(/\.$/, "");
  if (!d) return "help you get work done online in seconds";
  d = d.charAt(0).toLowerCase() + d.slice(1);
  return d;
}

/** Words that must not end a clipped lead (prepositions, articles, dangling modifiers). */
const LEAD_DANGLING = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "into",
  "onto",
  "for",
  "with",
  "from",
  "by",
  "on",
  "in",
  "at",
  "as",
  "via",
  "per",
  "than",
  "then",
  "that",
  "which",
  "whose",
  "when",
  "while",
  "about",
  "over",
  "under",
  "after",
  "before",
  "optional",
  "another",
  "your",
  "its",
  "their",
]);

/** First sentence for AEO/GEO: complete, grammatical direct answer (prefer full clause). */
export function directAnswerLead(
  name: string,
  description: string,
  poweredByAi = false,
  slug?: string,
): string {
  const ocrNote = slug ? ocrScriptNote(slug) : null;
  if (ocrNote) {
    return `${name} is a free online handwriting OCR tool that converts ${ocrNote.language} handwriting from a photo into editable ${ocrNote.language} text, with optional translation into another language.`;
  }

  // "to <infinitive…>" stays grammatical after descClause lowercases "Convert" → "convert".
  const prefix = poweredByAi
    ? `${name} is a free AI-powered tool to`
    : `${name} is a free online tool to`;
  const clause = descClause(description);
  const draft = `${prefix} ${clause}.`;
  const words = draft.split(/\s+/);
  // Soft AEO length preference — never cut mid-phrase when the full sentence is still readable.
  if (words.length <= 40) return draft;

  const prefixLen = prefix.split(/\s+/).length;
  const budget = Math.max(8, 36 - prefixLen);
  const clippedWords = clause.split(/\s+/).slice(0, budget);
  while (clippedWords.length > 4 && LEAD_DANGLING.has(clippedWords[clippedWords.length - 1]!.toLowerCase())) {
    clippedWords.pop();
  }
  // Prefer ending on a comma/phrase boundary inside the budget when available.
  const joined = clippedWords.join(" ");
  const comma = joined.lastIndexOf(",");
  const safe =
    comma > 12 ? joined.slice(0, comma).trim() : joined.replace(/[.,;:]+$/, "").trim();
  return `${prefix} ${safe}.`;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstSentence(text: string): string {
  const m = text.match(/^[\s\S]+?[.!?](?=\s|$)/);
  return (m?.[0] ?? text).trim();
}

/** Ensure custom about copy leads with a citable direct-answer sentence. */
export function ensureDirectAbout(
  paragraphs: string[],
  name: string,
  description: string,
  poweredByAi = false,
  slug?: string,
): string[] {
  const cleaned = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!cleaned.length) return [directAnswerLead(name, description, poweredByAi, slug)];
  const first = cleaned[0]!;
  const lead = firstSentence(first);
  const leadWords = lead.split(/\s+/).length;
  const startsWithName = new RegExp(`^(The\\s+)?${escapeRegExp(name)}\\b`, "i").test(lead);

  if (startsWithName && leadWords <= 28) {
    const restOfFirst = first.slice(lead.length).trim();
    const rest = [restOfFirst, ...cleaned.slice(1)].filter(Boolean);
    return rest.length ? [lead, ...rest] : [lead];
  }

  // Vague or overlong opening — prepend a tight direct answer
  return [directAnswerLead(name, description, poweredByAi, slug), ...cleaned];
}

/** @deprecated Prefer passing ToolGuideKind. */
export function defaultHowTo(name: string, clientSideOrKind: boolean | ToolGuideKind, slug?: string): ToolHowTo {
  const kind: ToolGuideKind =
    typeof clientSideOrKind === "boolean" ? (clientSideOrKind ? "browser" : "ai") : clientSideOrKind;
  if (kind === "browser") {
    return {
      title: `How to use the ${name}`,
      steps: [
        `Open the free ${name} on Mytulify — no signup or download required.`,
        "Enter, paste, or upload your input in the tool panel at the top of this page.",
        "Adjust any options shown (format, quality, or style settings) to match your goal.",
        "Run the tool and review the instant result displayed in your browser.",
        "Copy, download, or share the output. Processing stays on your device for privacy.",
        "Repeat as often as you need — client-side tools on Mytulify are unlimited on the Free plan.",
      ],
    };
  }
  if (kind === "ocr") {
    const note = slug ? ocrScriptNote(slug) : null;
    const isTextOcr = isHandwritingTextOcrSlug(slug);
    const imageStep = note
      ? `This page reads ${note.language} handwriting (${note.script}). ${note.tip}`
      : isTextOcr
        ? null
        : "Crop empty margins while keeping all page content in frame.";
    const optionsStep = isTextOcr
      ? "Set the output style, reading mode, cleanup, and uncertainty options. Select a translation language only if you want a translation, then run OCR."
      : "Choose any output or summary options shown for this tool, then run it.";
    return {
      title: `How to use the ${name}`,
      steps: [
        "Upload a clear, upright photo of a flat page with even lighting; keep all writing in frame and avoid blur, glare, and skew.",
        ...(imageStep ? [imageStep] : []),
        optionsStep,
        "Review the result against the photo before you copy or download it.",
      ],
    };
  }
  return {
    title: `How to use the ${name}`,
    steps: [
      `Open the free ${name} on Mytulify in your browser on desktop or mobile.`,
      "Paste or upload your content in the input area above.",
      "Choose any tone, length, or style options if the tool provides them.",
      `Click generate and wait a few seconds for the AI result (Free plan: ${FREE_AI_DAILY_LIMIT} runs per day).`,
      "Review the output for accuracy, then copy or download it for your project.",
      "Upgrade to Pro for unlimited daily runs if you use this tool professionally.",
    ],
  };
}

/** Short supporting prose under How-to steps; avoid filler and repeated instructions. */
export function howToProse(
  name: string,
  description: string,
  clientSideOrKind: boolean | ToolGuideKind,
  slug?: string,
): string[] {
  const kind: ToolGuideKind =
    typeof clientSideOrKind === "boolean" ? (clientSideOrKind ? "browser" : "ai") : clientSideOrKind;
  const clause = descClause(description);
  if (slug === "duplicate-photo-finder") {
    return [
      "Example: byte-for-byte copies of the same JPG have the same MD5 result and count as exact duplicates. A resized or recompressed copy has different bytes, but its difference hash or average hash can still group it with the original.",
      "Review similar groups before removing anything: two frames from a camera burst can look alike without being duplicates. Keep the highest-resolution copy or pin the frame you want, then export the list for manual removal.",
    ];
  }
  if (kind === "browser") {
    return [
      `The ${name} is built for speed and privacy: ${clause}. Typical use cases include everyday personal tasks, student assignments, freelance deliverables, and quick checks at work when you cannot install desktop software. Because files and text often stay in your browser, it is a practical choice on shared or locked-down computers.`,
      `Benefits of using this free browser tool include zero install, instant results, unlimited use on the Free plan, and compatibility with phones, tablets, and laptops. Bookmark this page to return anytime, and pair it with related tools in the same category when your workflow needs multiple steps.`,
    ];
  }
  if (kind === "ocr") {
    return [
      "A transcription can still misread names, dates, and amounts. Check those details against the original image before you rely on the text.",
    ];
  }
  return [
    `The ${name} helps when ${clause}. Common use cases include drafting, rewriting, and structured AI assistance where a model saves setup time. Free accounts suit occasional use; creators and agencies often upgrade to Pro for unlimited daily runs.`,
    `Best practices: give clear source material, review AI output before publishing, and avoid pasting passwords or highly sensitive data. Combine this tool with Mytulify's related utilities to format, count, or export your results in one workflow.`,
  ];
}

export function breadcrumbJsonLd(items: { name: string; item: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export type QuickFact = { label: string; value: string };

export function toolQuickFacts(name: string, clientSide: boolean, categorySlug?: string): QuickFact[] {
  return [
    { label: "Tool", value: name },
    { label: "Price", value: "Free to use on Mytulify" },
    { label: "Signup required", value: "No" },
    {
      label: "Processing",
      value: clientSide
        ? "In your browser (client-side)"
        : categorySlug === "handwriting-ocr"
          ? "Mytulify server + model provider"
          : "Secure server + AI model",
    },
    {
      label: "Daily limit (Free)",
      value: clientSide ? "Unlimited" : `${FREE_AI_DAILY_LIMIT} AI runs per day`,
    },
  ];
}

export function faqPageJsonLd(faq: ToolFaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") },
    })),
  };
}

/** Free browser calculator / tool as a WebApplication. */
export function webApplicationJsonLd(input: {
  name: string;
  description: string;
  url: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.category ?? "FinanceApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function howToJsonLd(howTo: ToolHowTo, pageUrl: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: howTo.title,
    description: `Step-by-step guide to using the free ${name} on ${site.name}.`,
    totalTime: "PT2M",
    step: howTo.steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
      url: `${pageUrl}#how-to-use`,
    })),
  };
}
