import { API_URL } from "@/lib/auth/config";

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

export async function fetchPlans(): Promise<ApiPlan[]> {
  const res = await fetch(`${API_URL}/api/v1/plans`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { plans?: ApiPlan[] };
  return data.plans ?? [];
}
