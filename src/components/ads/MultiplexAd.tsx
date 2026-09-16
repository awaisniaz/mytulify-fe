"use client";

import { usePathname } from "next/navigation";
import { ads } from "@/lib/ads";
import { AdFrame, AdIns } from "@/components/ads/AdUnit";
import { cn } from "@/lib/utils";

/** Multiplex / autorelaxed unit (slot 5539079700). Mounted once per page. */
export function MultiplexAd({ className }: { className?: string }) {
  const path = usePathname();
  if (!ads.multiplexSlot) return null;

  return (
    <AdFrame className={cn("ad-multiplex min-h-[120px]", className)}>
      <AdIns key={path} slot={ads.multiplexSlot} format="autorelaxed" />
    </AdFrame>
  );
}
