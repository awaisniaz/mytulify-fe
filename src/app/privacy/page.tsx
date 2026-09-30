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
          body: "Most tools process your files and text in your browser. That input is not uploaded for those tools and is discarded when you close or refresh the page. We do not sell the content you type or upload.",
        },
        {
          icon: "Sparkles",
          title: "AI and server tools",
          body: `${TOTAL_SERVER_SIDE_TOOLS} tools — including AI assistants and handwriting OCR — send the input you submit to our server so we can return a result. We use that input to complete the request. Do not paste passwords, payment card numbers, or government ID numbers into an AI tool.`,
        },
        {
          icon: "Mail",
          title: "Accounts and payments",
          body: "If you create an account or buy Pro, we store the email and account details needed to sign you in and to record the plan. Card or wallet payments are handled by the checkout provider shown at purchase. We do not store your full card number on this site.",
        },
        {
          icon: "Globe",
          title: "Cookies, ads, and analytics",
          body: "A locale cookie remembers the language you pick. Sign-in uses a session cookie. Some pages show Google AdSense. Ad partners may set their own cookies under Google's advertising policies. We may use aggregate analytics to see which tools are used. Analytics does not include the files you process in a browser tool. Some blog posts include affiliate links; if you buy through one, we may earn a commission.",
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
