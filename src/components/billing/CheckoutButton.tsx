"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";

export function CheckoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
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
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
    </div>
  );
}
