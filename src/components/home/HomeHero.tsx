import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS, featuredTools, toolHref, getToolIcon, getToolIconPresentation } from "@/lib/catalog";
import { Icon } from "@/components/ui/Icon";
import { CategoryArtFade } from "@/components/CategoryArtFade";
import { cn } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getMessaging, categoryLabelFrom } from "@/i18n/messaging";
import { getContent, localizeTool } from "@/i18n/content";

const HERO_CATS = CATEGORIES.slice(0, 6);

export async function HomeHero() {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const messaging = await getMessaging(locale);
  const content = await getContent(locale);
  const popular = featuredTools(5);

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute -end-24 -top-20 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -start-16 bottom-0 h-56 w-56 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-3 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-2 lg:items-center lg:py-16">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {messaging.heroBadge}
          </div>

          <h1 className="hero-lcp mt-4 text-[1.85rem] font-extrabold leading-[1.12] tracking-tight sm:mt-5 sm:text-5xl lg:text-[3.25rem]">
            {messaging.heroTitleLead}
            <br />
            <span className="text-brand">{t.home.heroEverything}</span> {t.home.heroYouDo}
          </h1>

          <p className="mt-3 text-base font-bold tracking-tight text-foreground sm:text-xl">
            {TOTAL_TOOLS}+ free tools — and growing
          </p>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {messaging.heroSubtitle}
          </p>

          <form
            action="/tools"
            method="get"
            className="input-glow mt-6 flex flex-col gap-2 rounded-2xl border-2 border-border bg-surface p-2 shadow-sm sm:mt-7 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Icon name="Search" className="ms-2 h-5 w-5 shrink-0 text-muted" />
              <input
                name="q"
                type="search"
                placeholder={t.home.searchPlaceholder(TOTAL_TOOLS)}
                className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:h-12"
              />
            </div>
            <button
              type="submit"
              className="h-11 w-full shrink-0 rounded-xl bg-brand px-5 text-sm font-bold text-brand-fg transition-colors hover:bg-brand-2 sm:h-12 sm:w-auto"
            >
              {t.home.go}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {popular.map((tool) => {
              const label = localizeTool(content, tool);
              const icon = getToolIcon(tool);
              const present = getToolIconPresentation(tool);
              return (
                <Link
                  key={toolHref(tool)}
                  href={toolHref(tool)}
                  prefetch={false}
                  className="pill inline-flex items-center gap-1.5 text-xs"
                >
                  <span className={cn("grid h-5 w-5 place-items-center rounded-md", present.bg)}>
                    <Icon name={icon} className={cn("h-3 w-3", present.fg)} />
                  </span>
                  {label.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:gap-3">
          {HERO_CATS.map((c, i) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className={cn(
                "tile group relative overflow-hidden bg-gradient-to-br p-3 text-white sm:p-4",
                c.gradient,
                i === 0 && "col-span-2 row-span-2 min-h-[120px] sm:min-h-[160px] lg:min-h-[200px]",
                i !== 0 && "min-h-[72px] sm:min-h-[90px] lg:min-h-[96px]",
                i > 3 && "hidden sm:block",
              )}
            >
              <CategoryArtFade slug={c.slug} opacity={0.8} className={i === 0 ? "w-[60%]" : "w-[50%]"} />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <Icon
                  name={c.icon}
                  className={cn("opacity-95 drop-shadow-sm", i === 0 ? "h-7 w-7 sm:h-8 sm:w-8" : "h-4 w-4 sm:h-5 sm:w-5")}
                />
                <div className="max-w-[72%]">
                  <p className={cn("font-bold leading-tight", i === 0 ? "text-base sm:text-lg lg:text-xl" : "text-xs sm:text-sm")}>
                    {categoryLabelFrom(t, c.slug, c.name)}
                  </p>
                  <p className={cn("text-white/75", i === 0 ? "mt-1 text-xs sm:text-sm" : "mt-0.5 text-[10px] sm:text-[11px]")}>
                    {t.home.toolsInCategory(c.tools.length)}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
