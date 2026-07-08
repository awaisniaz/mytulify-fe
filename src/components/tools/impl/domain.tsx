"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input, Select, Textarea } from "@/components/ui/primitives";
import { Field, Notice } from "@/components/tools/shared";
import { AiUsageBanner, notifyUsageUpdated } from "@/components/billing/AiUsageBanner";
import { proHeaders } from "@/lib/billing/client";
import { Icon } from "@/components/ui/Icon";
import { copyText } from "@/lib/utils";

type DomainRow = {
  domain: string;
  base: string;
  style: string;
  reason: string;
  registerUrl: string;
};

type ApiResponse = {
  results?: DomainRow[];
  summary?: {
    available: number;
    checked: number;
    aiUsed: boolean;
    tlds: string[];
  };
  error?: string;
  code?: string;
  upgradeUrl?: string;
};

export function DomainNameFinder() {
  const [description, setDescription] = React.useState("");
  const [keywords, setKeywords] = React.useState("");
  const [style, setStyle] = React.useState("mixed");
  const [tlds, setTlds] = React.useState("com io app dev co net org pk");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [upgradeUrl, setUpgradeUrl] = React.useState("");
  const [results, setResults] = React.useState<DomainRow[]>([]);
  const [summary, setSummary] = React.useState<ApiResponse["summary"]>();
  const [copied, setCopied] = React.useState(false);

  async function run() {
    setLoading(true);
    setError("");
    setUpgradeUrl("");
    setResults([]);
    setSummary(undefined);

    try {
      const res = await fetch("/api/domain-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proHeaders() },
        body: JSON.stringify({ description, keywords, style, tlds }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) {
        setError(data.error ?? "Request failed");
        if (data.upgradeUrl) setUpgradeUrl(data.upgradeUrl);
        return;
      }

      setResults(data.results ?? []);
      setSummary(data.summary);
      notifyUsageUpdated();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    const list = results.map((r) => r.domain).join("\n");
    if (await copyText(list)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div className="space-y-5">
      <AiUsageBanner />

      <Notice tone="info">
        Describe your project — we suggest related names and show only domains that look available.
        Confirm on a registrar before buying. Uses 1 AI run.
      </Notice>

      <Field label="Project description" hint="What does your product do? Who is it for?">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="e.g. Mytulify is a hub of 398+ online tools for PDF, images, SEO and developers."
          className="font-sans"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Extra keywords" hint="Optional — niche, audience, vibe">
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="tools, pakistan, startup, saas"
          />
        </Field>
        <Field label="Name style">
          <Select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="mixed">Mixed — brandable + descriptive</option>
            <option value="brandable">Brandable — short & catchy</option>
            <option value="descriptive">Descriptive — says what it does</option>
            <option value="short">Short — 4–8 letters</option>
          </Select>
        </Field>
      </div>

      <Field label="TLDs to check" hint="Space-separated, without dots">
        <Input value={tlds} onChange={(e) => setTlds(e.target.value)} className="font-mono text-sm" />
      </Field>

      <Button onClick={run} disabled={loading || description.trim().length < 10} className="gap-2">
        {loading ? (
          <>
            <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            Finding available domains…
          </>
        ) : (
          <>
            <Icon name="Sparkles" className="h-4 w-4" />
            Find available domains
          </>
        )}
      </Button>

      {error && (
        <Notice tone="error">
          {error}
          {upgradeUrl && (
            <>
              {" "}
              <Link href={upgradeUrl} className="font-semibold underline">
                Upgrade to Pro
              </Link>
            </>
          )}
        </Notice>
      )}

      {summary && results.length === 0 && (
        <Notice tone="info">
          No available domains found from {summary.checked} checked. Try different keywords, more TLDs, or run again.
        </Notice>
      )}

      {summary && results.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <Icon name="Check" className="h-4 w-4" />
            {summary.available} available domain{summary.available === 1 ? "" : "s"}
          </span>
          <span className="text-muted">· checked {summary.checked} names</span>
          <span className="text-muted">· .{summary.tlds.join(" .")}</span>
          <button
            type="button"
            onClick={copyAll}
            className="ml-auto text-xs font-semibold text-brand hover:underline"
          >
            {copied ? "Copied!" : "Copy all"}
          </button>
        </div>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {results.map((row) => (
            <li key={row.domain} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {row.domain}
                  </span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                    {row.style}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{row.reason}</p>
              </div>
              <a
                href={row.registerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-surface-2"
              >
                Register
                <Icon name="ExternalLink" className="h-3.5 w-3.5" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
