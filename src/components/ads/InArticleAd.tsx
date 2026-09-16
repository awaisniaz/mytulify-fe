"use client";

import { usePathname } from "next/navigation";
import { ads } from "@/lib/ads";
import { AdFrame, AdIns } from "@/components/ads/AdUnit";
import { cn } from "@/lib/utils";

/** In-article / fluid unit (slot 8819849163). Mounted once per page. */
export function InArticleAd({ className }: { className?: string }) {
  const path = usePathname();
  if (!ads.inArticleSlot) return null;

  return (
    <AdFrame className={cn("ad-in-article min-h-[90px]", className)}>
      <AdIns
        key={path}
        slot={ads.inArticleSlot}
        format="fluid"
        layout="in-article"
        textAlign="center"
      />
    </AdFrame>
  );
}
