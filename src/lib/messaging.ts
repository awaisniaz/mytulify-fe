import { TOTAL_TOOLS, TOTAL_CATEGORIES, TOTAL_SERVER_SIDE_TOOLS } from "./catalog";
import { FREE_AI_DAILY_LIMIT } from "./billing/plans";

/** Browser-only tools — free & unlimited on Free plan. */
export const CLIENT_TOOLS = TOTAL_TOOLS - TOTAL_SERVER_SIDE_TOOLS;

/** Shared copy — keeps Free vs Pro messaging accurate site-wide. */
export const APP_NAME = "Mytulify";

export const messaging = {
  tagline: `${TOTAL_TOOLS}+ Online Tools`,
  taglineWithTier: `${TOTAL_TOOLS}+ tools · Free tier + Pro`,

  siteDescription: `${TOTAL_TOOLS}+ online tools across ${TOTAL_CATEGORIES} categories. ${CLIENT_TOOLS}+ browser tools are free with no signup. AI & OCR tools include ${FREE_AI_DAILY_LIMIT} free runs per day — Pro adds unlimited AI and removes ads.`,

  heroBadge: `${TOTAL_TOOLS}+ tools · Free tier + Pro`,
  heroTitleLead: "Online tools for",
  heroSubtitle: `${CLIENT_TOOLS}+ browser tools free & unlimited. AI & OCR: ${FREE_AI_DAILY_LIMIT} runs/day on Free — Pro for unlimited & no ads.`,

  footerNote: `${CLIENT_TOOLS}+ browser tools free · Pro for unlimited AI`,

  homeValueFreeTitle: "Free tier",
  homeValueFreeDesc: `${CLIENT_TOOLS}+ browser tools · ${FREE_AI_DAILY_LIMIT} AI runs/day`,

  homeCtaSubtitle: `${CLIENT_TOOLS}+ tools work without signup. AI daily limits on Free — upgrade to Pro anytime.`,

  authSignupNote: "Account optional. Pro unlocks unlimited AI & no ads.",

  aboutIntro: `${TOTAL_TOOLS}+ online tools — ${CLIENT_TOOLS}+ run free in your browser; AI & OCR include a daily free allowance or unlimited with Pro.`,
  aboutPricingTitle: "Free & Pro",
  aboutPricingBody: `${CLIENT_TOOLS}+ browser tools stay free with no signup. AI & OCR tools allow ${FREE_AI_DAILY_LIMIT} runs per day on Free. Pro adds unlimited AI, OCR, and an ad-free experience.`,

  toolsPageDescription: `Browse ${TOTAL_TOOLS}+ online tools across ${TOTAL_CATEGORIES} categories. Browser tools are free; AI tools have daily limits on Free — Pro for unlimited.`,

  categoryTitle: (name: string, count: number) => `${name} — ${count} Online ${name}`,
  categoryDescription: (desc: string, count: number, nameLower: string) =>
    `${desc} ${count} ${nameLower} tools — browser tools free; AI tools may have daily limits on the Free plan.`,

  toolMetaTitle: (name: string) => `${name} — Online Tool`,
  toolMetaClient: (desc: string) =>
    `${desc} Free browser tool — runs locally in your browser, no signup required.`,
  toolMetaAi: (desc: string) =>
    `${desc} AI-powered tool — ${FREE_AI_DAILY_LIMIT} free runs/day on Free; Pro for unlimited.`,

  faqIsFree: (name: string, clientSide: boolean) =>
    clientSide
      ? `Yes. ${name} is free on our Free plan — unlimited use, no signup, and no watermark. Browser tools never require payment.`
      : `Yes, with daily limits. ${name} includes ${FREE_AI_DAILY_LIMIT} free runs per day on the Free plan. Upgrade to Pro for unlimited AI runs and no ads.`,

  toolAboutClient: (name: string, desc: string) =>
    `The ${name} is an online tool from ${APP_NAME}. ${desc} It runs entirely in your browser — fast, private, and unlimited on the Free plan. No account or installation needed.`,
  toolAboutAi: (name: string, desc: string) =>
    `The ${name} is an AI-powered tool from ${APP_NAME}. ${desc} The Free plan includes ${FREE_AI_DAILY_LIMIT} runs per day; Pro unlocks unlimited runs. Input is processed on our server — avoid pasting secrets.`,

  ogToolsLabel: `${TOTAL_TOOLS}+ online tools`,
  ogCategoryTools: (count: number) => `${count} tools · Free tier + Pro`,
  ogToolBadgeClient: "Free browser tool · No signup",
  ogToolBadgeAi: `AI tool · ${FREE_AI_DAILY_LIMIT} free runs/day`,
} as const;
