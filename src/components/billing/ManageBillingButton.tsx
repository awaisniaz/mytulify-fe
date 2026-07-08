"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { getProKey } from "@/lib/billing/client";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    const key = getProKey();
    if (!key) {
      setError("Activate your Pro license key first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "X-Pro-Key": key },
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not open billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" onClick={openPortal} disabled={loading} className="text-sm">
        {loading ? (
          <>
            <Icon name="Loader2" className="h-4 w-4 animate-spin" /> Opening…
          </>
        ) : (
          "Manage subscription"
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </div>
  );
}
