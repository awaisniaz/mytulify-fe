import type { Metadata } from "next";
import { TOTAL_SERVER_SIDE_TOOLS, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates } from "@/lib/seo";
import { getLocale } from "@/i18n/locale";
import { Icon } from "@/components/ui/Icon";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const privacyDescription = `${site.name} privacy policy — how we handle your data across ${TOTAL_TOOLS}+ browser-based and AI-powered tools.`;
  return {
    title: "Privacy Policy",
    description: privacyDescription,
    ...pageAlternates("/privacy", locale),
    robots: { index: true, follow: true },
    ...socialMeta({
      title: `Privacy Policy · ${site.name}`,
      description: privacyDescription,
      url: "/privacy",
      locale,
    }),
  };
}

const SECTIONS = [
  {
    icon: "Shield",
    title: "Our promise",
    body: `${site.name} is built privacy-first. Most tools process your input locally in your browser. We do not upload, store, or transmit the files or text you use with those client-side tools.`,
  },
  {
    icon: "Lock",
    title: "Client-side tools",
    body: "The majority of our tools run entirely on your device. Your files, text, and data stay in your browser and are discarded when you close or refresh the page. Nothing is sent to our servers.",
  },
  {
    icon: "Sparkles",
    title: "AI-powered tools",
    body: `${TOTAL_SERVER_SIDE_TOOLS} tools — including AI assistants and handwriting OCR — send your input to our server so we can call an AI model and return a result. We do not store your inputs after the request completes. Avoid pasting passwords, API keys, or other sensitive data.`,
  },
  {
    icon: "EyeOff",
    title: "What we don't collect",
    body: "We never sell the content you paste, type, or upload into any tool. For client-side tools, that data never leaves your device. For AI tools, we process input only to generate your result.",
  },
  {
    icon: "BarChart3",
    title: "Analytics",
    body: "We may use privacy-respecting, aggregate analytics to understand which tools are popular. This never includes the content you process.",
  },
  {
    icon: "Globe",
    title: "Advertising",
    body: "Some pages show Google AdSense ads (homepage, listings, below tools). We show at most one ad per page and never inside the tool workspace. Ad partners may use cookies — see Google's advertising policies for details.",
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
        <p className="section-label mb-2">Legal</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-muted">
          How {site.name} handles your data across {TOTAL_TOOLS}+ tools.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {SECTIONS.map(({ icon, title, body }) => (
          <div key={title} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold">{title}</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Last updated: {new Date().getFullYear()}.
      </p>
    </div>
  );
}
