import type { Metadata } from "next";
import { Suspense } from "react";
import { AllToolsBrowser } from "@/components/AllToolsBrowser";
import { TOTAL_TOOLS, TOTAL_CATEGORIES } from "@/lib/catalog";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import { socialMeta } from "@/lib/seo";

const description = messaging.toolsPageDescription;

export const metadata: Metadata = {
  title: "All Tools",
  description,
  alternates: { canonical: "/tools" },
  ...socialMeta({ title: `All Tools · ${site.name}`, description, url: "/tools" }),
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">All {TOTAL_TOOLS}+ tools</h1>
        <p className="mt-1 text-muted">
          Search and filter across {TOTAL_CATEGORIES} categories.
        </p>
      </div>
      <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
        <AllToolsBrowser />
      </Suspense>
    </div>
  );
}
