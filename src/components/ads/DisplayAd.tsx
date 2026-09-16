"use client";

import { usePathname } from "next/navigation";
import { ads } from "@/lib/ads";
import { AdFrame, AdIns } from "@/components/ads/AdUnit";
import { cn } from "@/lib/utils";

/** Responsive display unit (slot 8994099823). Not inside tool workspaces. */
export function DisplayAd({ className }: { className?: string }) {
  const path = usePathname();
  if (!ads.displaySlot) return null;

  return (
    <AdFrame className={cn("ad-display min-h-[90px]", className)}>
      <AdIns
        key={path}
        slot={ads.displaySlot}
        format="auto"
        fullWidthResponsive
      />
    </AdFrame>
  );
}
