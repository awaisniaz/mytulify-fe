import type { Metadata } from "next";
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
  const description = `${site.name} disclaimer — calculators and tools are estimates, not financial, medical, legal, tax, or engineering advice.`;
  return englishOnlyPageMeta("/disclaimer", locale, {
    title: "Disclaimer",
    description,
    socialTitle: `Disclaimer · ${site.name}`,
  });
}

export default function DisclaimerPage() {
  return (
    <LegalPage
      label="Legal"
      title="Disclaimer"
      intro={`Results on ${site.name} are for general information. They are not professional advice.`}
      updated="September 30, 2026"
      sections={[
        {
          icon: "Calculator",
          title: "Calculators and converters",
          body: "Mortgage, loan, tax, salary, and investment calculators use the formulas and rates you type in. They do not know your lender's fees, your local tax rules, or a live market price. A home, rental, refinance, or affordability figure is a planning range, not a pre-approval or an appraisal.",
        },
        {
          icon: "Activity",
          title: "Health tools",
          body: "BMI, calorie, pregnancy, and similar tools are educational estimates. They do not diagnose, treat, or replace a clinician. Pregnancy dates and cycle predictions can be wrong. Seek medical care for health decisions.",
        },
        {
          icon: "Wrench",
          title: "Home, electrical, and workshop tools",
          body: "BTU, wire size, voltage drop, lumber, concrete, and similar tools are rule-of-thumb estimates. They are not a Manual J load calculation, an NEC installation design, or a structural plan. Hire a qualified electrician, engineer, or contractor before you buy equipment or energize a circuit.",
        },
        {
          icon: "Landmark",
          title: "Not legal, tax, or financial advice",
          body: "Nothing on this site is legal advice, tax advice, or a recommendation to buy, sell, or borrow. Zakat, HRA, payroll, and similar calculators follow the inputs and published-style formulas you select. Confirm figures with a qualified adviser and the official rules that apply to you.",
        },
        {
          icon: "Globe",
          title: "External websites",
          body: "Calculator Bazaar does not control external websites linked from this site. Review their content and privacy practices before using them.",
        },
        {
          icon: "AlertTriangle",
          title: "No warranty of accuracy",
          body: "We work to keep formulas and pages correct, and we still make mistakes. Rates, bag yields, coverage numbers, and tax rules change. Verify important numbers before you spend money or sign anything. If you spot an error, email us from the Contact page.",
        },
      ]}
    />
  );
}
