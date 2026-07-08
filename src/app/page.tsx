import Link from "next/link";
import { CATEGORIES, featuredTools, TOTAL_TOOLS, getCategory } from "@/lib/catalog";
import { messaging } from "@/lib/messaging";
import { CategoryCard, SectionHeader, ToolCard } from "@/components/cards";
import { HomeHero } from "@/components/home/HomeHero";
import { Icon } from "@/components/ui/Icon";

export default function Home() {
  const featured = featuredTools(12);
  const [big1, big2, ...rest] = CATEGORIES;

  return (
    <>
      <HomeHero />

      <section className="content-auto mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <SectionHeader
          label="Explore"
          title="Pick a category"
          subtitle={`${TOTAL_TOOLS}+ tools, organized for you.`}
          href="/tools"
          linkText="See all"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {big1 && (
            <div className="sm:col-span-2 lg:row-span-2">
              <CategoryCard category={big1} featured />
            </div>
          )}
          {big2 && (
            <div className="sm:col-span-2 lg:row-span-2">
              <CategoryCard category={big2} featured />
            </div>
          )}
          {rest.map((c) => (
            <CategoryCard key={c.slug} category={c} />
          ))}
        </div>
      </section>

      <section className="content-auto border-y border-border bg-surface-2/60 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader label="Trending" title="Most popular right now" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((t) => {
              const cat = getCategory(t.category!);
              return (
                <ToolCard key={`${t.category}/${t.slug}`} tool={t} icon={cat?.icon} accent={cat?.gradient} />
              );
            })}
          </div>
        </div>
      </section>

      <section className="content-auto mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Lock", "Private", "Runs in your browser"],
            ["Zap", "Instant", "No waiting around"],
            ["Globe", "Online", "Works everywhere"],
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
          <h2 className="text-3xl font-extrabold sm:text-4xl">Start using tools now</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            {messaging.homeCtaSubtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-lg"
            >
              Browse all tools
              <Icon name="ArrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white"
            >
              Search all tools
              <Icon name="Search" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
