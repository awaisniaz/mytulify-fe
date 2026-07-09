import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Cropped logo aspect (width / height). */
const LOGO_W = 568;
const LOGO_H = 630;

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
  const logoWidth = Math.round(logoHeight * (LOGO_W / LOGO_H));

  return (
    <Link
      href="/"
      className={cn(
        "flex items-center font-extrabold tracking-tight",
        gap === "tight" ? "gap-0.5" : "gap-1.5",
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt={`${site.name} logo`}
        width={logoWidth}
        height={logoHeight}
        priority
        className="w-auto shrink-0 object-contain"
        style={{ height: logoHeight, width: "auto", maxHeight: logoHeight }}
      />
      {showName ? (
        <span className={cn("text-base leading-none sm:text-lg", nameClassName)}>{site.name}</span>
      ) : null}
    </Link>
  );
}
