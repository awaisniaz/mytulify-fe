import type { Metadata } from "next";

/** Checkout form handoff — never index. */
export const metadata: Metadata = {
  title: "Redirecting to payment",
  description: "Secure payment redirect.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/pricing/pay" },
};

export default function PricingPayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
