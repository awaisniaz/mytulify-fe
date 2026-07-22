import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getCategory, isToolAvailable } from "@/lib/catalog";
import { ToolCard } from "@/components/cards";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates, clampMetaDescription } from "@/lib/seo";
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
    robots: { index: true, follow: true },
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">{s.home}</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <span className="text-foreground">{catLabel.name}</span>
      </nav>

      <div className="mb-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white sm:h-16 sm:w-16", c.gradient)}>
            <Icon name={c.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <div>
            <p className="section-label mb-1">{s.category}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{catLabel.name}</h1>
            <p className="mt-2 max-w-2xl text-muted">{catLabel.description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Icon name="Wrench" className="h-4 w-4" />
              {s.toolsCount.replace("{n}", String(c.tools.length))}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {c.tools.map((t) => (
          <ToolCard
            key={t.slug}
            tool={t}
            accent={c.gradient}
            label={localizeTool(content, t)}
            hotLabel={s.hot}
            comingSoonLabel={s.comingSoon}
          />
        ))}
      </div>

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
