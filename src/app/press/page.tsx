import type { Metadata } from "next";
import Link from "next/link";
import { offpage, directoryTargets } from "@/lib/offpage";
import { site } from "@/lib/site";
import { CopySnippet } from "@/components/CopySnippet";
import { Icon } from "@/components/ui/Icon";
import { englishOnlyPageMeta } from "@/lib/seo";
import { getMetadataLocale } from "@/i18n/locale";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const title = "Press & Media Kit";
  const description = `Brand assets, boilerplate, and facts about ${site.name} — ${offpage.stats.tools}+ free online tools for press, partners, and directory listings.`;
  return englishOnlyPageMeta("/press", locale, {
    title,
    description,
    socialTitle: `${title} · ${site.name}`,
  });
}

export default function PressPage() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: offpage.legalName,
    url: offpage.url,
    logo: offpage.logo,
    description: offpage.boilerplate.medium,
    email: offpage.email,
    sameAs: offpage.sameAs,
    foundingDate: offpage.founded,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
        <p className="section-label mb-2">Off-page SEO · Entity signals</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Press &amp; <span className="gradient-text">Media Kit</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Copy-paste brand descriptions, logos, and facts for articles, directories, guest posts, and AI citation sources.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [String(offpage.stats.tools), "Free tools", "Wrench"],
          [String(offpage.stats.categories), "Categories", "LayoutGrid"],
          [String(offpage.stats.browserTools), "Browser-only", "Lock"],
        ].map(([val, label, icon]) => (
          <div key={label as string} className="glass rounded-2xl p-5 text-center">
            <Icon name={icon as string} className="mx-auto h-5 w-5 text-brand" />
            <div className="mt-2 text-2xl font-bold gradient-text">{val}</div>
            <div className="text-sm text-muted">{label as string}</div>
          </div>
        ))}
      </div>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-bold">Boilerplate copy</h2>
        <CopySnippet label="One sentence" code={offpage.boilerplate.short} />
        <CopySnippet label="Short paragraph" code={offpage.boilerplate.medium} />
        <CopySnippet label="Long paragraph (press releases)" code={offpage.boilerplate.long} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Brand assets</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li>
            <a href="/logo.png" className="text-brand hover:underline">Logo (PNG)</a>
          </li>
          <li>
            <a href="/og-share.png" className="text-brand hover:underline">Open Graph image (1200×630)</a>
          </li>
          <li>
            <span className="text-muted">Website: </span>
            <a href={site.url} className="text-brand hover:underline">{site.url}</a>
          </li>
          <li>
            <span className="text-muted">Contact: </span>
            <a href={`mailto:${offpage.email}`} className="text-brand hover:underline">{offpage.email}</a>
          </li>
          <li>
            <span className="text-muted">Twitter: </span>
            <a href={offpage.twitterUrl} className="text-brand hover:underline" target="_blank" rel="noreferrer">{offpage.twitter}</a>
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Directory &amp; launch checklist</h2>
        <p className="mt-2 text-sm text-muted">
          Submit {site.name} to these platforms for backlinks, brand mentions, and discovery. Use the boilerplate above — keep name and URL identical everywhere.
        </p>
        <ul className="mt-4 space-y-3">
          {directoryTargets.map((d) => (
            <li key={d.name} className="rounded-xl border border-border bg-surface p-4">
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
                {d.name} ↗
              </a>
              <p className="mt-1 text-sm text-muted">{d.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-brand/20 bg-brand/5 p-6">
        <h2 className="text-lg font-bold">For partners &amp; bloggers</h2>
        <p className="mt-2 text-sm text-muted">
          Link to individual tools or use our badges. See preferred anchor text and HTML snippets on the link page.
        </p>
        <Link href="/link-to-us" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          Link to us page <Icon name="ArrowRight" className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
