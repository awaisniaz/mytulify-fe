"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/Icon";
import { APP_EVENTS } from "@/lib/auth/config";
import { brand } from "@/lib/brand";
import { setProKey } from "@/lib/billing/client";
import { cn } from "@/lib/utils";

export function ProUnlockForm() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "fail">("idle");
  const [msg, setMsg] = useState("");

  async function verify() {
    setStatus("checking");
    setMsg("");
    setProKey(key);
    try {
      const res = await fetch("/api/usage", { headers: { "X-Pro-Key": key.trim() } });
      const data = (await res.json()) as { isPro?: boolean };
      if (data.isPro) {
        setStatus("ok");
        setMsg("Pro activated! Enjoy unlimited AI runs and no ads.");
        window.dispatchEvent(new Event(APP_EVENTS.proUpdated));
      } else {
        setStatus("fail");
        setMsg("Invalid license key. Check your email or contact support.");
        setProKey("");
      }
    } catch {
      setStatus("fail");
      setMsg("Could not verify. Try again.");
      setProKey("");
    }
  }

  return ( null );
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="font-bold">Already have a Pro license?</h3>
      <p className="mt-1 text-sm text-muted">Enter your key to unlock unlimited AI on this device.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={`${brand.licensePrefix}xxxxxxxx`}
          className="font-mono text-sm"
        />
        <Button onClick={verify} disabled={!key.trim() || status === "checking"} className="shrink-0">
          {status === "checking" ? (
            <>
              <Icon name="Loader2" className="h-4 w-4 animate-spin" /> Verifying…
            </>
          ) : (
            "Activate"
          )}
        </Button>
      </div>
      {msg && (
        <p className={cn("mt-3 text-sm", status === "ok" ? "text-emerald-600" : "text-rose-500")}>{msg}</p>
      )}
    </div>
  
}
