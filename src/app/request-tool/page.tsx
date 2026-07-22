import type { Metadata } from "next";
import Link from "next/link";
import { RequestToolForm } from "@/components/request/RequestToolForm";
import { CATEGORIES, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates } from "@/lib/seo";
import { getMetadataLocale } from "@/i18n/locale";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const locale = await getMetadataLocale(searchParams);
  const description = `Suggest a new free online tool for ${site.name}. We already ship ${TOTAL_TOOLS}+ tools — tell us what to build next.`;
  return {
    title: "Request a Tool",
    description,
    ...pageAlternates("/request-tool", locale),
    robots: { index: true, follow: true },
    ...socialMeta({
      title: `Request a Tool · ${site.name}`,
      description,
      url: "/request-tool",
      locale,
    }),
  };
}

export default function RequestToolPage() {
  const categories = CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="section-label">Feedback</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Request a tool
      </h1>
      <p className="mt-3 text-muted">
        Missing something from our {TOTAL_TOOLS}+ tools? Describe the idea — we review every request
        when planning new releases.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <RequestToolForm categories={categories} />
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Prefer browsing what we already have?{" "}
        <Link href="/tools" className="font-semibold text-brand hover:underline">
          Explore all tools
        </Link>
      </p>
    </div>
  );
}
