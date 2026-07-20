"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { ComingSoonPay } from "@/components/billing/ComingSoonPay";

export function CheckoutButton({
  className,
  paymentsReady = true,
}: {
  className?: string;
  /** When false, show Coming soon instead of starting checkout. */
  paymentsReady?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!paymentsReady) {
    return <ComingSoonPay className="mt-0" />;
  }

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        if (data.error?.toLowerCase().includes("not configured")) {
          setError("Payments coming soon — check back shortly.");
          return;
        }
        setError(data.error ?? "Checkout unavailable. Try again later.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={checkout} disabled={loading} className={className}>
        {loading ? (
          <>
            <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            Upgrade to Pro
            <Icon name="ArrowRight" className="h-4 w-4" />
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-muted">
          {error}{" "}
          <Link href="/pricing" className="font-semibold text-brand underline">
            View pricing
          </Link>
        </p>
      )}
    </div>
  );
}
