import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS } from "@/lib/catalog";
import { CompactToolLink } from "@/components/cards";
import { CategoryArtFade } from "@/components/CategoryArtFade";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getContent, localizeCategory, localizeTool } from "@/i18n/content";

export async function HomeCatalog() {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const content = await getContent(locale);
  const comingSoonLabel = content.strings.comingSoon;

  const categories = CATEGORIES.map((category) => ({
    slug: category.slug,
    icon: category.icon,
    gradient: category.gradient,
    labels: localizeCategory(content, category.slug, {
      name: category.name,
      description: category.description,
      tagline: category.tagline,
    }),
    tools: category.tools.map((tool) => ({
      tool,
      label: localizeTool(content, tool),
    })),
  }));

  return (
    <>
      <nav
        aria-label={t.nav.categories}
        className="sticky top-14 z-40 border-b border-border bg-surface/95 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand hover:text-brand"
            >
              <span className={cn("grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br text-white", c.gradient)}>
                <Icon name={c.icon} className="h-3 w-3" />
              </span>
              {c.labels.name}
            </a>
          ))}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="section-label mb-1.5">{t.home.explore}</p>
            <p className="text-xl font-extrabold tracking-tight sm:text-3xl">{t.home.pickCategory}</p>
            <p className="mt-1.5 text-sm text-muted sm:text-base">{t.home.pickCategorySub(TOTAL_TOOLS)}</p>
          </div>
          <Link href="/tools" className="inline-flex items-center gap-1 text-sm font-bold text-brand hover:underline">
            {t.home.seeAll} <Icon name="ArrowRight" className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {categories.map((c) => (
            <section
              key={c.slug}
              id={c.slug}
              className="relative scroll-mt-28 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm sm:rounded-3xl sm:p-6"
            >
              <CategoryArtFade slug={c.slug} variant="banner" />
              <div className="relative z-10 mb-4 flex flex-col gap-3 border-b border-border/70 pb-4 sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl",
                      c.gradient,
                    )}
                  >
                    <Icon name={c.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 max-w-[72%]">
                    <h2 className="truncate text-lg font-extrabold tracking-tight sm:text-xl">{c.labels.name}</h2>
                    <p className="mt-0.5 truncate text-sm text-muted">{c.labels.tagline}</p>
                  </div>
                </div>
                <Link
                  href={`/${c.slug}`}
                  prefetch={false}
                  className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border bg-surface-2/90 px-3 py-1.5 text-xs font-bold text-muted backdrop-blur-sm transition-colors hover:border-brand/40 hover:bg-brand/10 hover:text-brand sm:self-auto"
                >
                  {t.home.toolsInCategory(c.tools.length)}
                  <Icon name="ArrowRight" className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="relative z-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {c.tools.map(({ tool, label }) => (
                  <CompactToolLink
                    key={tool.slug}
                    tool={tool}
                    label={label}
                    comingSoonLabel={comingSoonLabel}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
