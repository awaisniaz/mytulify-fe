import { cn } from "@/lib/utils";
import { categoryArtSrc, categoryArtExists } from "@/lib/catalog/category-art";

type ArtVariant = "tile" | "row" | "banner" | "hero";

/**
 * Category artwork fitted to the card (cover + right-anchored), fading left so text stays readable.
 */
export function CategoryArtFade({
  slug,
  className,
  opacity,
  variant = "row",
}: {
  slug: string;
  className?: string;
  opacity?: number;
  variant?: ArtVariant;
}) {
  if (!categoryArtExists(slug)) return null;

  const cfg = {
    tile: {
      box: "w-[58%] sm:w-[55%]",
      opacity: 0.72,
      mask: "linear-gradient(to left, #000 0%, #000 42%, transparent 100%)",
    },
    row: {
      box: "w-[46%] sm:w-[42%]",
      opacity: 0.55,
      mask: "linear-gradient(to left, #000 0%, #000 35%, transparent 95%)",
    },
    banner: {
      box: "w-[48%] sm:w-[44%]",
      opacity: 0.5,
      mask: "linear-gradient(to left, #000 0%, #000 30%, transparent 92%)",
    },
    hero: {
      box: "w-[62%] sm:w-[58%]",
      opacity: 0.78,
      mask: "linear-gradient(to left, #000 0%, #000 45%, transparent 100%)",
    },
  }[variant];

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 end-0 z-0 overflow-hidden",
        cfg.box,
        className,
      )}
      style={{
        WebkitMaskImage: cfg.mask,
        maskImage: cfg.mask,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local SVG art */}
      <img
        src={categoryArtSrc(slug)}
        alt=""
        className="h-full w-full object-cover object-right"
        style={{ opacity: opacity ?? cfg.opacity }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
