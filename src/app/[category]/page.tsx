import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CATEGORIES, getCategory } from "@/lib/catalog";
import { ToolCard } from "@/components/cards";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import { socialMeta } from "@/lib/seo";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const c = getCategory(category);
  if (!c) return {};
  const title = messaging.categoryTitle(c.name, c.tools.length);
  const description = messaging.categoryDescription(c.description, c.tools.length, c.name.toLowerCase());
  return {
    title,
    description,
    alternates: { canonical: `/${c.slug}` },
    ...socialMeta({ title: `${title} · ${site.name}`, description, url: `/${c.slug}` }),
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

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: c.name, item: `${site.url}/${c.slug}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: c.name,
      description: c.description,
      url: `${site.url}/${c.slug}`,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: c.tools.length,
        itemListElement: c.tools.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.name,
          url: `${site.url}/${c.slug}/${t.slug}`,
        })),
      },
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <span className="text-foreground">{c.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white sm:h-16 sm:w-16", c.gradient)}>
            <Icon name={c.icon} className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <div>
            <p className="section-label mb-1">Category</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{c.name}</h1>
            <p className="mt-2 max-w-2xl text-muted">{c.description}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted">
              <Icon name="Wrench" className="h-4 w-4" />
              {c.tools.length} tools
            </span>
          </div>
        </div>
      </div>

      {/* Tools grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {c.tools.map((t) => (
          <ToolCard key={t.slug} tool={t} icon={c.icon} />
        ))}
      </div>

      {/* Other categories */}
      <div className="mt-16">
        <h2 className="mb-4 text-lg font-semibold">Explore other categories</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((x) => x.slug !== c.slug).map((x) => (
            <Link
              key={x.slug}
              href={`/${x.slug}`}
              className="pill transition-all hover:scale-[1.02]"
            >
              <Icon name={x.icon} className="h-4 w-4 text-brand" /> {x.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
