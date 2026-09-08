import type { Metadata } from "next";
import Link from "next/link";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeCatalog } from "@/components/home/HomeCatalog";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates } from "@/lib/seo";
import { getLocale, getMetadataLocale } from "@/i18n/locale";
import { getMessages } from "@/i18n/messages";
import { getMessaging } from "@/i18n/messaging";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const messaging = await getMessaging(locale);
  const title = `${site.name} — ${messaging.tagline}`;
  return {
    title: { absolute: title },
    description: messaging.siteDescription,
    ...pageAlternates("/", locale),
    robots: { index: true, follow: true },
    ...socialMeta({
      title,
      description: messaging.siteDescription,
      url: "/",
      locale,
    }),
  };
}

export default async function Home() {
  const locale = await getLocale();
  const t = await getMessages(locale);
  const messaging = await getMessaging(locale);

  return (
    <>
      <HomeHero />

      <section className="border-b border-border bg-surface-2/50 py-8">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            ["Lock", t.home.valuePrivate, t.home.valuePrivateDesc],
            ["Zap", t.home.valueInstant, t.home.valueInstantDesc],
            ["Globe", t.home.valueOnline, t.home.valueOnlineDesc],
            ["Heart", messaging.homeValueFreeTitle, messaging.homeValueFreeDesc],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <Icon name={icon as string} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold">{title as string}</p>
                <p className="text-xs text-muted">{desc as string}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <HomeCatalog />

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-orange-500 to-amber-500 px-8 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-md text-white/85">
            {messaging.homeCtaSubtitle}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand shadow-lg"
            >
              {t.home.browseAll}
              <Icon name="ArrowRight" className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white"
            >
              {t.home.searchAll}
              <Icon name="Search" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
