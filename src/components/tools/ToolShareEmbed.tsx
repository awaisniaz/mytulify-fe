"use client";

import { offpage } from "@/lib/offpage";
import { site } from "@/lib/site";
import { CopySnippet } from "@/components/CopySnippet";
import { Icon } from "@/components/ui/Icon";

export function ToolShareEmbed({ toolName, pageUrl }: { toolName: string; pageUrl: string }) {
  const encoded = encodeURIComponent(pageUrl);
  const tweet = encodeURIComponent(`Free ${toolName} — no signup, runs in browser`);
  const shares = [
    { label: "X / Twitter", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${tweet}&via=${site.twitter.replace("@", "")}`, icon: "Share2" as const },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, icon: "Link" as const },
    { label: "Reddit", href: `https://www.reddit.com/submit?url=${encoded}&title=${encodeURIComponent(`Free ${toolName}`)}`, icon: "Globe" as const },
  ];

  const htmlBadge = `<a href="${pageUrl}" title="${toolName} — free on ${site.name}" rel="noopener">${toolName} · ${site.name}</a>`;

  const markdown = `[${toolName}](${pageUrl}) — free online tool on ${site.name}`;

  const htmlButton = `<a href="${pageUrl}" style="display:inline-block;padding:10px 16px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:600">Try ${toolName} free →</a>`;

  return (
    <section className="mt-8 rounded-xl border border-border bg-surface-2/40 p-5">
      <h2 className="text-lg font-bold">Share &amp; link to this tool</h2>
      <p className="mt-1 text-sm text-muted">
        Bloggers and partners: embed a link back to earn referral traffic and help others discover {toolName}.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {shares.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium hover:border-brand/40 transition"
          >
            <Icon name={s.icon} className="h-4 w-4 text-brand" />
            {s.label}
          </a>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <CopySnippet label="HTML text link (recommended)" code={htmlBadge} />
        <CopySnippet label="Markdown (for GitHub / docs)" code={markdown} />
        <CopySnippet label="HTML button badge" code={htmlButton} />
      </div>

      <p className="mt-3 text-xs text-muted">
        Preferred anchor text: {offpage.anchorTextSuggestions.slice(0, 3).join(", ")}. More assets on{" "}
        <a href="/link-to-us" className="text-brand hover:underline">Link to us</a>.
      </p>
    </section>
  );
}
