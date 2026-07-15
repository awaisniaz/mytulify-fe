import { TOTAL_TOOLS, TOTAL_CATEGORIES, TOTAL_BROWSER_TOOLS } from "@/lib/catalog";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import type { Locale } from "./config";
import { getMessages, type Messages } from "./messages";

function fromCopy(t: Messages["copy"]) {
  return {
    tagline: t.tagline(TOTAL_TOOLS),
    taglineWithTier: t.taglineWithTier(TOTAL_TOOLS),
    siteDescription: t.siteDescription(TOTAL_TOOLS, TOTAL_CATEGORIES, TOTAL_BROWSER_TOOLS, FREE_AI_DAILY_LIMIT),
    heroBadge: t.heroBadge(TOTAL_TOOLS),
    heroTitleLead: t.heroTitleLead,
    heroSubtitle: t.heroSubtitle(TOTAL_BROWSER_TOOLS, FREE_AI_DAILY_LIMIT),
    footerNote: t.footerNote(TOTAL_BROWSER_TOOLS),
    homeValueFreeTitle: t.homeValueFreeTitle,
    homeValueFreeDesc: t.homeValueFreeDesc(TOTAL_BROWSER_TOOLS, FREE_AI_DAILY_LIMIT),
    homeCtaSubtitle: t.homeCtaSubtitle(TOTAL_BROWSER_TOOLS),
  };
}

/** Locale-aware site copy for UI shell. */
export async function getMessaging(locale: Locale) {
  return fromCopy((await getMessages(locale)).copy);
}

export function messagingFrom(messages: Messages) {
  return fromCopy(messages.copy);
}

export async function categoryLabel(locale: Locale, slug: string, fallback: string) {
  const names = (await getMessages(locale)).categories;
  return names[slug] ?? fallback;
}

export function categoryLabelFrom(messages: Messages, slug: string, fallback: string) {
  return messages.categories[slug] ?? fallback;
}
