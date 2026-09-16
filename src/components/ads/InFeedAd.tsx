"use client";

import { usePathname } from "next/navigation";
import { ads } from "@/lib/ads";
import { AdFrame, AdIns } from "@/components/ads/AdUnit";
import { cn } from "@/lib/utils";

/** In-feed / fluid unit (slot 3104488051). Mounted once per page. */
export function InFeedAd({ className }: { className?: string }) {
  const path = usePathname();
  if (!ads.inFeedSlot) return null;

  return (
    <AdFrame className={cn("ad-infeed min-h-[100px]", className)}>
      <AdIns
        key={path}
        slot={ads.inFeedSlot}
        format="fluid"
        layoutKey={ads.inFeedLayoutKey}
      />
    </AdFrame>
  );
}
