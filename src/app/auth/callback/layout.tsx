import type { Metadata } from "next";

/** OAuth / magic-link callback — never index. */
export const metadata: Metadata = {
  title: "Signing in",
  description: "Completing authentication.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/auth/callback" },
};

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
