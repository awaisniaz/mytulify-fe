import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/AuthForms";
import { site } from "@/lib/site";
import { privatePageMeta } from "@/lib/seo";

export const metadata: Metadata = privatePageMeta({
  title: "Sign up",
  description: `Create a free ${site.name} account`,
});

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <SignupForm />
    </div>
  );
}
