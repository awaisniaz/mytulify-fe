import Link from "next/link";
import { Calculator } from "lucide-react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

type SiteLogoProps = {
  /** Logo height in px — width follows aspect ratio. */
  logoHeight?: number;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
  /** Gap between mark and wordmark. */
  gap?: "tight" | "normal";
};

/** Brand mark — transparent PNG from /public/logo.png */
export function SiteLogo({
  logoHeight = 30,
  showName = true,
  className,
  nameClassName,
  gap = "tight",
}: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center font-extrabold tracking-tight",
        gap === "tight" ? "gap-2" : "gap-3",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid shrink-0 place-items-center rounded-xl bg-brand text-brand-fg shadow-sm"
        style={{ height: logoHeight, width: logoHeight }}
      >
        <Calculator style={{ height: Math.round(logoHeight * 0.58), width: Math.round(logoHeight * 0.58) }} strokeWidth={2.2} />
      </span>
      {showName ? (
        <span className={cn("leading-none", nameClassName)}>
          <span className="block text-[0.68em] font-semibold uppercase tracking-[0.15em] text-muted">Calculator</span>
          <span className="mt-0.5 block">Bazaar</span>
        </span>
      ) : null}
    </Link>
  );
}
