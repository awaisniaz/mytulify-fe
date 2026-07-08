"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

/** Auto-submits PayFast / JazzCash hosted checkout form. */
export default function PricingPayPage() {
  useEffect(() => {
    const raw = sessionStorage.getItem("ts_checkout_form");
    if (!raw) {
      window.location.replace("/pricing");
      return;
    }

    let payload: { action: string; fields: Record<string, string> };
    try {
      payload = JSON.parse(raw) as { action: string; fields: Record<string, string> };
    } catch {
      window.location.replace("/pricing");
      return;
    }

    sessionStorage.removeItem("ts_checkout_form");

    const form = document.createElement("form");
    form.method = "POST";
    form.action = payload.action;

    for (const [k, v] of Object.entries(payload.fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = v;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted">
      <Icon name="Loader2" className="h-5 w-5 animate-spin" />
      Redirecting to secure payment…
    </div>
  );
}
