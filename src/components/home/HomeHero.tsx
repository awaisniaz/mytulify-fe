import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS, AVAILABLE_TOOLS, toolHref, getToolIcon } from "@/lib/catalog";
import { Icon } from "@/components/ui/Icon";
import { getLocale } from "@/i18n/locale";
import { getContent, localizeCategory, localizeTool } from "@/i18n/content";
import { cn } from "@/lib/utils";

const QUICK_LINKS = ["loan-calculator", "bmi-calculator", "percentage-calculator", "mortgage-calculator"];

export async function HomeHero() {
  const locale = await getLocale();
  const content = await getContent(locale);
  const popular = QUICK_LINKS
    .map((slug) => AVAILABLE_TOOLS.find((tool) => tool.slug === slug))
    .filter((tool) => tool !== undefined);

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.13),_transparent_52%),linear-gradient(to_bottom,_var(--surface),_var(--background))]">
      <div aria-hidden className="pointer-events-none absolute -end-28 top-16 -z-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-brand/15 bg-brand/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-brand">
            <Icon name="Calculator" className="h-4 w-4" />
            Free calculators for everyday decisions
          </p>

          <h1 className="hero-lcp mt-6 max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem]">
            Good decisions start with <span className="text-brand">clear numbers.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Calculate payments, percentages, health goals, project materials, and more. Enter your numbers and get a useful answer in seconds.
          </p>

          <form
            action="/tools"
            method="get"
            className="input-glow mt-7 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-2 shadow-lg shadow-indigo-950/5 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
              <Icon name="Search" className="h-5 w-5 shrink-0 text-brand" />
              <input
                name="q"
                type="search"
                placeholder={`Search ${TOTAL_TOOLS}+ calculators…`}
                aria-label="Search calculators"
                className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
            </div>
            <button
              type="submit"
              className="h-12 rounded-xl bg-brand px-6 text-sm font-bold text-brand-fg transition-colors hover:bg-brand-2"
            >
              Find a calculator
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="me-1 font-semibold">Popular:</span>
            {popular.slice(0, 4).map((tool) => {
              const label = localizeTool(content, tool);
              return (
                <Link
                  key={tool.slug}
                  href={toolHref(tool)}
                  prefetch={false}
                  className="rounded-full border border-border bg-surface/80 px-3 py-1.5 font-medium transition-colors hover:border-brand/40 hover:text-brand"
                >
                  {label.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div aria-hidden className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand/15 via-transparent to-cyan-400/15 blur-xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface p-5 shadow-2xl shadow-slate-950/10 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand">Calculator Bazaar</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">Start with a popular pick</h2>
                <p className="mt-1 text-sm text-muted">Simple inputs. Clear results.</p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Icon name="Sparkles" className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 grid gap-2.5">
              {popular.map((tool, index) => {
                const label = localizeTool(content, tool);
                const category = CATEGORIES.find((item) => item.slug === tool.category);
                const categoryLabel = category
                  ? localizeCategory(content, category.slug, {
                      name: category.name,
                      description: category.description,
                      tagline: category.tagline,
                    }).name
                  : "Calculator";
                return (
                  <Link
                    key={tool.slug}
                    href={toolHref(tool)}
                    prefetch={false}
                    className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-background/70 p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:bg-brand/5 hover:shadow-md"
                  >
                    <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl text-brand", index % 2 ? "bg-cyan-500/10" : "bg-brand/10")}>
                      <Icon name={getToolIcon(tool)} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{label.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{categoryLabel}</span>
                    </span>
                    <Icon name="ArrowUpRight" className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-brand" />
                  </Link>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-2/70 px-4 py-3">
              <span className="text-sm font-semibold">Explore the full collection</span>
              <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
                {TOTAL_TOOLS}+ calculators <Icon name="ArrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
