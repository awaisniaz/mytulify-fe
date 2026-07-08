"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { API_URL } from "@/lib/auth/config";
import { authHeaders, getStoredUser } from "@/lib/auth/client";
import { PRO_PRICE_PKR, PRO_PRICE_USD } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";

type Gateway = {
  id: string;
  name: string;
  description: string;
  currency: string;
  amount: number;
};

export function PaymentCheckout({ className }: { className?: string }) {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (user?.email) setEmail(user.email);

    fetch(`${API_URL}/api/v1/payments/methods`)
      .then((r) => r.json())
      .then((d: { methods?: Gateway[] }) => {
        const list = d.methods ?? [];
        setGateways(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch(() => setError("Could not load payment methods. Is the backend running?"));
  }, []);

  async function checkout() {
    if (!selected || !email.trim()) {
      setError("Select a payment method and enter your email.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/v1/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ gateway: selected, email: email.trim() }),
      });
      const data = (await res.json()) as {
        type?: string;
        url?: string;
        action?: string;
        fields?: Record<string, string>;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      if (data.type === "redirect" && data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.type === "form" && data.action && data.fields) {
        sessionStorage.setItem("ts_checkout_form", JSON.stringify({ action: data.action, fields: data.fields }));
        window.location.href = "/pricing/pay";
        return;
      }

      setError("Unexpected checkout response");
    } catch {
      setError("Network error. Check backend is running on port 4000.");
    } finally {
      setLoading(false);
    }
  }

  if (gateways.length === 0 && !error) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-border py-3 text-center text-sm text-muted">
        Loading payment options…
      </p>
    );
  }

  if (gateways.length === 0) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-amber-300 bg-amber-50 py-3 text-center text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        {error || "No payment gateways configured. Add Stripe or PayFast keys in tools-hub-backend/.env"}
      </p>
    );
  }

  return (
    <div className={className}>
      <Input
        type="email"
        placeholder="Email for receipt & license"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
        required
      />

      <div className="space-y-2">
        {gateways.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setSelected(g.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
              selected === g.id ? "border-brand bg-brand/5" : "border-border hover:bg-surface-2",
            )}
          >
            <span
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2",
                selected === g.id ? "border-brand bg-brand" : "border-muted",
              )}
            />
            <span>
              <span className="block text-sm font-bold">{g.name}</span>
              <span className="block text-xs text-muted">{g.description}</span>
              <span className="mt-1 block text-xs font-semibold text-brand">
                {g.currency === "PKR" ? `Rs ${g.amount || PRO_PRICE_PKR}` : `$${g.amount || PRO_PRICE_USD}`}
                /month
              </span>
            </span>
          </button>
        ))}
      </div>

      <Button onClick={checkout} disabled={loading} className="mt-4 w-full justify-center gap-2">
        {loading ? (
          <>
            <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            Redirecting…
          </>
        ) : (
          <>
            Pay & upgrade to Pro
            <Icon name="ArrowRight" className="h-4 w-4" />
          </>
        )}
      </Button>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
    </div>
  );
}
