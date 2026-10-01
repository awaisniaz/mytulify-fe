/**
 * Renders a Lucide glyph from /icons.svg.
 * One shared sprite keeps tool icons out of the page HTML.
 */
export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const id = name || "Wrench";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? 24}
      height={size ?? 24}
      className={className}
      aria-hidden
    >
      <use href={`/icons.svg#${id}`} />
    </svg>
  );
}
