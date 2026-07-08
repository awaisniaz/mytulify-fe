import type { Metadata } from "next";
import Link from "next/link";
import { PLANS, FREE_AI_DAILY_LIMIT, PRO_PRICE_PKR } from "@/lib/billing/plans";
import { TOTAL_TOOLS, TOTAL_SERVER_SIDE_TOOLS } from "@/lib/catalog";
import { CLIENT_TOOLS } from "@/lib/messaging";
import { site } from "@/lib/site";
import { socialMeta } from "@/lib/seo";
import { ProUnlockForm } from "@/components/billing/ProUnlockForm";
import { PaymentCheckout } from "@/components/billing/PaymentCheckout";
import { ManageBillingButton } from "@/components/billing/ManageBillingButton";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${CLIENT_TOOLS}+ browser tools free with ads, or Pro for unlimited AI and ad-free browsing.`,
  alternates: { canonical: "/pricing" },
  ...socialMeta({
    title: `Pricing · ${site.name}`,
    description: `Free tools with ${FREE_AI_DAILY_LIMIT} AI runs/day, or Pro for unlimited.`,
    url: "/pricing",
  }),
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>;
}) {
  const clientTools = CLIENT_TOOLS;
  const { canceled } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <p className="section-label">Pricing</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">
          Simple plans. No surprises.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          {clientTools}+ browser tools stay free on the Free plan. Upgrade to Pro for unlimited AI & OCR
          ({TOTAL_SERVER_SIDE_TOOLS} tools) and an ad-free experience.
        </p>
        {canceled && (
          <p className="mt-4 text-sm text-amber-600">Checkout canceled — no charge was made.</p>
        )}
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {Object.values(PLANS).map((plan) => (
          <div
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-2xl border p-6 sm:p-8",
              plan.highlighted
                ? "border-brand bg-gradient-to-b from-brand/5 to-surface shadow-lg"
                : "border-border bg-surface",
            )}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-0.5 text-xs font-bold text-brand-fg">
                Most popular
              </span>
            )}
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              {plan.price === 0 ? (
                <span className="text-4xl font-extrabold">$0</span>
              ) : (
                <>
                  <span className="text-4xl font-extrabold">${plan.price}</span>
                  <span className="text-muted">/{plan.period}</span>
                  <span className="w-full text-sm text-muted sm:w-auto">
                    or Rs {PRO_PRICE_PKR}/mo in Pakistan
                  </span>
                </>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.id === "free" ? (
              <Link
                href="/tools"
                className="mt-8 inline-flex items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold text-muted"
              >
                {plan.cta}
              </Link>
            ) : (
              <PaymentCheckout className="mt-8" />
            )}
          </div>
        ))}
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
          <strong className="text-foreground">Stripe</strong> (international cards) ·{" "}
          <strong className="text-foreground">PayFast</strong> (JazzCash, EasyPaisa, PK cards) ·{" "}
          <strong className="text-foreground">JazzCash</strong> (mobile wallet). After payment you receive a Pro license key.
        </p>
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-bold">FAQ</h2>
        <div className="mt-4 space-y-4 text-sm text-muted">
          <div>
            <p className="font-semibold text-foreground">Which payment method for Pakistan?</p>
            <p className="mt-1">Choose PayFast or JazzCash/EasyPaisa — both support local wallets and cards in PKR (Rs {PRO_PRICE_PKR}/month).</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">What counts as an AI run?</p>
            <p className="mt-1">Each AI or OCR generation = 1 run. Browser-only tools stay unlimited.</p>
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
