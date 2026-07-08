import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS, featuredTools, toolHref } from "@/lib/catalog";
import { messaging } from "@/lib/messaging";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const HERO_CATS = CATEGORIES.slice(0, 6);
const QUICK_TOOLS = featuredTools(8);

/** Server-rendered hero — no client JS required for LCP. */
export function HomeHero() {
  return (
    <>
      <section className="overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              {messaging.heroBadge}
            </div>

            <h1 className="hero-lcp mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
              {messaging.heroTitleLead}
              <br />
              <span className="text-brand">everything</span> you do.
            </h1>

            <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
              {messaging.heroSubtitle}
            </p>

            <form
              action="/tools"
              method="get"
              className="input-glow mt-7 flex items-center gap-2 rounded-2xl border-2 border-border bg-surface p-2 shadow-sm"
            >
              <Icon name="Search" className="ml-2 h-5 w-5 shrink-0 text-muted" />
              <input
                name="q"
                type="search"
                placeholder={`Search ${TOTAL_TOOLS}+ tools…`}
                className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg transition-colors hover:bg-brand-2"
              >
                Go
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {featuredTools(4).map((t) => (
                <Link key={toolHref(t)} href={toolHref(t)} prefetch={false} className="pill text-xs">
                  {t.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden grid-cols-3 gap-2.5 sm:gap-3 lg:grid">
            {HERO_CATS.map((c, i) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                prefetch={false}
                className={cn(
                  "tile group bg-gradient-to-br p-4 text-white",
                  c.gradient,
                  i === 0 && "col-span-2 row-span-2 min-h-[160px] sm:min-h-[200px]",
                  i !== 0 && "min-h-[90px] sm:min-h-[96px]",
                )}
              >
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <Icon name={c.icon} className={cn("opacity-90", i === 0 ? "h-8 w-8" : "h-5 w-5")} />
                  <div>
                    <p className={cn("font-bold leading-tight", i === 0 ? "text-lg sm:text-xl" : "text-xs sm:text-sm")}>
                      {c.name}
                    </p>
                    {i === 0 && (
                      <p className="mt-1 text-sm text-white/75">{c.tools.length} tools</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Static quick links — no infinite marquee (saves CPU / TBT) */}
      <div className="border-b border-border bg-surface py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-2 px-4 sm:px-6">
          {QUICK_TOOLS.map((t) => (
            <Link
              key={toolHref(t)}
              href={toolHref(t)}
              prefetch={false}
              className="pill text-xs"
            >
              {t.name}
            </Link>
          ))}
          <Link href="/tools" prefetch={false} className="pill text-xs font-semibold text-brand">
            All tools →
          </Link>
        </div>
      </div>
    </>
  );
}
