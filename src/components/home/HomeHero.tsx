import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS, featuredTools, toolHref } from "@/lib/catalog";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getMessaging, categoryLabelFrom } from "@/i18n/messaging";
import { getContent, localizeTool } from "@/i18n/content";

const HERO_CATS = CATEGORIES.slice(0, 6);
const QUICK_TOOLS = featuredTools(8);

export async function HomeHero() {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const messaging = await getMessaging(locale);
  const content = await getContent(locale);

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
              <span className="text-brand">{t.home.heroEverything}</span> {t.home.heroYouDo}
            </h1>

            <p className="mt-3 text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {TOTAL_TOOLS}+ free tools — and growing
            </p>

            <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
              {messaging.heroSubtitle}
            </p>

            <form
              action="/tools"
              method="get"
              className="input-glow mt-7 flex items-center gap-2 rounded-2xl border-2 border-border bg-surface p-2 shadow-sm"
            >
              <Icon name="Search" className="ms-2 h-5 w-5 shrink-0 text-muted" />
              <input
                name="q"
                type="search"
                placeholder={t.home.searchPlaceholder(TOTAL_TOOLS)}
                className="h-12 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="h-12 shrink-0 rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg transition-colors hover:bg-brand-2"
              >
                {t.home.go}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {featuredTools(4).map((tool) => {
                const label = localizeTool(content, tool);
                return (
                  <Link key={toolHref(tool)} href={toolHref(tool)} prefetch={false} className="pill text-xs">
                    {label.name}
                  </Link>
                );
              })}
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
                      {categoryLabelFrom(t, c.slug, c.name)}
                    </p>
                    {i === 0 && (
                      <p className="mt-1 text-sm text-white/75">{t.home.toolsInCategory(c.tools.length)}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-surface py-3">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-2 px-4 sm:px-6">
          {QUICK_TOOLS.map((tool) => {
            const label = localizeTool(content, tool);
            return (
              <Link
                key={toolHref(tool)}
                href={toolHref(tool)}
                prefetch={false}
                className="pill text-xs"
              >
                {label.name}
              </Link>
            );
          })}
          <Link href="/tools" prefetch={false} className="pill text-xs font-semibold text-brand">
            {t.home.allToolsArrow}
          </Link>
        </div>
      </div>
    </>
  );
}
