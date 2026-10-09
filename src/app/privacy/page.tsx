import type { Metadata } from "next";
import { TOTAL_SERVER_SIDE_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";
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
  const privacyDescription = `${site.name} privacy policy — browser tools stay on your device, what AI tools send, accounts, ads, and how to contact us.`;
  return englishOnlyPageMeta("/privacy", locale, {
    title: "Privacy Policy",
    description: privacyDescription,
    socialTitle: `Privacy Policy · ${site.name}`,
  });
}

export default function PrivacyPage() {
  return (
    <LegalPage
      label="Legal"
      title="Privacy Policy"
      intro={`How ${site.name} handles data across ${TOTAL_TOOLS}+ tools.`}
      updated="September 30, 2026"
      sections={[
        {
          icon: "Shield",
          title: "Who we are",
          body: `${site.name} (${site.url}) runs a free online tools site. The contact address for privacy questions is ${site.supportEmail}.`,
        },
        {
          icon: "Lock",
          title: "Browser tools",
          body: `Most of our ${TOTAL_TOOLS}+ tools process files and text entirely in your browser (client-side). For those tools, the input is not uploaded to Mytulify and is discarded when you close or refresh the page. We do not sell the content you type or upload.`,
        },
        {
          icon: "Sparkles",
          title: "AI, OCR, and other server tools",
          body: `${TOTAL_SERVER_SIDE_TOOLS} tools — including AI assistants and handwriting OCR — send the text or image you submit to our servers so we can return a result. To generate that result we may call a third-party AI model provider (including vision models for OCR). We use the input to complete the request and do not sell it. Do not paste passwords, payment card numbers, government ID numbers, or photos of identity documents into these tools.`,
        },
        {
          icon: "Mail",
          title: "Accounts and payments",
          body: "If you create an account or buy Pro, we store the email and account details needed to sign you in and to record the plan. Card or wallet payments are handled by the checkout provider shown at purchase. We do not store your full card number on this site.",
        },
        {
          icon: "Globe",
          title: "Cookies, ads, analytics, and consent",
          body: "A locale cookie remembers the language you pick. Sign-in uses a session cookie. Some pages load Google AdSense, which may set advertising cookies under Google's policies. For visitors in the EEA, UK, or Switzerland, Google may show a consent message for personalized ads when that feature is enabled in the AdSense account; we do not run a separate first-party consent management platform on this site. We may use aggregate analytics to see which tools are used. Analytics does not include the files you process in a browser-only tool. Some blog posts include affiliate links; if you buy through one, we may earn a commission.",
        },
        {
          icon: "EyeOff",
          title: "What we do not do",
          body: "We do not sell your tool inputs. We do not require an account to use browser tools. We do not knowingly collect personal information from children under 13. If you believe a child sent us personal information, email us and we will delete it.",
        },
        {
          icon: "RefreshCw",
          title: "Changes and contact",
          body: `We update this policy when the product changes. The date on this page is the latest revision. Questions or deletion requests: ${site.supportEmail}, or the form on the Contact page.`,
        },
      ]}
    />
  );
}
