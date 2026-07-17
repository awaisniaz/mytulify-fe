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
        `Open the free ${name} on Mytulify — no signup required.`,
        "Enter or upload your input in the tool panel above.",
        "Adjust any options if shown, then run the tool to get an instant browser-side result.",
        "Copy, download, or share the output. For this client-side tool, processing stays on your device.",
      ],
    };
  }
  return {
    title: `How to use the ${name}`,
    steps: [
      `Open the free ${name} on Mytulify.`,
      "Paste or upload your content in the form above.",
      `Click generate and wait a few seconds for the AI result (Free plan includes ${FREE_AI_DAILY_LIMIT} runs per day).`,
      "Review the output, then copy or download it for your project.",
    ],
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
