import type { Metadata } from "next";
import Link from "next/link";
import { offpage } from "@/lib/offpage";
import { site } from "@/lib/site";
import { CopySnippet } from "@/components/CopySnippet";
import { englishOnlyPageMeta } from "@/lib/seo";
import { getMetadataLocale } from "@/i18n/locale";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const title = "Link to Us";
  const description = `HTML badges, markdown links, and anchor text guidelines for linking to ${site.name} — help your readers find free online tools.`;
  return englishOnlyPageMeta("/link-to-us", locale, {
    title,
    description,
    socialTitle: `${title} · ${site.name}`,
  });
}

export default function LinkToUsPage() {
  const home = site.url;
  const utm = `${home}/?utm_source=partner&utm_medium=referral&utm_campaign=badge`;

  const textLink = `<a href="${home}" rel="noopener">${site.name} — free online tools</a>`;

  const markdown = `[${site.name}](${home}) — ${offpage.stats.tools}+ free PDF, image, SEO & developer tools`;

  const button = `<a href="${utm}" style="display:inline-block;padding:12px 20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:10px;text-decoration:none;font-family:system-ui,sans-serif;font-size:15px;font-weight:700">Explore ${offpage.stats.tools}+ free tools on ${site.name}</a>`;

  const logoLink = `<a href="${home}" rel="noopener"><img src="${offpage.logo}" alt="${site.name}" width="160" height="40" loading="lazy" /></a>`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Link to <span className="gradient-text">{site.name}</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          Use these snippets in blog posts, docs, newsletters, and resource pages. A followed link helps us grow — and gives your audience {offpage.stats.tools}+ useful free tools.
        </p>
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-bold">Copy &amp; paste snippets</h2>
        <CopySnippet label="Text link" code={textLink} />
        <CopySnippet label="Markdown" code={markdown} />
        <CopySnippet label="Button badge" code={button} />
        <CopySnippet label="Logo link" code={logoLink} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Preferred anchor text</h2>
        <p className="mt-2 text-sm text-muted">Mix these naturally — avoid exact-match spam.</p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {offpage.anchorTextSuggestions.map((a) => (
            <li key={a} className="rounded-full border border-border bg-surface px-3 py-1 text-sm">{a}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold">Link to a specific tool</h2>
        <p className="mt-2 text-sm text-muted">
          Every tool page includes share snippets at the bottom — HTML, Markdown, and social share buttons with the correct URL.
        </p>
        <Link href="/tools" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          Browse all tools →
        </Link>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
        <h2 className="text-base font-bold text-foreground">Guidelines</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Use a normal <code className="text-xs">&lt;a href&gt;</code> link — no cloaking or hidden links.</li>
          <li>Do not use iframes that hide attribution; text or logo links are preferred.</li>
          <li>UTM parameters are optional but help us thank top referrers.</li>
          <li>Questions? Email <a href={`mailto:${offpage.email}`} className="text-brand hover:underline">{offpage.email}</a></li>
        </ul>
      </section>

      <p className="mt-8 text-center text-sm text-muted">
        Press facts &amp; directory list → <Link href="/press" className="text-brand hover:underline">Media kit</Link>
      </p>
    </div>
  );
}
