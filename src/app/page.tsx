import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, featuredTools, TOTAL_TOOLS, getCategory } from "@/lib/catalog";
import { CategoryCard, SectionHeader, ToolCard } from "@/components/cards";
import { HomeHero } from "@/components/home/HomeHero";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates } from "@/lib/seo";
import { getLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getMessaging } from "@/i18n/messaging";
import { getContent, localizeCategory, localizeTool } from "@/i18n/content";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messaging = await getMessaging(locale);
  const title = `${site.name} — ${messaging.tagline}`;
  return {
    title: { absolute: title },
    description: messaging.siteDescription,
    ...pageAlternates("/", locale),
    robots: { index: true, follow: true },
    ...socialMeta({
      title,
      description: messaging.siteDescription,
      url: "/",
      locale,
    }),
  };
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const messaging = await getMessaging(locale);
  const content = await getContent(locale);
  const featured = featuredTools(12);
  const [big1, big2, ...rest] = CATEGORIES;
  const toolsCount = (n: number) => t.home.toolsInCategory(n);

  return (
    <>
      <HomeHero />

      <section className="content-auto mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeader
          label={t.home.explore}
          title={t.home.pickCategory}
          subtitle={t.home.pickCategorySub(TOTAL_TOOLS)}
          href="/tools"
          linkText={t.home.seeAll}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {big1 && (
            <div className="sm:col-span-2 lg:row-span-2">
              <CategoryCard
                category={big1}
                featured
                categoryContent={localizeCategory(content, big1.slug, { name: big1.name, description: big1.description, tagline: big1.tagline })}
                toolsCountLabel={toolsCount}
              />
            </div>
          )}
          {big2 && (
            <div className="sm:col-span-2 lg:row-span-2">
              <CategoryCard
                category={big2}
                featured
                categoryContent={localizeCategory(content, big2.slug, { name: big2.name, description: big2.description, tagline: big2.tagline })}
                toolsCountLabel={toolsCount}
              />
            </div>
          )}
          {rest.map((c) => (
            <CategoryCard
              key={c.slug}
              category={c}
              categoryContent={localizeCategory(content, c.slug, { name: c.name, description: c.description, tagline: c.tagline })}
            />
          ))}
        </div>
      </section>

      <section className="content-auto border-y border-border bg-surface-2/60 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader label={t.home.trending} title={t.home.trendingTitle} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((tool) => {
              const cat = getCategory(tool.category!);
              return (
                <ToolCard
                  key={`${tool.category}/${tool.slug}`}
                  tool={tool}
                  accent={cat?.gradient}
                  label={localizeTool(content, tool)}
                  hotLabel={content.strings.hot}
                  comingSoonLabel={content.strings.comingSoon}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="content-auto mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Lock", t.home.valuePrivate, t.home.valuePrivateDesc],
            ["Zap", t.home.valueInstant, t.home.valueInstantDesc],
            ["Globe", t.home.valueOnline, t.home.valueOnlineDesc],
            ["Heart", messaging.homeValueFreeTitle, messaging.homeValueFreeDesc],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="rounded-2xl border border-border bg-surface p-5 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand">
                <Icon name={icon as string} className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-bold">{title as string}</h3>
              <p className="mt-0.5 text-sm text-muted">{desc as string}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-orange-500 to-amber-500 px-8 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            {messaging.homeCtaSubtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-lg"
            >
              {t.home.browseAll}
              <Icon name="ArrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white"
            >
              {t.home.searchAll}
              <Icon name="Search" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
