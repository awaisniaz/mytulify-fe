import { TOTAL_TOOLS, TOTAL_CATEGORIES, TOTAL_SERVER_SIDE_TOOLS } from "@/lib/catalog";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import type { Locale } from "./config";
import { getMessages, type Messages } from "./messages";

const CLIENT_TOOLS = TOTAL_TOOLS - TOTAL_SERVER_SIDE_TOOLS;

function fromCopy(t: Messages["copy"]) {
  return {
    tagline: t.tagline(TOTAL_TOOLS),
    taglineWithTier: t.taglineWithTier(TOTAL_TOOLS),
    siteDescription: t.siteDescription(TOTAL_TOOLS, TOTAL_CATEGORIES, CLIENT_TOOLS, FREE_AI_DAILY_LIMIT),
    heroBadge: t.heroBadge(TOTAL_TOOLS),
    heroTitleLead: t.heroTitleLead,
    heroSubtitle: t.heroSubtitle(CLIENT_TOOLS, FREE_AI_DAILY_LIMIT),
    footerNote: t.footerNote(CLIENT_TOOLS),
    homeValueFreeTitle: t.homeValueFreeTitle,
    homeValueFreeDesc: t.homeValueFreeDesc(CLIENT_TOOLS, FREE_AI_DAILY_LIMIT),
    homeCtaSubtitle: t.homeCtaSubtitle(CLIENT_TOOLS),
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
