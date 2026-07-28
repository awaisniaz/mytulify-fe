import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/AuthForms";
import { site } from "@/lib/site";
import { privatePageMeta } from "@/lib/seo";

export const metadata: Metadata = privatePageMeta({
  title: "Sign in",
  description: `Sign in to ${site.name}`,
});

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
