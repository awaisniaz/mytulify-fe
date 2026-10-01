import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, TOTAL_CATEGORIES, TOTAL_AI_OCR_TOOLS, TOTAL_BROWSER_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates, publicRobots } from "@/lib/seo";
import { Icon } from "@/components/ui/Icon";
import { getLocale, getMetadataLocale } from "@/i18n/locale";
import { getContent } from "@/i18n/content";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const content = await getContent(locale);
  const intro = content.strings.aboutPage.intro
    .replace("{total}", String(TOTAL_TOOLS))
    .replace("{client}", String(TOTAL_BROWSER_TOOLS));
  const title = content.strings.aboutPage.title;
  const description = `Learn about ${site.name} — ${intro}`;
  return {
    title,
    description,
    ...pageAlternates("/about", locale),
    robots: publicRobots(locale),
    ...socialMeta({
      title: `${title} · ${site.name}`,
      description,
      url: "/about",
      locale,
    }),
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
          [String(TOTAL_CATEGORIES), a.statCategories, "Boxes"],
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

      <section className="prose-blog mt-10 max-w-none">
        <h2>What you can do here</h2>
        <p>
          {site.name} is a library of free online tools for people who need an answer or a converted file without
          installing software. Calculators cover money, health, school, and the workshop. Converters change units,
          files, and formats. Text, PDF, image, and developer tools do the small jobs that usually mean opening a
          desktop app. You open a page, enter what you already have, and read the result on that same page.
        </p>
        <p>
          Most tools run in the browser. The file or the numbers stay on your device, which is why those pages say
          they are private and instant. A smaller set, including AI writers and handwriting OCR, sends the input to
          a server so the model can run. Those pages say so, and the free plan includes a daily limit. Pro removes
          that limit. You do not need an account to try a browser tool.
        </p>
        <p>
          The categories are {CATEGORIES.map((c) => c.name).join(", ")}. Open a category when you know the kind of
          job, or use search when you know the name of the tool. Every tool page repeats the job in plain language,
          lists the steps, and answers the usual questions under the form. Related tools sit at the bottom when the
          next step is a different calculation.
        </p>
        <p>
          Read the result against the labels on the form. A mortgage figure depends on the rate and the term you
          typed. A PDF conversion depends on the file you uploaded. A unit conversion depends on which units you
          picked. If a page does not mention a rule that applies to you, use the output as a draft and check the
          source that actually governs that decision. The tools are estimates and converters, not a bank, a clinic,
          or a lawyer.
        </p>
        <h2>How a tool page is organized</h2>
        <p>
          The title is the task. The sentence under it is the scope. The form is next. Under the form you will find
          a longer explanation, a numbered way to use the tool, a short table of facts, and questions. That text is
          there so you can decide whether the tool fits before you type anything, and so you can interpret the
          result after you do.
        </p>
        <p>
          Search and the category lists use the same names and the same descriptions you see on the tool page. If
          the description matches the input you have, you are on the right tool. If it does not, go back to the
          category and read the next description. That is faster than guessing from an icon alone.
        </p>
      </section>

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
