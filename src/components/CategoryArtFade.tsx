import { cn } from "@/lib/utils";
import { categoryArtSrc, categoryArtExists } from "@/lib/catalog/category-art";

/**
 * Category-related artwork anchored to the right, fading out toward the left.
 * Uses object-contain so the full illustration fits the card height (no vertical crop).
 */
export function CategoryArtFade({
  slug,
  className,
  opacity = 0.95,
}: {
  slug: string;
  className?: string;
  opacity?: number;
}) {
  if (!categoryArtExists(slug)) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-y-0 end-0 z-0 flex w-[55%] min-w-[9rem] max-w-md items-center justify-end overflow-hidden sm:w-[50%]",
        className,
      )}
      style={{
        WebkitMaskImage: "linear-gradient(to left, #000 0%, #000 35%, transparent 100%)",
        maskImage: "linear-gradient(to left, #000 0%, #000 35%, transparent 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local SVG art, no optimization needed */}
      <img
        src={categoryArtSrc(slug)}
        alt=""
        className="h-full w-auto max-h-full max-w-none object-contain object-right"
        style={{ opacity }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
