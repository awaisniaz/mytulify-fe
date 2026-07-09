import type { Metadata } from "next";
import { Geist, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { socialMeta } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LazyEnhancementsShell } from "@/components/LazyEnhancementsShell";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { themeScript } from "@/lib/theme-script";
import { getLocale } from "@/i18n/locale";
import { getMessaging } from "@/i18n/messaging";
import { localeDir } from "@/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

const notoUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messaging = await getMessaging(locale);
  return {
    metadataBase: new URL(site.url),
    title: {
      default: `${site.name} — ${messaging.tagline}`,
      template: `%s · ${site.name}`,
    },
    description: messaging.siteDescription,
    keywords: [...site.keywords],
    applicationName: site.name,
    authors: [{ name: site.name }],
    ...socialMeta({
      title: `${site.name} — ${messaging.tagline}`,
      description: messaging.siteDescription,
      url: site.url,
    }),
    robots: { index: true, follow: true },
    other: {
      monetag: process.env.MONETAG_SITE_ID ?? "30db1df687f8615565490f41f36dce91",
    },
  };
}

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/logo.png`,
    description: site.description,
    sameAs: [`https://twitter.com/${site.twitter.replace("@", "")}`],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@type": "Organization", name: site.name, url: site.url, logo: `${site.url}/logo.png` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${site.url}/tools?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const dir = localeDir(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${notoUrdu.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-full flex-col">
        <GoogleAnalytics />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <LazyEnhancementsShell />
      </body>
    </html>
  );
}
