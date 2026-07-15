import type { Metadata } from "next";
import Link from "next/link";
import { ProSuccessClient } from "@/components/billing/ProSuccessClient";
import { site } from "@/lib/site";
import { brand } from "@/lib/brand";
import { socialMeta } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Payment successful",
  description: `Your ${brand.proProduct} license is ready on ${site.name}.`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/pricing/success" },
  ...socialMeta({
    title: `Pro activated · ${site.name}`,
    description: `Your ${brand.proProduct} license is ready.`,
    url: "/pricing/success",
  }),
};

export default async function PricingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; order_ref?: string }>;
}) {
  const { session_id: sessionId, order_ref: orderRef } = await searchParams;

  if (!sessionId && !orderRef) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Missing session</h1>
        <p className="mt-2 text-muted">Return to pricing and try checkout again.</p>
        <Link href="/pricing" className="mt-6 inline-block text-brand hover:underline">
          ← Back to pricing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <ProSuccessClient sessionId={sessionId} orderRef={orderRef} />
      <p className="mt-8 text-center text-sm text-muted">
        <Link href="/tools" className="text-brand hover:underline">
          Start using Pro tools →
        </Link>
      </p>
    </div>
  );
}
