import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ALL_TOOLS, getCategory, getTool, isToolAvailable, relatedTools, toolHref } from "@/lib/catalog";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { socialMeta } from "@/lib/seo";

export function generateStaticParams() {
  return ALL_TOOLS.map((t) => ({ category: t.category!, tool: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; tool: string }>;
}): Promise<Metadata> {
  const { category, tool } = await params;
  const t = getTool(category, tool);
  if (!t) return {};
  const title = messaging.toolMetaTitle(t.name);
  const desc = t.clientSide
    ? messaging.toolMetaClient(t.description)
    : messaging.toolMetaAi(t.description);
  const available = isToolAvailable(t);
  return {
    title,
    description: desc,
    alternates: { canonical: toolHref(t) },
    ...(available ? {} : { robots: { index: false, follow: true } }),
    ...socialMeta({
      title: `${t.name} · ${site.name}`,
      description: desc,
      url: toolHref(t),
    }),
  };
}

function faqFor(name: string, desc: string, clientSide: boolean) {
  return [
    {
      q: `Is the ${name} free to use?`,
      a: messaging.faqIsFree(name, clientSide),
    },
    clientSide
      ? {
          q: `Is my data safe with the ${name}?`,
          a: `Absolutely. ${name} runs entirely in your browser — your data is never uploaded to any server.`,
        }
      : {
          q: `How is my data handled by the ${name}?`,
          a: `${name} sends your input to our server, which securely calls an AI model to generate the result. We don't store your inputs — but avoid pasting secrets or sensitive data, and always review AI output before relying on it.`,
        },
    {
      q: `How does the ${name} work?`,
      a: clientSide
        ? `${desc} Just enter your input and the result is generated instantly on your device.`
        : `${desc} Enter your input and an AI model generates the result in a few seconds.`,
    },
  ];
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
  const related = relatedTools(t, 6);
  const faq = faqFor(t.name, t.description, t.clientSide);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: t.name,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (Web)",
      description: t.description,
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
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: cat.name, item: `${site.url}/${cat.slug}` },
        { "@type": "ListItem", position: 3, name: t.name, item: `${site.url}${toolHref(t)}` },
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

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <Link href={`/${cat.slug}`} className="hover:text-foreground">{cat.name}</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <span className="text-foreground">{t.name}</span>
      </nav>

      {/* Header */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", cat.gradient)}>
            <Icon name={cat.icon} className="h-6 w-6" />
          </span>
          <div>
            <p className="section-label mb-1">{cat.name}</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.name}</h1>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted">{t.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
            {t.clientSide ? (
              <>
                <Badge tone="green"><Icon name="Lock" className="mr-1 h-3 w-3" /> Private</Badge>
                <Badge tone="brand"><Icon name="Zap" className="mr-1 h-3 w-3" /> Instant</Badge>
              </>
            ) : (
              <>
                <Badge tone="brand"><Icon name="Sparkles" className="mr-1 h-3 w-3" /> AI-Powered</Badge>
                <Badge tone="amber"><Icon name="Zap" className="mr-1 h-3 w-3" /> {FREE_AI_DAILY_LIMIT}/day on Free</Badge>
              </>
            )}
            {t.searchVolume === "high" && <Badge tone="amber"><Icon name="Zap" className="mr-1 h-3 w-3" /> Popular</Badge>}
            </div>
          </div>
        </div>
      </div>

      {/* Tool */}
      <div className="tool-panel mt-8 shadow-sm">
        <ToolRenderer category={cat.slug} slug={t.slug} />
      </div>

      {/* About */}
      <section className="mt-12 prose-tool">
        <h2 className="text-xl font-bold">About the {t.name}</h2>
        <p className="mt-3 text-muted">
          {t.clientSide
            ? messaging.toolAboutClient(t.name, t.description)
            : messaging.toolAboutAi(t.name, t.description)}
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Frequently asked questions</h2>
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

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">Related {cat.name.toLowerCase()}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={toolHref(r)}
                className="interactive-card flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Icon name={cat.icon} className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{r.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
