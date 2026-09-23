"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ads, isAdFreePath } from "@/lib/ads";
import { APP_EVENTS } from "@/lib/auth/config";
import { getProKey } from "@/lib/billing/client";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/**
 * One push per mounted <ins>. Parents should remount with `key={pathname}` on navigation.
 * Skips push if the unit is already filled (prevents stacked blank slots).
 */
export function AdIns({
  slot,
  format,
  layout,
  layoutKey,
  fullWidthResponsive,
  textAlign,
}: {
  slot: string;
  format: string;
  layout?: string;
  layoutKey?: string;
  fullWidthResponsive?: boolean;
  textAlign?: "center";
}) {
  const insRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    const el = insRef.current;
    if (!el) return;
    if (el.getAttribute("data-adsbygoogle-status")) {
      pushed.current = true;
      return;
    }

    let cancelled = false;
    let interval: number | undefined;
    let timeout: number | undefined;

    const pushAd = () => {
      if (cancelled || pushed.current) return;
      if (el.getAttribute("data-adsbygoogle-status")) {
        pushed.current = true;
        return;
      }
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        pushed.current = false;
      }
    };

    if (window.adsbygoogle) {
      pushAd();
    } else {
      interval = window.setInterval(() => {
        if (window.adsbygoogle) {
          if (interval !== undefined) window.clearInterval(interval);
          pushAd();
        }
      }, 250);
      timeout = window.setTimeout(() => {
        if (interval !== undefined) window.clearInterval(interval);
      }, 10000);
    }

    return () => {
      cancelled = true;
      if (interval !== undefined) window.clearInterval(interval);
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, []);

  return (
    <ins
      ref={insRef}
      className="adsbygoogle"
      style={{ display: "block", ...(textAlign ? { textAlign } : {}) }}
      data-ad-client={ads.clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      {...(layout ? { "data-ad-layout": layout } : {})}
      {...(layoutKey ? { "data-ad-layout-key": layoutKey } : {})}
      {...(fullWidthResponsive ? { "data-full-width-responsive": "true" } : {})}
    />
  );
}

export function AdFrame({ className, children }: { className?: string; children: ReactNode }) {
  const path = usePathname();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const sync = () => setIsPro(Boolean(getProKey()));
    sync();
    window.addEventListener(APP_EVENTS.proUpdated, sync);
    return () => window.removeEventListener(APP_EVENTS.proUpdated, sync);
  }, []);

  if (!ads.clientId || isAdFreePath(path) || isPro) return null;

  return (
    <aside
      className={cn("ad-frame w-full max-w-full overflow-hidden isolate", className)}
      aria-label="Advertisement"
    >
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted">
        Ad
      </p>
      <div className="ad-slot relative w-full max-w-full overflow-hidden">{children}</div>
    </aside>
  );
}
