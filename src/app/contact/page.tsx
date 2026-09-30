import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/ContactForm";
import { site } from "@/lib/site";
import { englishOnlyPageMeta } from "@/lib/seo";
import { getMetadataLocale } from "@/i18n/locale";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const description = `Contact ${site.name} about a tool, billing, a partnership, or a correction. Email ${site.supportEmail} or use the form.`;
  return englishOnlyPageMeta("/contact", locale, {
    title: "Contact Us",
    description,
    socialTitle: `Contact Us · ${site.name}`,
  });
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="section-label">Legal</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Contact us</h1>
      <p className="mt-3 text-muted">
        Questions about a calculator, a Pro subscription, a broken page, or a partnership go to{" "}
        <a className="font-semibold text-brand hover:underline" href={`mailto:${site.supportEmail}`}>
          {site.supportEmail}
        </a>
        . For a new tool idea, use{" "}
        <Link href="/request-tool" className="font-semibold text-brand hover:underline">
          Request a tool
        </Link>
        .
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <ContactForm supportEmail={site.supportEmail} />
      </div>

      <nav className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
        <Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
      </nav>
    </div>
  );
}
