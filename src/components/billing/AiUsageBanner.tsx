"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { APP_EVENTS } from "@/lib/auth/config";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { getProKey, proHeaders } from "@/lib/billing/client";
import { cn } from "@/lib/utils";

type Usage = {
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
  resetsAt: string;
};

export function AiUsageBanner({ className }: { className?: string }) {
  const [usage, setUsage] = useState<Usage | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/usage", { headers: proHeaders() });
      if (res.ok) setUsage(await res.json());
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    refresh();
    const onPro = () => refresh();
    window.addEventListener(APP_EVENTS.proUpdated, onPro);
    return () => window.removeEventListener(APP_EVENTS.proUpdated, onPro);
  }, [refresh]);

  if (!usage) return null;

  if (usage.isPro) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm", className)}>
        <Icon name="Sparkles" className="h-4 w-4 text-brand" />
        <span className="font-semibold text-brand">Pro</span>
        <span className="text-muted">— unlimited AI runs</span>
      </div>
    );
  }

  const limit = usage.limit > 0 ? usage.limit : FREE_AI_DAILY_LIMIT;
  const remaining = usage.remaining >= 0 ? usage.remaining : Math.max(0, limit - usage.used);
  const low = remaining <= 1;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm",
        low ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-surface-2/60",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon name="Sparkles" className={cn("h-4 w-4", low ? "text-amber-600" : "text-muted")} />
        <span>
          AI runs today:{" "}
          <strong>{usage.used}</strong> / {limit}
          {remaining > 0 && (
            <span className="text-muted"> · {remaining} left</span>
          )}
        </span>
      </div>
      {remaining === 0 ? (
        <Link href="/pricing" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
          Upgrade to Pro <Icon name="ArrowRight" className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Link href="/pricing" className="text-xs font-medium text-muted hover:text-brand">
          Go unlimited →
        </Link>
      )}
    </div>
  );
}

/** Call after a successful AI run to refresh the banner. */
export function notifyUsageUpdated() {
  window.dispatchEvent(new Event(APP_EVENTS.proUpdated));
}

export function hasProKey(): boolean {
  return Boolean(getProKey());
}
