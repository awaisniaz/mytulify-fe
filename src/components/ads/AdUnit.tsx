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
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;

    const pushAd = () => {
      if (pushed.current) return;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* blocked / already filled */
      }
    };

    if (window.adsbygoogle) {
      pushAd();
      return;
    }

    const interval = window.setInterval(() => {
      if (window.adsbygoogle) {
        window.clearInterval(interval);
        pushAd();
      }
    }, 250);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 10000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <ins
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
    <aside className={cn("w-full", className)} aria-label="Advertisement">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted">
        Ad
      </p>
      {children}
    </aside>
  );
}
