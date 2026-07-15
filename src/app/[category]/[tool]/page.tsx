import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AVAILABLE_TOOLS, getCategory, getTool, getToolIcon, getToolIconPresentation, TOOL_BADGE_BG, isToolAvailable, relatedTools, toolHref, type Tool } from "@/lib/catalog";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { ComingSoon } from "@/components/tools/reg/_util";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { socialMeta } from "@/lib/seo";
import { getLocale } from "@/i18n/locale";
import {
  buildFaq, getContent, localizeCategory, localizeTool, toolAboutParagraphs, toolMeta,
} from "@/i18n/content";

export function generateStaticParams() {
  // Indexable + live tool routes only (coming-soon stay reachable but are not SSG'd for crawl).
  return AVAILABLE_TOOLS.map((t) => ({ category: t.category!, tool: t.slug }));
}

function resolveRelated(keys: string[] | undefined, tool: Tool, limit = 4): Tool[] {
  if (!keys?.length) return relatedTools(tool, limit);
  const resolved = keys
    .map((key) => {
      const [category, slug] = key.split("/");
      return category && slug ? getTool(category, slug) : undefined;
    })
    .filter((item): item is Tool => item != null && item.slug !== tool.slug && isToolAvailable(item));
  if (resolved.length >= Math.min(2, limit)) return resolved.slice(0, limit);
  const fallback = relatedTools(tool, limit);
  const seen = new Set(resolved.map((t) => `${t.category}/${t.slug}`));
  for (const t of fallback) {
    if (resolved.length >= limit) break;
    const key = `${t.category}/${t.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    resolved.push(t);
  }
  return resolved.slice(0, limit);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; tool: string }>;
}): Promise<Metadata> {
  const { category, tool } = await params;
  const t = getTool(category, tool);
  if (!t) return {};
  const locale = await getLocale();
  const content = await getContent(locale);
  const label = localizeTool(content, t);
  const meta = toolMeta(content, label, t.clientSide);
  return {
    title: meta.absolute ? { absolute: meta.title } : meta.title,
    description: meta.description,
    alternates: { canonical: toolHref(t) },
    ...socialMeta({
      title: meta.absolute ? meta.title : `${label.name} · ${site.name}`,
      description: meta.description,
      url: toolHref(t),
    }),
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ category: string; tool: string }>;
}) {
  const { category, tool } = await params;
  const t = getTool(category, tool);
  if (!t) notFound();
  const cat = getCategory(category)!;
  const locale = await getLocale();
  const content = await getContent(locale);
  const label = localizeTool(content, t);
  const catLabel = localizeCategory(content, cat.slug, {
    name: cat.name,
    description: cat.description,
    tagline: cat.tagline,
  });
  const related = resolveRelated(label.related, t, 4);
  const faq = buildFaq(content, label, t.clientSide);
  const about = toolAboutParagraphs(content, label, t.clientSide);
  const present = getToolIconPresentation(t);
  const s = content.strings;
  const perDay = s.perDayFree.replace("{limit}", String(FREE_AI_DAILY_LIMIT));
  const available = isToolAvailable(t);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: label.name,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (Web)",
      description: label.description,
      url: `${site.url}${toolHref(t)}`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: t.clientSide
          ? "Free plan — unlimited browser use"
          : `Free plan — ${FREE_AI_DAILY_LIMIT} AI runs per day; Pro for unlimited`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: s.home, item: site.url },
        { "@type": "ListItem", position: 2, name: catLabel.name, item: `${site.url}/${cat.slug}` },
        { "@type": "ListItem", position: 3, name: label.name, item: `${site.url}${toolHref(t)}` },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">{s.home}</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <Link href={`/${cat.slug}`} className="hover:text-foreground">{catLabel.name}</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <span className="text-foreground">{label.name}</span>
      </nav>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "relative grid h-14 w-14 shrink-0 place-items-center rounded-xl ring-1",
              present.bg,
              present.ring,
            )}
            title={present.badge}
          >
            <Icon name={getToolIcon(t)} className={cn("h-6 w-6", present.fg)} />
            <span className={cn("absolute -bottom-1 -right-1 rounded px-1 text-[9px] font-bold leading-tight text-white", TOOL_BADGE_BG[present.badge] ?? "bg-orange-500")}>
              {present.badge}
            </span>
          </span>
          <div>
            <p className="section-label mb-1">{catLabel.name}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{label.name}</h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">{label.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
            {t.clientSide ? (
              <>
                <Badge tone="green"><Icon name="Lock" className="mr-1 h-3 w-3" /> {s.private}</Badge>
                <Badge tone="brand"><Icon name="Zap" className="mr-1 h-3 w-3" /> {s.instant}</Badge>
              </>
            ) : (
              <>
                <Badge tone="brand"><Icon name="Sparkles" className="mr-1 h-3 w-3" /> {s.aiPowered}</Badge>
                {available ? (
                  <Badge tone="amber"><Icon name="Zap" className="mr-1 h-3 w-3" /> {perDay}</Badge>
                ) : (
                  <Badge tone="amber"><Icon name="Sparkles" className="mr-1 h-3 w-3" /> {s.comingSoon}</Badge>
                )}
              </>
            )}
            {t.searchVolume === "high" && <Badge tone="amber"><Icon name="Zap" className="mr-1 h-3 w-3" /> {s.popular}</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="tool-panel mt-8 shadow-sm">
        {available ? (
          <ToolRenderer category={cat.slug} slug={t.slug} />
        ) : (
          <ComingSoon
            badge={s.comingSoon}
            title={s.comingSoonTitle}
            description={s.comingSoonBody}
          />
        )}
      </div>

      <section className="mt-12 prose-tool">
        <h2 className="text-xl font-bold">{s.aboutTool.replace("{name}", label.name)}</h2>
        <div className="mt-3 space-y-3 text-muted">
          {about.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="leading-relaxed">{paragraph}</p>
          ))}
        </div>
        {label.howTo && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-foreground">{label.howTo.title}</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
              {label.howTo.steps.map((step) => (
                <li key={step.slice(0, 48)} className="leading-relaxed">{step}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">{s.faqTitle}</h2>
        <div className="mt-4 space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="faq-item group rounded-xl border border-border bg-surface">
              <summary className="flex cursor-pointer items-center justify-between p-4 font-medium transition-colors hover:text-brand">
                {f.q}
                <Icon name="ChevronDown" className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="border-t border-border px-4 pb-4 pt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">{s.relatedTools.replace("{category}", catLabel.name.toLowerCase())}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => {
              const rLabel = localizeTool(content, r);
              return (
                <Link
                  key={`${r.category}/${r.slug}`}
                  href={toolHref(r)}
                  className="interactive-card flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon name={getToolIcon(r)} className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium">{rLabel.name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
