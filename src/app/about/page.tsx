import type { Metadata } from "next";
import Link from "next/link";
import { TOTAL_CATEGORIES, TOTAL_SERVER_SIDE_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${site.name} — ${messaging.aboutIntro}`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const clientSideTools = TOTAL_TOOLS - TOTAL_SERVER_SIDE_TOOLS;
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
        <p className="section-label mb-2">About us</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          About <span className="gradient-text">{site.name}</span>
        </h1>
        <p className="mt-4 text-lg text-muted">
          {messaging.aboutIntro}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [String(TOTAL_TOOLS), "Total tools", "Wrench"],
          [String(TOTAL_CATEGORIES), "Categories", "LayoutGrid"],
          [String(clientSideTools), "Browser-only", "Lock"],
        ].map(([val, label, icon]) => (
          <div key={label} className="glass interactive-card rounded-2xl p-5 text-center">
            <Icon name={icon as string} className="mx-auto h-5 w-5 text-brand" />
            <div className="mt-2 text-2xl font-bold gradient-text">{val}</div>
            <div className="text-sm text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        {[
          {
            icon: "Zap",
            title: "What we offer",
            body: `${site.name} spans ${TOTAL_CATEGORIES} categories — PDF and image utilities, text, SEO, developer, color tools, calculators and unit converters.`,
          },
          {
            icon: "Lock",
            title: "Privacy first",
            body: `Most tools — ${clientSideTools} of ${TOTAL_TOOLS} — run entirely in your browser. Your files, text, and data never leave your device.`,
          },
          {
            icon: "Sparkles",
            title: "AI-powered tools",
            body: `Our ${TOTAL_SERVER_SIDE_TOOLS} AI tools (including handwriting OCR) send input to our server to generate results. We don't store that input after processing.`,
          },
          {
            icon: "Heart",
            title: messaging.aboutPricingTitle,
            body: messaging.aboutPricingBody,
          },
        ].map(({ icon, title, body }) => (
          <div key={title} className="glass interactive-card flex gap-4 rounded-2xl p-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <Icon name={icon} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-6 py-3 font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Explore all tools
          <Icon name="ArrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
