import type { Metadata } from "next";
import { privatePageMeta } from "@/lib/seo";

/** OAuth / magic-link callback — never index. */
export const metadata: Metadata = privatePageMeta({
  title: "Signing in",
  description: "Completing authentication.",
});

export default function AuthCallbackLayout({ children }: { children: React.ReactNode }) {
  return children;
}
