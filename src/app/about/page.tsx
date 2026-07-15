import type { Metadata } from "next";
import Link from "next/link";
import { TOTAL_CATEGORIES, TOTAL_AI_OCR_TOOLS, TOTAL_BROWSER_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { getLocale } from "@/i18n/locale";
import { getContent } from "@/i18n/content";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const content = await getContent(locale);
  const intro = content.strings.aboutPage.intro
    .replace("{total}", String(TOTAL_TOOLS))
    .replace("{client}", String(TOTAL_BROWSER_TOOLS));
  return {
    title: content.strings.aboutPage.title,
    description: `Learn about ${site.name} — ${intro}`,
    alternates: { canonical: "/about" },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const content = await getContent(locale);
  const a = content.strings.aboutPage;

  const intro = a.intro
    .replace("{total}", String(TOTAL_TOOLS))
    .replace("{client}", String(TOTAL_BROWSER_TOOLS));

  const sections = [
    {
      icon: "Zap",
      title: a.offerTitle,
      body: a.offerBody.replace("{cats}", String(TOTAL_CATEGORIES)),
    },
    {
      icon: "Lock",
      title: a.privacyTitle,
      body: a.privacyBody.replace("{client}", String(TOTAL_BROWSER_TOOLS)).replace("{total}", String(TOTAL_TOOLS)),
    },
    {
      icon: "Sparkles",
      title: a.aiTitle,
      body: a.aiBody.replace("{ai}", String(TOTAL_AI_OCR_TOOLS)),
    },
    {
      icon: "Heart",
      title: a.pricingTitle,
      body: a.pricingBody
        .replace("{client}", String(TOTAL_BROWSER_TOOLS))
        .replace("{limit}", String(FREE_AI_DAILY_LIMIT)),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
        <p className="section-label mb-2">{a.label}</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          {a.title.replace("Mytulify", "").trim() ? (
            <>
              {a.title.split(site.name)[0]}
              <span className="gradient-text">{site.name}</span>
            </>
          ) : (
            <>
              About <span className="gradient-text">{site.name}</span>
            </>
          )}
        </h1>
        <p className="mt-4 text-lg text-muted">{intro}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [String(TOTAL_TOOLS), a.statTools, "Wrench"],
          [String(TOTAL_CATEGORIES), a.statCategories, "LayoutGrid"],
          [String(TOTAL_BROWSER_TOOLS), a.statBrowser, "Lock"],
        ].map(([val, label, icon]) => (
          <div key={label as string} className="glass interactive-card rounded-2xl p-5 text-center">
            <Icon name={icon as string} className="mx-auto h-5 w-5 text-brand" />
            <div className="mt-2 text-2xl font-bold gradient-text">{val}</div>
            <div className="text-sm text-muted">{label as string}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {sections.map(({ icon, title, body }) => (
          <div key={title} className="glass interactive-card flex gap-4 rounded-2xl p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={icon} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          {a.cta}
          <Icon name="ArrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
