"use client";

import * as React from "react";
import { Input, Button } from "@/components/ui/primitives";
import { Field, Notice } from "@/components/tools/shared";

export type FetchedPagePayload = {
  finalUrl: string;
  status: number;
  contentType: string;
  title: string;
  truncated: boolean;
  html: string;
  bytes: number;
};

export async function fetchPageHtml(url: string): Promise<FetchedPagePayload> {
  const res = await fetch("/api/seo/fetch-page", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = (await res.json()) as FetchedPagePayload & { error?: string; ok?: boolean };
  if (!res.ok) throw new Error(data.error || "Failed to fetch page.");
  return data;
}

/** URL field + Fetch button that loads public page HTML via the server. */
export function FetchFromUrl({
  onFetched,
  label = "Page URL",
  hint = "We'll fetch the live HTML (public pages only)",
  placeholder = "https://example.com/page",
  cta = "Fetch page",
}: {
  onFetched: (page: FetchedPagePayload) => void;
  label?: string;
  hint?: string;
  placeholder?: string;
  cta?: string;
}) {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<string | null>(null);

  const run = async () => {
    setError(null);
    setMeta(null);
    if (!url.trim()) {
      setError("Enter a page URL first.");
      return;
    }
    setLoading(true);
    try {
      const page = await fetchPageHtml(url.trim());
      onFetched(page);
      setMeta(
        `Loaded ${page.bytes.toLocaleString()} chars from ${page.finalUrl}${page.truncated ? " (truncated)" : ""}`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface-2/40 p-3">
      <Field label={label} hint={hint}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void run();
              }
            }}
          />
          <Button type="button" onClick={() => void run()} disabled={loading}>
            {loading ? "Fetching…" : cta}
          </Button>
        </div>
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      {meta && !error && <Notice tone="success">{meta}</Notice>}
    </div>
  );
}

/** Browser helpers for analyzing fetched HTML. */
export function parsePageDoc(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

export function extractVisibleText(html: string): string {
  const doc = parsePageDoc(html);
  doc.querySelectorAll("script,style,noscript,svg,iframe").forEach((el) => el.remove());
  return (doc.body?.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function extractMeta(html: string) {
  const doc = parsePageDoc(html);
  return {
    title: doc.querySelector("title")?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    description: doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    robots: doc.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "",
    ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
    ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? "",
    ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "",
    h1: [...doc.querySelectorAll("h1")].map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim()),
  };
}

export function extractJsonLdBlocks(html: string): string[] {
  const doc = parsePageDoc(html);
  return [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map((el) => (el.textContent ?? "").trim())
    .filter(Boolean);
}

export function extractInternalLinks(html: string, pageUrl: string): string[] {
  let origin = "";
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    /* ignore */
  }
  const doc = parsePageDoc(html);
  const out = new Set<string>();
  for (const a of doc.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    try {
      const abs = new URL(href, pageUrl || "https://example.com");
      if (!origin || abs.origin === origin) out.add(abs.pathname + abs.search);
    } catch {
      /* ignore */
    }
  }
  return [...out].slice(0, 500);
}
