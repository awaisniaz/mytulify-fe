import Link from "next/link";
import type { Category, Tool } from "@/lib/catalog";
import { toolHref } from "@/lib/catalog";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function ToolCard({ tool, icon, accent }: { tool: Tool; icon?: string; accent?: string }) {
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
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand">
          <Icon name={icon ?? "Wrench"} className="h-4 w-4" />
        </span>
        {tool.searchVolume === "high" && (
          <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand">
            Hot
          </span>
        )}
      </div>
      <div className="pl-2">
        <h3 className="font-semibold leading-snug group-hover:text-brand">{tool.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{tool.description}</p>
      </div>
    </Link>
  );
}

export function CategoryCard({ category, featured }: { category: Category; featured?: boolean }) {
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
            <h3 className="text-xl font-bold">{category.name}</h3>
            <p className="mt-1 text-sm text-white/80">{category.tagline}</p>
            <p className="mt-2 text-xs font-semibold text-white/70">{category.tools.length} tools →</p>
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
        <h3 className="font-semibold group-hover:text-brand">{category.name}</h3>
        <p className="mt-0.5 truncate text-sm text-muted">{category.tagline}</p>
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
