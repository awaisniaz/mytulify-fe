import type { Metadata } from "next";
import {
  FREE_AI_DAILY_LIMIT,
  PRO_PRICE_PKR,
  PRO_PRICE_USD,
  PRO_PRICE_USD_YEARLY,
  PRO_PRICE_PKR_YEARLY,
} from "@/lib/billing/plans";
import { fetchPlans, planPrice } from "@/lib/billing/plans-api";
import {
  TOTAL_TOOLS,
  TOTAL_BROWSER_TOOLS,
  TOTAL_AI_OCR_TOOLS,
} from "@/lib/catalog";
import { site } from "@/lib/site";
import { socialMeta } from "@/lib/seo";
import { ProUnlockForm } from "@/components/billing/ProUnlockForm";
import { PricingCards } from "@/components/billing/PricingCards";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${TOTAL_BROWSER_TOOLS}+ browser tools free with ads, or Pro (from $${PRO_PRICE_USD}/mo) for unlimited AI & OCR and ad-free browsing.`,
  alternates: { canonical: "/pricing" },
  robots: { index: true, follow: true },
  ...socialMeta({
    title: `Pricing · ${site.name}`,
    description: `Free: ${TOTAL_BROWSER_TOOLS}+ browser tools + ${FREE_AI_DAILY_LIMIT} AI runs/day. Pro: unlimited AI & OCR, no ads.`,
    url: "/pricing",
  }),
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const { canceled } = await searchParams;
  const paidPlans = await fetchPlans();
  const pro = paidPlans.find((p) => p.slug === "pro") ?? paidPlans[0];
  const monthly = pro ? planPrice(pro, "month") : { usd: PRO_PRICE_USD, pkr: PRO_PRICE_PKR };
  const yearly = pro ? planPrice(pro, "year") : { usd: PRO_PRICE_USD_YEARLY, pkr: PRO_PRICE_PKR_YEARLY };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="section-label">Pricing</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Simple plans. Real numbers.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          {TOTAL_TOOLS}+ tools across the site — {TOTAL_BROWSER_TOOLS}+ browser tools stay free forever.
          AI & OCR ({TOTAL_AI_OCR_TOOLS} tools) include {FREE_AI_DAILY_LIMIT} free runs/day; Pro unlocks unlimited
          runs and removes ads.
        </p>
        {canceled && (
          <p className="mt-4 text-sm text-amber-600">Checkout canceled — no charge was made.</p>
        )}
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {[
          { value: `${TOTAL_TOOLS}+`, label: "Total tools" },
          { value: `${TOTAL_BROWSER_TOOLS}+`, label: "Free browser tools" },
          { value: String(TOTAL_AI_OCR_TOOLS), label: "AI & OCR tools" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface px-4 py-4 text-center">
            <div className="text-2xl font-extrabold tracking-tight">{stat.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <PricingCards paidPlans={paidPlans} />

      <div className="mt-10 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Compare</th>
              <th className="px-4 py-3 font-medium">Free</th>
              <th className="px-4 py-3 font-medium text-brand">Pro</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {[
              [`Browser tools (${TOTAL_BROWSER_TOOLS}+)`, "Unlimited", "Unlimited"],
              [`AI & OCR (${TOTAL_AI_OCR_TOOLS})`, `${FREE_AI_DAILY_LIMIT} runs/day`, "Unlimited"],
              ["Ads", "Side ads", "None"],
              ["Account", "Optional", "Optional (syncs Pro)"],
              [
                "Price",
                "$0",
                `$${monthly.usd}/mo · $${yearly.usd}/yr · Rs ${monthly.pkr}/mo`,
              ],
              ...(pro?.features?.length
                ? pro.features.map((f) => [f, "—", "Included"] as const)
                : []),
            ].map(([label, free, proCell]) => (
              <tr key={label} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                <td className="px-4 py-3 text-muted">{free}</td>
                <td className="px-4 py-3 text-muted">{proCell}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id="unlock" className="mt-12 space-y-6">
        <ProUnlockForm />
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="font-bold">Manage your subscription</h3>
          <p className="mt-1 text-sm text-muted">
            Stripe subscribers: update card or cancel via Customer Portal. Pakistan payments: use your license key.
          </p>
          <div className="mt-4">
            <ManageBillingButton />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface-2/50 p-6 text-center text-sm text-muted">
        <Icon name="Lock" className="mx-auto mb-2 h-5 w-5 text-brand" />
        <p>
          <strong className="text-foreground">Lemon Squeezy</strong> (international cards & PayPal) ·{" "}
          <strong className="text-foreground">PayFast</strong> (JazzCash, EasyPaisa, PK cards) ·{" "}
          <strong className="text-foreground">JazzCash</strong> ·{" "}
          <strong className="text-foreground">EasyPaisa</strong>. After payment you receive a Pro license key.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-bold">FAQ</h2>
        <div className="mt-4 space-y-4 text-sm text-muted">
          <div>
            <p className="font-semibold text-foreground">What’s free forever?</p>
            <p className="mt-1">
              All {TOTAL_BROWSER_TOOLS}+ browser tools — PDF, image, SEO, text, calculators, and more — with no daily cap.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Which payment method for Pakistan?</p>
            <p className="mt-1">
              Choose PayFast (all local methods), JazzCash, or EasyPaisa — PKR
              (Rs {monthly.pkr}/month or Rs {yearly.pkr}/year).
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">What counts as an AI run?</p>
            <p className="mt-1">
              Each AI or OCR generation = 1 run (covers all {TOTAL_AI_OCR_TOOLS} AI & OCR tools). Browser-only tools stay unlimited.
            </p>
          </div>
          <div>
            <p className="font-semibold text-foreground">Do I need an account?</p>
            <p className="mt-1">Optional. Sign up to sync Pro across devices, or use a license key only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
