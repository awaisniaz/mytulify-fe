import type { Metadata } from "next";

import { privatePageMeta } from "@/lib/seo";

/** Checkout form handoff — never index. */
export const metadata: Metadata = privatePageMeta({
  title: "Redirecting to payment",
  description: "Secure payment redirect.",
});

export default function PricingPayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
