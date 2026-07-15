import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/AuthForms";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sign up",
  description: `Create a free ${site.name} account`,
  robots: { index: false, follow: false },
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <SignupForm />
    </div>
  );
}
