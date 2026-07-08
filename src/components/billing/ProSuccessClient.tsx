"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { API_URL, APP_EVENTS } from "@/lib/auth/config";
import { setProKey } from "@/lib/billing/client";
import { site } from "@/lib/site";

export function ProSuccessClient({
  sessionId,
  orderRef,
}: {
  sessionId?: string;
  orderRef?: string;
}) {
  const [licenseKey, setLicenseKey] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    let tries = 0;
    async function load() {
      tries += 1;
      try {
        let data: { licenseKey?: string; email?: string; error?: string; status?: string } = {};
        let ok = false;

        if (orderRef) {
          const res = await fetch(`${API_URL}/api/v1/payments/order/${encodeURIComponent(orderRef)}`);
          data = (await res.json()) as typeof data;
          ok = res.ok && Boolean(data.licenseKey);
          if (res.ok && data.status === "pending" && tries < 10) {
            setTimeout(load, 1500);
            return;
          }
        } else if (sessionId) {
          const res = await fetch(`/api/billing/session?session_id=${encodeURIComponent(sessionId)}`);
          data = (await res.json()) as typeof data;
          ok = res.ok && Boolean(data.licenseKey);
        }

        if (ok && data.licenseKey) {
          setLicenseKey(data.licenseKey);
          setEmail(data.email ?? "");
          setStatus("ready");
          return;
        }
        if (tries < 8) {
          setTimeout(load, 1500);
          return;
        }
        setStatus("error");
        setMsg(data.error ?? `Could not retrieve your license. Contact ${site.supportEmail}`);
      } catch {
        if (tries < 8) setTimeout(load, 1500);
        else {
          setStatus("error");
          setMsg("Network error. Refresh the page or contact support.");
        }
      }
    }
    if (sessionId || orderRef) load();
    else {
      setStatus("error");
      setMsg("Missing payment reference");
    }
  }, [sessionId, orderRef]);

  function activate() {
    setProKey(licenseKey);
    setActivated(true);
    window.dispatchEvent(new Event(APP_EVENTS.proUpdated));
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted">
        <Icon name="Loader2" className="h-5 w-5 animate-spin" />
        Preparing your Pro license…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950/30">
        <p className="text-sm text-rose-600 dark:text-rose-400">{msg}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/5 to-surface p-8 text-center">
      <Icon name="Check" className="mx-auto h-10 w-10 text-brand" />
      <h2 className="mt-4 text-2xl font-extrabold">Payment successful!</h2>
      <p className="mt-2 text-sm text-muted">
        {email ? `License issued for ${email}.` : "Your Pro license is ready."} Save this key — you&apos;ll need it on each device.
      </p>
      <div className="mx-auto mt-6 max-w-md">
        <Input readOnly value={licenseKey} className="font-mono text-center text-sm" />
      </div>
      <Button onClick={activate} className="mt-4" disabled={activated}>
        {activated ? "Pro activated on this device" : "Activate on this device"}
      </Button>
      <p className="mt-4 text-xs text-muted">
        Signed in? Pro also syncs to your account automatically.
      </p>
    </div>
  );
}
