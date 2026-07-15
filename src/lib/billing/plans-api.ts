import { API_URL } from "@/lib/auth/config";
import {
  PRO_PRICE_PKR,
  PRO_PRICE_PKR_YEARLY,
  PRO_PRICE_USD,
  PRO_PRICE_USD_YEARLY,
} from "@/lib/billing/plans";
import { TOTAL_AI_OCR_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";

export type ApiPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceUsdMonthly: number;
  priceUsdYearly: number;
  pricePkrMonthly: number;
  pricePkrYearly: number;
  features: string[];
  sortOrder: number;
};

export type BillingInterval = "month" | "year";

export function planPrice(plan: ApiPlan, interval: BillingInterval) {
  return interval === "year"
    ? { usd: plan.priceUsdYearly, pkr: plan.pricePkrYearly }
    : { usd: plan.priceUsdMonthly, pkr: plan.pricePkrMonthly };
}

/** Used when the payments API is down so /pricing still renders. */
export const FALLBACK_PRO_PLAN: ApiPlan = {
  id: "pro",
  slug: "pro",
  name: "Pro",
  description: "Unlimited AI, OCR & ad-free browsing",
  priceUsdMonthly: PRO_PRICE_USD,
  priceUsdYearly: PRO_PRICE_USD_YEARLY,
  pricePkrMonthly: PRO_PRICE_PKR,
  pricePkrYearly: PRO_PRICE_PKR_YEARLY,
  features: [
    `All ${TOTAL_TOOLS}+ tools — unlimited`,
    `AI & OCR (${TOTAL_AI_OCR_TOOLS} tools) — unlimited runs`,
    "No ads anywhere",
    "Sync Pro across devices with your account",
    "Pay via card, JazzCash, EasyPaisa & more",
  ],
  sortOrder: 1,
};

function normalizePlan(raw: Partial<ApiPlan> & { slug?: string }): ApiPlan | null {
  if (!raw?.slug) return null;
  return {
    id: String(raw.id ?? raw.slug),
    slug: String(raw.slug),
    name: String(raw.name ?? raw.slug),
    description: raw.description ?? null,
    priceUsdMonthly: Number(raw.priceUsdMonthly) || PRO_PRICE_USD,
    priceUsdYearly: Number(raw.priceUsdYearly) || PRO_PRICE_USD_YEARLY,
    pricePkrMonthly: Number(raw.pricePkrMonthly) || PRO_PRICE_PKR,
    pricePkrYearly: Number(raw.pricePkrYearly) || PRO_PRICE_PKR_YEARLY,
    features: Array.isArray(raw.features) ? raw.features.map(String) : FALLBACK_PRO_PLAN.features,
    sortOrder: Number(raw.sortOrder) || 0,
  };
}

export async function fetchPlans(): Promise<ApiPlan[]> {
  try {
    const res = await fetch(`${API_URL}/api/v1/plans`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [FALLBACK_PRO_PLAN];
    const data = (await res.json()) as { plans?: Partial<ApiPlan>[] };
    const plans = (data.plans ?? [])
      .map(normalizePlan)
      .filter((p): p is ApiPlan => p != null);
    return plans.length ? plans : [FALLBACK_PRO_PLAN];
  } catch {
    // Backend unreachable (common in SSR if API_URL is wrong/down) — never crash pricing.
    return [FALLBACK_PRO_PLAN];
  }
}
