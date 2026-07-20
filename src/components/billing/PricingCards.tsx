"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PaymentCheckout } from "@/components/billing/PaymentCheckout";
import { ComingSoonPay } from "@/components/billing/ComingSoonPay";
import { Icon } from "@/components/ui/Icon";
import { getFreePlan } from "@/lib/billing/plans";
import {
  planPrice,
  type ApiPlan,
  type BillingInterval,
} from "@/lib/billing/plans-api";
import { API_URL } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

type Props = {
  paidPlans: ApiPlan[];
  /** Server hint; client re-checks live gateways. */
  paymentsReadyHint?: boolean;
};

export function PricingCards({ paidPlans, paymentsReadyHint = false }: Props) {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [paymentsReady, setPaymentsReady] = useState<boolean | null>(
    paymentsReadyHint ? true : null,
  );
  const free = getFreePlan();

  const pro = useMemo(
    () => paidPlans.find((p) => p.slug === "pro") ?? paidPlans[0] ?? null,
    [paidPlans],
  );

  const price = pro ? planPrice(pro, interval) : null;
  const period = interval === "year" ? "year" : "month";

  useEffect(() => {
    let cancelled = false;
    // Re-check when interval changes; start from server hint only then confirm live methods.
    setPaymentsReady(null);
    fetch(
      `${API_URL}/api/v1/payments/methods?plan=${encodeURIComponent(pro?.slug ?? "pro")}&interval=${interval}`,
    )
      .then((r) => r.json())
      .then((d: { methods?: unknown[] }) => {
        if (!cancelled) setPaymentsReady(Array.isArray(d.methods) && d.methods.length > 0);
      })
      .catch(() => {
        // Network/API down — prefer Coming soon over a broken checkout form.
        if (!cancelled) setPaymentsReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [interval, pro?.slug]);

  const showComingSoon = paymentsReady === false;
  const showCheckout = paymentsReady === true;

  return (
    <>
      <div className="mt-10 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-surface p-1">
          {(["month", "year"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setInterval(key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                interval === key
                  ? "bg-brand text-brand-fg"
                  : "text-muted hover:text-foreground",
              )}
            >
              {key === "month" ? "Monthly" : "Yearly"}
              {key === "year" && (
                <span className="ml-1 text-[10px] font-bold uppercase tracking-wide opacity-90">
                  save
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="relative flex flex-col rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold">{free.name}</h2>
          <p className="mt-1 text-sm text-muted">{free.tagline}</p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-4xl font-extrabold">$0</span>
            <span className="text-muted">/{free.period}</span>
          </div>
          <ul className="mt-6 flex-1 space-y-3">
            {free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/tools"
            className="mt-8 inline-flex items-center justify-center rounded-xl border border-border py-3 text-sm font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
          >
            {free.cta}
          </Link>
        </div>

        <div className="relative flex flex-col rounded-2xl border border-brand bg-gradient-to-b from-brand/5 to-surface p-6 shadow-lg sm:p-8">
          <span
            className={cn(
              "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold",
              showComingSoon
                ? "bg-surface-2 text-muted ring-1 ring-border"
                : "bg-brand text-brand-fg",
            )}
          >
            {showComingSoon ? "Coming soon" : "Most popular"}
          </span>
          <h2 className="text-xl font-bold">{pro?.name ?? "Pro"}</h2>
          <p className="mt-1 text-sm text-muted">
            {pro?.description ?? "Unlimited AI, OCR & ad-free browsing"}
          </p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-4xl font-extrabold">${price?.usd ?? "—"}</span>
            <span className="text-muted">/{period}</span>
            {price && (
              <span className="w-full text-sm text-muted sm:w-auto">
                or Rs {price.pkr}/{period} in Pakistan
              </span>
            )}
          </div>
          <ul className="mt-6 flex-1 space-y-3">
            {(pro?.features?.length
              ? pro.features
              : ["All tools — unlimited", "AI & OCR — unlimited", "No ads"]
            ).map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {f}
              </li>
            ))}
          </ul>

          {paymentsReady === null && (
            <p className="mt-8 rounded-xl border border-dashed border-border py-3 text-center text-sm text-muted">
              Checking payment options…
            </p>
          )}
          {showComingSoon && <ComingSoonPay />}
          {showCheckout && (
            <PaymentCheckout
              className="mt-8"
              planSlug={pro?.slug ?? "pro"}
              interval={interval}
            />
          )}
        </div>
      </div>
    </>
  );
}
