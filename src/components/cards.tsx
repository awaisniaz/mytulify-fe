import Link from "next/link";
import type { Category, Tool } from "@/lib/catalog";
import { toolHref, getToolIcon, getToolIconPresentation, TOOL_BADGE_BG, isToolAvailable } from "@/lib/catalog";
import { categoryLabelFrom } from "@/i18n/messaging";
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";
import type { LocalizedTool } from "@/i18n/content";
import { Icon } from "@/components/ui/Icon";
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
        >
          <Icon name={toolIcon} className={cn("h-5 w-5", present.fg)} />
          <span className={cn("absolute -bottom-1 -right-1 rounded px-1 text-[8px] font-bold leading-tight text-white", BADGE_BG[present.badge] ?? "bg-orange-500")}>
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
  const name = categoryContent?.name ?? (messages ? categoryLabelFrom(messages, category.slug, category.name) : category.name);
  const tagline = categoryContent?.tagline ?? category.tagline;
  const countLabel = toolsCountLabel?.(category.tools.length) ?? `${category.tools.length} tools`;

  if (featured) {
    return (
      <Link
        href={`/${category.slug}`}
        className={cn(
          "tile interactive-card block min-h-[160px] bg-gradient-to-br p-6 text-white sm:min-h-[180px]",
          category.gradient,
        )}
      >
        <div className="relative z-10 flex h-full flex-col justify-between">
          <Icon name={category.icon} className="h-8 w-8" />
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <p className="mt-1 text-sm text-white/80">{tagline}</p>
            <p className="mt-2 text-xs font-semibold text-white/70">{countLabel} →</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/${category.slug}`}
      className="interactive-card group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm", category.gradient)}>
        <Icon name={category.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold group-hover:text-brand">{name}</h3>
        <p className="mt-0.5 truncate text-sm text-muted">{tagline}</p>
      </div>
      <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted">
        {category.tools.length}
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
