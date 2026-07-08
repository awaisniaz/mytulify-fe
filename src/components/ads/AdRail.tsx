"use client";

import { useEffect, useRef } from "react";
import { ads, slotForSide, type AdSide } from "@/lib/ads";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/** Renders one side ad unit — parent handles mount timing and layout. */
export function AdRail({ side }: { side: AdSide }) {
  const slotId = slotForSide(side);
  const pushed = useRef(false);

  useEffect(() => {
    if (!slotId || pushed.current) return;

    const pushAd = () => {
      if (pushed.current) return;
      pushed.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        /* blocked */
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
    }, 300);
    const timeout = window.setTimeout(() => window.clearInterval(interval), 10000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [slotId]);

  if (!ads.enabled || !slotId || !ads.clientId) return null;

  return (
    <aside className="ad-rail w-[160px] shrink-0" aria-label="Advertisement">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-widest text-muted">
        Ad
      </p>
      <div className="overflow-hidden rounded-lg border border-border bg-surface-2/40">
        <ins
          className="adsbygoogle block"
          style={{ display: "block", width: 160, minHeight: 600 }}
          data-ad-client={ads.clientId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="false"
        />
      </div>
    </aside>
  );
}
