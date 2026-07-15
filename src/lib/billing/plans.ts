import {
  TOTAL_TOOLS,
  TOTAL_BROWSER_TOOLS,
  TOTAL_AI_OCR_TOOLS,
} from "@/lib/catalog";

/** Free-tier AI daily limit — local enforcement. */
export const FREE_AI_DAILY_LIMIT = 5;

/** Fallback display prices if backend is unreachable (not env-driven). */
export const PRO_PRICE_USD = 7;
export const PRO_PRICE_PKR = 1999;
export const PRO_PRICE_USD_YEARLY = 60;
export const PRO_PRICE_PKR_YEARLY = 16999;

export type PlanId = "free" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  price: number;
  pricePkr: number;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlighted: boolean;
};

/** Free plan stays local (catalog counts). Paid plans come from the API. */
export function getFreePlan(): Plan {
  return {
    id: "free",
    name: "Free",
    price: 0,
    pricePkr: 0,
    period: "forever",
    tagline: "Start free — no signup for browser tools",
    features: [
      `${TOTAL_BROWSER_TOOLS}+ browser tools — unlimited`,
      `AI & OCR (${TOTAL_AI_OCR_TOOLS} tools) — ${FREE_AI_DAILY_LIMIT} runs/day`,
      "No signup required for browser tools",
      "Side ads on the site",
    ],
    cta: "Browse free tools",
    highlighted: false,
  };
}

/** @deprecated Prefer API plans + getFreePlan(). */
export function getPlans(): Record<PlanId, Plan> {
  return {
    free: getFreePlan(),
    pro: {
      id: "pro",
      name: "Pro",
      price: PRO_PRICE_USD,
      pricePkr: PRO_PRICE_PKR,
      period: "month",
      tagline: "Unlimited AI, OCR & ad-free browsing",
      features: [
        `All ${TOTAL_TOOLS}+ tools — unlimited`,
        `AI & OCR (${TOTAL_AI_OCR_TOOLS} tools) — unlimited runs`,
        "No ads anywhere",
        "Sync Pro across devices with your account",
        "Pay via card, JazzCash, EasyPaisa & more",
      ],
      cta: "Upgrade to Pro",
      highlighted: true,
    },
  };
}

/** @deprecated Prefer getPlans() so counts stay in sync. */
export const PLANS = getPlans();
