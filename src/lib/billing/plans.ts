/** Plan definitions — adjust limits here. */
export const FREE_AI_DAILY_LIMIT = 5;

/** Pro monthly price (display). PKR used for local gateways. */
export const PRO_PRICE_USD = 7;
export const PRO_PRICE_PKR = Number(process.env.NEXT_PUBLIC_PRO_PRICE_PKR ?? 1999);

export const PLANS = {
  free: {
    id: "free" as const,
    name: "Free",
    price: 0,
    pricePkr: 0,
    period: "forever",
    tagline: "Browser tools free · AI limits on Free",
    features: [
      "350+ browser tools — unlimited",
      "AI & OCR tools — 5 runs per day",
      "No signup required",
      "Side ads on site",
    ],
    cta: "Current plan",
    highlighted: false,
  },
  pro: {
    id: "pro" as const,
    name: "Pro",
    price: PRO_PRICE_USD,
    pricePkr: PRO_PRICE_PKR,
    period: "month",
    tagline: "For power users & professionals",
    features: [
      "All 398+ tools — unlimited",
      "AI & OCR — unlimited runs",
      "No ads anywhere",
      "Sync Pro with your account",
      "Pay via card, JazzCash, EasyPaisa & more",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
