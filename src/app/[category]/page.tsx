import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getCategory, isToolAvailable } from "@/lib/catalog";
import { toolDirectoryHtml } from "@/lib/catalog/directory-html";
import { DisplayAd } from "@/components/ads/DisplayAd";
import { CategoryArtFade } from "@/components/CategoryArtFade";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates, clampMetaDescription, publicRobots } from "@/lib/seo";
import { getLocale, getMetadataLocale } from "@/i18n/locale";
import { categoryMeta, getContent, localizeCategory, localizeTool } from "@/i18n/content";
import { categoryLabelFrom } from "@/i18n/messaging";
import { getMessages } from "@/i18n/messages";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  const locale = await getMetadataLocale(searchParams);
  const content = await getContent(locale);
  const catLabel = localizeCategory(content, c.slug, {
    name: c.name,
    description: c.description,
    tagline: c.tagline,
  });
  const meta = categoryMeta(content, catLabel.name, catLabel.description, c.tools.filter(isToolAvailable).length);
  const path = `/${c.slug}`;
  return {
    title: meta.title,
    description: clampMetaDescription(meta.description),
    ...pageAlternates(path, locale),
    robots: publicRobots(locale),
    ...socialMeta({ title: `${meta.title} · ${site.name}`, description: meta.description, url: path, locale }),
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) notFound();

  const locale = await getLocale();
  const content = await getContent(locale);
  const messages = await getMessages(locale);
  const catLabel = localizeCategory(content, c.slug, {
    name: c.name,
    description: c.description,
    tagline: c.tagline,
  });
  const s = content.strings;
  const listedTools = c.tools.filter(isToolAvailable);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: s.home, item: site.url },
        { "@type": "ListItem", position: 2, name: catLabel.name, item: `${site.url}/${c.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: catLabel.name,
      description: catLabel.description,
      url: `${site.url}/${c.slug}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: listedTools.length,
        itemListElement: listedTools.map((t, i) => {
          const label = localizeTool(content, t);
          return {
            "@type": "ListItem",
            position: i + 1,
            name: label.name,
            url: `${site.url}/${c.slug}/${t.slug}`,
          };
        }),
      },
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted sm:mb-6 sm:gap-1.5 sm:text-sm">
        <Link href="/" className="hover:text-foreground">{s.home}</Link>
        <Icon name="ChevronRight" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="truncate text-foreground">{catLabel.name}</span>
      </nav>

      <div className="relative mb-6 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm sm:mb-8 sm:p-8">
        <CategoryArtFade slug={c.slug} variant="banner" />
        <div className="relative z-10 flex items-start gap-3 sm:gap-4">
          <span
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl",
              c.gradient,
            )}
          >
            <Icon name={c.icon} className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>
          <div className="min-w-0 max-w-[68%] sm:max-w-[72%]">
            <p className="section-label mb-1">{s.category}</p>
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{catLabel.name}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{catLabel.description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted sm:text-sm">
              <Icon name="Wrench" className="h-3.5 w-3.5" />
              {s.toolsCount.replace("{n}", String(c.tools.length))}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <DisplayAd />
      </div>

      {locale === "en" && (
        <section className="mb-8 max-w-3xl space-y-3 text-sm leading-relaxed text-muted sm:text-base">
          <h2 className="text-xl font-bold text-foreground">How to use these {catLabel.name}</h2>
          <p>
            {catLabel.name} is a set of {listedTools.length} free online tools. {catLabel.description} Each link below
            opens a page with the form, a short explanation of the inputs, and answers to the questions people ask
            before they rely on a result.
          </p>
          <p>
            Start with the name that matches the job: {listedTools.slice(0, 14).map((t) => localizeTool(content, t).name).join(", ")}
            {listedTools.length > 14 ? `, plus ${listedTools.length - 14} more in this same list` : ""}. Read the
            description under the name. If it describes the number, file, or text you already have, open that tool and
            enter those values. The result stays on the page so you can change one input and compare.
          </p>
          <p>
            Browser tools run on your device and do not need an account. Where a tool sends work to a server, the page
            says so next to the form. Treat every result as an estimate you can check: units, rates, and file settings
            are only as accurate as what you type in.
          </p>
        </section>
      )}

      <div
        className="tool-grid"
        dangerouslySetInnerHTML={{
          __html: toolDirectoryHtml(
            c.tools.map((t) => {
              const label = localizeTool(content, t);
              return { tool: t, name: label.name, description: label.description, soonLabel: s.comingSoon };
            }),
          ),
        }}
      />

      <div className="mt-16">
        <h2 className="mb-4 text-lg font-semibold">{s.exploreOther}</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => (
            <Link
              key={x.slug}
              href={`/${x.slug}`}
              className="pill transition-all hover:scale-[1.02]"
            >
              <Icon name={x.icon} className="h-4 w-4 text-brand" /> {categoryLabelFrom(messages, x.slug, x.name)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
