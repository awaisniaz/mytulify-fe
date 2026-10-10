import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates, publicRobots } from "@/lib/seo";
import { Icon } from "@/components/ui/Icon";
import { getMetadataLocale } from "@/i18n/locale";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const title = `About ${site.name}`;
  const description = `${site.name} brings together ${TOTAL_TOOLS}+ free calculators for money, health, home projects, school, and everyday decisions.`;
  return {
    title,
    description,
    ...pageAlternates("/about", locale),
    robots: publicRobots(locale),
    ...socialMeta({ title, description, url: "/about", locale }),
  };
}

export default async function AboutPage() {
  const cards = [
    { icon: "Zap", title: "Useful answers, quickly", body: "Enter the numbers you already have and see a result as you work." },
    { icon: "Lock", title: "Made for everyday use", body: "Calculators work in your browser without asking you to create an account." },
    { icon: "Layers", title: "Easy to explore", body: `Browse ${TOTAL_TOOLS}+ calculators grouped into ${CATEGORIES.length} clear collections.` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-brand/15 bg-gradient-to-br from-brand/10 via-surface to-cyan-500/10 p-7 sm:p-12">
        <div aria-hidden className="absolute -end-10 -top-12 h-56 w-56 rounded-full bg-brand/10 blur-3xl" />
        <p className="section-label mb-3">About us</p>
        <h1 className="relative max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
          Numbers are easier when the right calculator is close.
        </h1>
        <p className="relative mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {site.name} brings practical calculators together in one place, from loan payments and percentages to
          health estimates and home project planning.
        </p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          [String(TOTAL_TOOLS), "calculators", "Calculator"],
          [String(CATEGORIES.length), "collections", "LayoutGrid"],
          ["Free", "to use", "Heart"],
        ].map(([value, label, icon]) => (
          <div key={label} className="rounded-2xl border border-border bg-surface p-5 text-center shadow-sm">
            <Icon name={icon} className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={card.icon} className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-bold">{card.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{card.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-extrabold">A growing collection of calculators</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted">
          Calculator Bazaar organizes its collection around common needs: financial planning, health and fitness,
          and home or trade projects. Each calculator explains what its inputs mean and how to read the result.
          Estimates are a useful starting point; always check important decisions against the rules, rates, or
          professional guidance that apply to you.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/${category.slug}`}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold transition-colors hover:border-brand/40 hover:text-brand"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/tools" className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-bold text-brand-fg transition-colors hover:bg-brand-2">
          Browse calculators <Icon name="ArrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
