import Link from "next/link";
import type { Category, Tool } from "@/lib/catalog";
import { toolHref, getToolIcon, getToolIconPresentation, TOOL_BADGE_BG, isToolAvailable } from "@/lib/catalog";
import { categoryLabelFrom } from "@/i18n/messaging";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import type { LocalizedTool } from "@/i18n/content";
import { Icon } from "@/components/ui/Icon";
import { CategoryArtFade } from "@/components/CategoryArtFade";
import { cn } from "@/lib/utils";

const BADGE_BG = TOOL_BADGE_BG;

export function ToolCard({
  tool,
  icon,
  accent,
  label,
  hotLabel = "Hot",
  comingSoonLabel = "Coming soon",
}: {
  tool: Tool;
  icon?: string;
  accent?: string;
  label?: LocalizedTool;
  hotLabel?: string;
  comingSoonLabel?: string;
}) {
  const toolIcon = icon ?? getToolIcon(tool);
  const present = getToolIconPresentation(tool);
  const name = label?.name ?? tool.name;
  const description = label?.description ?? tool.description;
  const soon = !isToolAvailable(tool);

  return (
    <Link
      href={toolHref(tool)}
      className="interactive-card group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4 pl-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b",
          accent ?? "from-brand to-brand-2",
        )}
      />
      <div className="flex items-start justify-between gap-2 pl-2">
        <span
          className={cn(
            "relative grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 transition-colors group-hover:ring-2",
            present.bg,
            present.ring,
          )}
          title={present.badge}
          aria-hidden
        >
          <Icon name={toolIcon} className={cn("h-5 w-5", present.fg)} />
          <span
            className={cn(
              "absolute -bottom-1 -right-1 rounded px-1 text-[8px] font-bold leading-tight text-white",
              BADGE_BG[present.badge] ?? "bg-orange-500",
            )}
          >
            {present.badge}
          </span>
        </span>
        {soon ? (
          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
            {comingSoonLabel}
          </span>
        ) : tool.searchVolume === "high" ? (
          <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
            {hotLabel}
          </span>
        ) : null}
      </div>
      <div className="pl-2">
        <h3 className="font-semibold leading-snug group-hover:text-brand">{name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{description}</p>
      </div>
    </Link>
  );
}

export function CategoryCard({
  category,
  featured,
  messages,
  categoryContent,
  toolsCountLabel,
}: {
  category: Category;
  featured?: boolean;
  locale?: Locale;
  messages?: Messages;
  categoryContent?: { name: string; description: string; tagline: string };
  toolsCountLabel?: (n: number) => string;
}) {
  const name =
    categoryContent?.name ??
    (messages ? categoryLabelFrom(messages, category.slug, category.name) : category.name);
  const tagline = categoryContent?.tagline ?? category.tagline;
  const countLabel = toolsCountLabel?.(category.tools.length) ?? `${category.tools.length} tools`;

  if (featured) {
    return (
      <Link
        href={`/${category.slug}`}
        className={cn(
          "group relative flex min-h-[168px] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-sm transition-transform sm:min-h-[188px] sm:p-6",
          "hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          category.gradient,
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -end-6 -top-8 h-28 w-28 rounded-full bg-white/15 blur-2xl transition-opacity group-hover:opacity-90"
        />
        <CategoryArtFade slug={category.slug} variant="hero" />
        <span className="relative z-10 grid h-11 w-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
          <Icon name={category.icon} className="h-5 w-5" />
        </span>
        <div className="relative z-10 max-w-[68%] sm:max-w-[70%]">
          <h3 className="text-lg font-bold leading-snug sm:text-xl">{name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/80">{tagline}</p>
          <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/85">
            {countLabel}
            <Icon name="ArrowRight" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${category.slug}`}
      className={cn(
        "group relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-3.5 sm:gap-4 sm:p-4",
        "transition-colors hover:border-brand/40 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <CategoryArtFade slug={category.slug} variant="row" />
      <span
        className={cn(
          "relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm sm:h-12 sm:w-12",
          category.gradient,
        )}
      >
        <Icon name={category.icon} className="h-5 w-5" />
      </span>
      <div className="relative z-10 min-w-0 flex-1 pr-1">
        <h3 className="truncate font-semibold leading-snug group-hover:text-brand">{name}</h3>
        <p className="mt-0.5 truncate text-sm text-muted">{tagline}</p>
      </div>
      <span className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand">
        {category.tools.length}
        <Icon name="ArrowRight" className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </span>
    </Link>
  );
}

/** Dense directory row used on the homepage catalog. */
export function CompactToolLink({
  tool,
  label,
  comingSoonLabel = "Coming soon",
}: {
  tool: Tool;
  label?: LocalizedTool;
  comingSoonLabel?: string;
}) {
  const toolIcon = getToolIcon(tool);
  const present = getToolIconPresentation(tool);
  const name = label?.name ?? tool.name;
  const description = label?.description ?? tool.description;
  const soon = !isToolAvailable(tool);

  return (
    <Link
      href={toolHref(tool)}
      prefetch={false}
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 transition-colors hover:border-brand/50 hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1", present.bg, present.ring)}
        aria-hidden
      >
        <Icon name={toolIcon} className={cn("h-4 w-4", present.fg)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold leading-tight group-hover:text-brand">{name}</span>
          {soon ? (
            <span className="shrink-0 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400">
              {comingSoonLabel}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">{description}</span>
      </span>
    </Link>
  );
}

export function SectionHeader({
  label,
  title,
  subtitle,
  href,
  linkText = "View all",
}: {
  label?: string;
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {label && <p className="section-label mb-1.5">{label}</p>}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
          {linkText} <Icon name="ArrowRight" className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
