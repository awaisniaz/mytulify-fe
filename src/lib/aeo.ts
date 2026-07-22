import type { ToolHowTo } from "@/i18n/content/types";
import type { ToolFaqItem } from "@/i18n/content/types";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { site } from "@/lib/site";

/** Trim description into a clause suitable for “what is” lead sentences. */
export function descClause(description: string): string {
  let d = description.trim().replace(/\s+/g, " ").replace(/\.$/, "");
  if (!d) return "helps you get work done online in seconds";
  d = d.charAt(0).toLowerCase() + d.slice(1);
  return d;
}

/** First sentence for AEO/GEO: direct answer, ideally under 25 words. */
export function directAnswerLead(name: string, description: string, poweredByAi = false): string {
  const prefix = poweredByAi
    ? `${name} is a free AI-powered tool that`
    : `${name} is a free online tool that`;
  const clause = descClause(description);
  const draft = `${prefix} ${clause}.`;
  const words = draft.split(/\s+/);
  if (words.length <= 25) return draft;
  const prefixLen = prefix.split(/\s+/).length;
  const budget = Math.max(6, 24 - prefixLen);
  const clipped = clause.split(/\s+/).slice(0, budget).join(" ").replace(/[.,;:]+$/, "");
  return `${prefix} ${clipped}.`;
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
): string[] {
  const cleaned = paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!cleaned.length) return [directAnswerLead(name, description, poweredByAi)];
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
  return [directAnswerLead(name, description, poweredByAi), ...cleaned];
}

export function defaultHowTo(
  name: string,
  clientSide: boolean,
): ToolHowTo {
  if (clientSide) {
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

/** Extra prose under How-to steps — use cases, benefits (~200+ words combined with steps). */
export function howToProse(name: string, description: string, clientSide: boolean): string[] {
  const clause = descClause(description);
  if (clientSide) {
    return [
      `The ${name} is built for speed and privacy: ${clause}. Typical use cases include everyday personal tasks, student assignments, freelance deliverables, and quick checks at work when you cannot install desktop software. Because files and text often stay in your browser, it is a practical choice on shared or locked-down computers.`,
      `Benefits of using this free browser tool include zero install, instant results, unlimited use on the Free plan, and compatibility with phones, tablets, and laptops. Bookmark this page to return anytime, and pair it with related tools in the same category when your workflow needs multiple steps.`,
    ];
  }
  return [
    `The ${name} helps when ${clause}. Common use cases include marketing copy, research summaries, content repurposing, and repetitive writing tasks where AI saves hours each week. Free accounts suit occasional use; creators and agencies often upgrade to Pro for unlimited daily runs.`,
    `Best practices: start with a clear prompt, review AI output before publishing, and avoid pasting passwords or highly sensitive data. Combine this tool with Mytulify's related utilities to format, count, or export your results in one workflow.`,
  ];
}

export function softwareApplicationJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  categoryName: string;
  clientSide: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    applicationCategory: `${opts.categoryName}Application`,
    operatingSystem: "Web browser",
    browserRequirements: "Requires JavaScript. Works on desktop and mobile browsers.",
    description: opts.description,
    url: opts.url,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      description: opts.clientSide
        ? "Free plan — unlimited browser-side use on Mytulify"
        : `Free plan — ${FREE_AI_DAILY_LIMIT} AI runs per day; Pro for unlimited`,
    },
  };
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

export function toolQuickFacts(name: string, clientSide: boolean): QuickFact[] {
  return [
    { label: "Tool", value: name },
    { label: "Price", value: "Free to use on Mytulify" },
    { label: "Signup required", value: "No" },
    {
      label: "Processing",
      value: clientSide ? "In your browser (client-side)" : "Secure server + AI model",
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
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
