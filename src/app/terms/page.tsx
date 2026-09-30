import type { Metadata } from "next";
import { TOTAL_TOOLS } from "@/lib/catalog";
import { LegalPage } from "@/components/legal/LegalPage";
import { site } from "@/lib/site";
import { englishOnlyPageMeta } from "@/lib/seo";
import { getMetadataLocale } from "@/i18n/locale";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const description = `Terms and conditions for using ${site.name} — free browser tools, AI tools, accounts, and acceptable use.`;
  return englishOnlyPageMeta("/terms", locale, {
    title: "Terms and Conditions",
    description,
    socialTitle: `Terms and Conditions · ${site.name}`,
  });
}

export default function TermsPage() {
  return (
    <LegalPage
      label="Legal"
      title="Terms and Conditions"
      intro={`These terms cover your use of ${site.name} at ${site.url}.`}
      updated="September 30, 2026"
      sections={[
        {
          icon: "FileText",
          title: "Using the site",
          body: `${site.name} provides ${TOTAL_TOOLS}+ online tools. Most of them run in your browser and are free without an account. By using the site you agree to these terms and to the Privacy Policy and Disclaimer.`,
        },
        {
          icon: "Briefcase",
          title: "Accounts and Pro",
          body: "An account is optional for browser tools. Pro and some AI tools require an account and, where charged, a payment through the checkout provider shown at purchase. You are responsible for the email and password on your account. Fees, if any, are shown before you pay. Browser tools on the Free plan stay available without a subscription.",
        },
        {
          icon: "Sparkles",
          title: "AI tools",
          body: "AI and handwriting OCR features send the text or image you submit so a model can return a result. Daily free limits apply. Output can be wrong or incomplete. You review it before you rely on it, publish it, or send it to someone else.",
        },
        {
          icon: "Shield",
          title: "Acceptable use",
          body: "Do not use the site to break the law, attack our systems, scrape in a way that degrades the service, upload malware, or submit someone else's private data without the right to do so. Do not attempt to bypass usage limits, payment checks, or rate limits. We may suspend access that breaks these rules.",
        },
        {
          icon: "Calculator",
          title: "Tools are estimates",
          body: "Calculators, converters, and generators produce results from the numbers and text you enter. They are planning aids. They are not a loan offer, tax filing, medical diagnosis, electrical design, or professional opinion. Read the Disclaimer before you act on a result.",
        },
        {
          icon: "Stamp",
          title: "Our content and yours",
          body: `The ${site.name} name, logo, site design, and original copy belong to us. You keep the files and text you bring to a tool. Do not copy the site's pages or branding and present them as your own product. Linking to a tool page is welcome — see Link to us.`,
        },
        {
          icon: "Landmark",
          title: "Liability",
          body: "The site is provided as available. We do not promise that every tool will be error-free or uninterrupted. To the extent the law allows, we are not liable for decisions you make from a calculator result, for lost profits, or for indirect damages. Nothing in these terms limits liability that cannot be limited under applicable law.",
        },
        {
          icon: "Mail",
          title: "Contact",
          body: `Questions about these terms: ${site.supportEmail}. We may update this page; the date above changes when we do. Continued use after an update means you accept the revised terms.`,
        },
      ]}
    />
  );
}
