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
  const privacyDescription = `${site.name} privacy policy — how calculator inputs, account details, and site preferences are handled.`;
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
      intro={`How ${site.name} handles data across its ${TOTAL_TOOLS}+ calculators.`}
      updated="October 10, 2026"
      sections={[
        {
          icon: "Shield",
          title: "Who we are",
          body: `${site.name} (${site.url}) runs a free online tools site. The contact address for privacy questions is ${site.supportEmail}.`,
        },
        {
          icon: "Lock",
          title: "Calculator inputs",
          body: "Calculator inputs are processed in your browser to show the result. They are not sent to our server for calculation. We do not sell the numbers you enter.",
        },
        {
          icon: "Mail",
          title: "Accounts and payments",
          body: "If you create an account or buy Pro, we store the email and account details needed to sign you in and to record the plan. Card or wallet payments are handled by the checkout provider shown at purchase. We do not store your full card number on this site.",
        },
        {
          icon: "Globe",
          title: "Preferences and analytics",
          body: "A locale cookie remembers the language you pick, and sign-in uses a session cookie. Calculator Bazaar does not load third-party advertising or analytics scripts.",
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
