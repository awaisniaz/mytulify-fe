"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAdFreePath, ads } from "@/lib/ads";
import { AdRail } from "@/components/ads/AdRail";
import { APP_EVENTS } from "@/lib/auth/config";
import { getProKey } from "@/lib/billing/client";

/**
 * Fixed side ads — does NOT wrap page content (avoids hydrating the whole tree).
 * Only mounts on xl+ after idle.
 */
export function SideAdsMount() {
  const path = usePathname();
  const [active, setActive] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1280px)").matches) return;
    if (isAdFreePath(path)) return;

    const syncPro = () => setIsPro(Boolean(getProKey()));
    syncPro();
    window.addEventListener(APP_EVENTS.proUpdated, syncPro);

    const start = () => {
      if (ads.enabled && ads.clientId && !document.getElementById("adsense-init")) {
        const script = document.createElement("script");
        script.id = "adsense-init";
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
      }
      setActive(true);
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 3500 });
    } else {
      timeoutId = setTimeout(start, 2500);
    }

    return () => {
      window.removeEventListener(APP_EVENTS.proUpdated, syncPro);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [path]);

  if (!active || isAdFreePath(path) || isPro) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-y-0 left-0 z-30 hidden w-[calc((100vw-1280px)/2)] min-w-[160px] max-w-[200px] xl:block">
        <div className="pointer-events-auto sticky top-[4.5rem] ml-auto w-[160px] pt-4 pr-2">
          <AdRail side="left" />
        </div>
      </div>
      <div className="pointer-events-none fixed inset-y-0 right-0 z-30 hidden w-[calc((100vw-1280px)/2)] min-w-[160px] max-w-[200px] xl:block">
        <div className="pointer-events-auto sticky top-[4.5rem] mr-auto w-[160px] pt-4 pl-2">
          <AdRail side="right" />
        </div>
      </div>
    </>
  );
}
