import type { Metadata, Viewport } from "next";
import { Geist, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { offpage } from "@/lib/offpage";
import { socialMeta } from "@/lib/seo";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LazyEnhancementsShell } from "@/components/LazyEnhancementsShell";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { AhrefsAnalytics } from "@/components/analytics/AhrefsAnalytics";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { InFeedAd } from "@/components/ads/InFeedAd";
import { InArticleAd } from "@/components/ads/InArticleAd";
import { MultiplexAd } from "@/components/ads/MultiplexAd";
import { ads } from "@/lib/ads";
import { themeScript } from "@/lib/theme-script";
import { getLocale } from "@/i18n/locale";
import { getMessaging } from "@/i18n/messaging";
import { localeDir } from "@/i18n/config";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f7f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

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
      url: "/",
      locale,
    }),
    other: {
      monetag: process.env.MONETAG_SITE_ID ?? "30db1df687f8615565490f41f36dce91",
      "google-adsense-account": ads.clientId,
    },
  };
}

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: offpage.logo,
    description: offpage.boilerplate.medium,
    email: offpage.email,
    sameAs: offpage.sameAs,
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
      <body className="flex min-h-full min-w-0 flex-col overflow-x-clip">
        <AdSenseScript />
        <GoogleAnalytics />
        <AhrefsAnalytics />
        <Header />
        <main className="min-w-0 flex-1">
          {children}
          <InArticleAd className="mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6" />
          <InFeedAd className="mx-auto max-w-7xl px-3 pb-5 sm:px-6 sm:pb-6" />
          <MultiplexAd className="mx-auto max-w-7xl px-3 pb-6 sm:px-6 sm:pb-8" />
        </main>
        <Footer />
        <LazyEnhancementsShell />
      </body>
    </html>
  );
}
