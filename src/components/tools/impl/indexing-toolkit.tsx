"use client";

import * as React from "react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import { Field, Notice, Stat, Output } from "@/components/tools/shared";

type Tab = "tracker" | "indexnow" | "readiness" | "check";

type TrackStatus = "queued" | "ready" | "submitted" | "indexed" | "blocked" | "failed";

type TrackItem = {
  id: string;
  url: string;
  status: TrackStatus;
  score?: number;
  note?: string;
  updatedAt: number;
};

const STORAGE_KEY = "mytulify-indexing-tracker-v1";

function parseUrlList(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/[\n,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

function loadTracker(): TrackItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TrackItem[];
  } catch {
    return [];
  }
}

function statusTone(s: TrackStatus): string {
  switch (s) {
    case "indexed":
      return "text-emerald-600";
    case "submitted":
      return "text-sky-600";
    case "ready":
      return "text-brand";
    case "blocked":
    case "failed":
      return "text-rose-600";
    default:
      return "text-muted";
  }
}

type Audit = {
  finalUrl: string;
  status: number;
  title: string;
  score: number;
  metaRobots: string;
  xRobotsTag: string | null;
  canonical: string | null;
  robotsTxtFound: boolean;
  robotsBlocked: boolean | null;
  sitemapHints: string[];
  googleCheckUrl: string;
  bingCheckUrl: string;
  issues: { severity: string; code: string; message: string }[];
};

export function UrlIndexingToolkit({ initialTab = "tracker" }: { initialTab?: Tab }) {
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [items, setItems] = React.useState<TrackItem[]>([]);
  const [bulk, setBulk] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  // IndexNow
  const [urlsText, setUrlsText] = React.useState("");
  const [key, setKey] = React.useState("");
  const [keyLocation, setKeyLocation] = React.useState("");
  const [indexNowOut, setIndexNowOut] = React.useState("");

  // Readiness / check
  const [singleUrl, setSingleUrl] = React.useState("");
  const [audit, setAudit] = React.useState<Audit | null>(null);
  const [checkOut, setCheckOut] = React.useState<{
    likelyIndexed: boolean | null;
    confidence: string;
    detail: string;
    googleCheckUrl: string;
    bingCheckUrl: string;
  } | null>(null);

  React.useEffect(() => {
    setItems(loadTracker());
  }, []);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 500)));
  }, [items]);

  const stats = React.useMemo(() => {
    const total = items.length;
    const indexed = items.filter((i) => i.status === "indexed").length;
    const submitted = items.filter((i) => i.status === "submitted").length;
    const blocked = items.filter((i) => i.status === "blocked" || i.status === "failed").length;
    return { total, indexed, submitted, blocked };
  }, [items]);

  const addUrls = () => {
    const urls = parseUrlList(bulk);
    if (!urls.length) {
      setErr("Paste at least one URL.");
      return;
    }
    setErr(null);
    const now = Date.now();
    setItems((prev) => {
      const existing = new Set(prev.map((p) => p.url));
      const next = urls
        .filter((u) => !existing.has(u))
        .map((url) => ({
          id: `${now}-${url}`,
          url,
          status: "queued" as const,
          updatedAt: now,
        }));
      return [...next, ...prev].slice(0, 500);
    });
    setBulk("");
    setMsg(`Added ${urls.length} URL(s) to tracker.`);
  };

  const generateKey = async () => {
    setErr(null);
    try {
      const res = await fetch("/api/seo/indexnow/key");
      const data = (await res.json()) as { key?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "Key generation failed");
      setKey(data.key || "");
      setMsg(`Key generated. Upload a file named ${data.key}.txt containing only that key on your site root.`);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const submitIndexNow = async (list?: string[]) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const urls = list ?? parseUrlList(urlsText);
      const res = await fetch("/api/seo/indexnow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls,
          key,
          keyLocation: keyLocation || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "IndexNow failed");
      setIndexNowOut(JSON.stringify(data, null, 2));
      setMsg(data.hint || (data.ok ? "Submitted to IndexNow." : "IndexNow rejected the request."));
      if (data.ok && list) {
        const set = new Set(urls);
        setItems((prev) =>
          prev.map((it) =>
            set.has(it.url)
              ? { ...it, status: "submitted", note: "IndexNow accepted", updatedAt: Date.now() }
              : it,
          ),
        );
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const runAudit = async (url = singleUrl) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/seo/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode: "audit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setAudit(data.audit as Audit);
      setMsg(`Readiness score: ${data.audit.score}/100`);
      return data.audit as Audit;
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const runCheck = async (url = singleUrl) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/seo/indexing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode: "check" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check failed");
      setCheckOut(data.result);
      setMsg(data.result.detail);
      return data.result as {
        likelyIndexed: boolean | null;
        googleCheckUrl: string;
        bingCheckUrl: string;
      };
    } catch (e) {
      setErr((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const auditTracked = async (item: TrackItem) => {
    const a = await runAudit(item.url);
    if (!a) return;
    const blocked = a.issues.some((i) => i.severity === "error");
    setItems((prev) =>
      prev.map((it) =>
        it.id === item.id
          ? {
              ...it,
              status: blocked ? "blocked" : "ready",
              score: a.score,
              note: blocked ? a.issues.find((i) => i.severity === "error")?.message : "Looks indexable",
              updatedAt: Date.now(),
            }
          : it,
      ),
    );
    setTab("readiness");
    setSingleUrl(item.url);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "tracker", label: "URL Tracker" },
    { id: "indexnow", label: "IndexNow" },
    { id: "readiness", label: "Readiness" },
    { id: "check", label: "Index check" },
  ];

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Speed up discovery the honest way: fix indexability, notify Bing/Yandex with{" "}
        <strong>IndexNow</strong>, track URLs, then verify with Google/Bing <code className="text-xs">site:</code>{" "}
        checks. This is <strong>not</strong> a guaranteed Google force-index service.
      </Notice>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
              tab === t.id ? "bg-brand text-white" : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err && <Notice tone="error">{err}</Notice>}
      {msg && !err && <Notice tone="success">{msg}</Notice>}

      {tab === "tracker" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Tracked" value={stats.total} />
            <Stat label="Submitted" value={stats.submitted} />
            <Stat label="Marked indexed" value={stats.indexed} />
            <Stat label="Blocked / failed" value={stats.blocked} />
          </div>

          <Field label="Add URLs" hint="One per line — backlinks, guest posts, new pages">
            <Textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={5}
              placeholder={"https://example.com/new-page\nhttps://example.com/blog/post"}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={addUrls}>
              Add to tracker
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!items.length || busy || !key}
              onClick={() =>
                void submitIndexNow(
                  items.filter((i) => i.status === "queued" || i.status === "ready").map((i) => i.url).slice(0, 100),
                )
              }
            >
              IndexNow (ready/queued)
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setItems([])}>
              Clear tracker
            </Button>
          </div>
          {!key && (
            <p className="text-xs text-muted">
              Set an IndexNow key in the IndexNow tab before bulk submit.
            </p>
          )}

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!items.length && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted">
                      No URLs yet — paste a list above.
                    </td>
                  </tr>
                )}
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs" title={it.url}>
                      {it.url}
                    </td>
                    <td className={`px-3 py-2 capitalize ${statusTone(it.status)}`}>
                      {it.status}
                      {it.note ? <span className="block text-[11px] font-normal text-muted">{it.note}</span> : null}
                    </td>
                    <td className="px-3 py-2">{it.score ?? "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void auditTracked(it)}>
                          Audit
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setItems((prev) =>
                              prev.map((x) =>
                                x.id === it.id ? { ...x, status: "indexed", updatedAt: Date.now() } : x,
                              ),
                            )
                          }
                        >
                          Mark indexed
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "indexnow" && (
        <div className="space-y-4">
          <Notice tone="info">
            IndexNow notifies Bing, Yandex, Seznam, Naver, and others. Host a key file on your domain first, then
            submit URLs from that same host.
          </Notice>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void generateKey()}>
              Generate key
            </Button>
          </div>
          <Field label="IndexNow key" hint="Must match the contents of your key .txt file">
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="paste or generate key" />
          </Field>
          <Field label="Key location (optional)" hint="Default: https://yourhost/{key}.txt">
            <Input
              value={keyLocation}
              onChange={(e) => setKeyLocation(e.target.value)}
              placeholder="https://example.com/abc123.txt"
            />
          </Field>
          <Field label="URLs to submit" hint="Same host only · max 100">
            <Textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              rows={8}
              placeholder={"https://example.com/page-1\nhttps://example.com/page-2"}
            />
          </Field>
          <Button disabled={busy || !key} onClick={() => void submitIndexNow()}>
            {busy ? "Submitting…" : "Submit to IndexNow"}
          </Button>
          {key && (
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Key file contents — upload as {"{key}"}.txt on your site root
              </p>
              <Output value={`${key}`} rows={2} filename={`${key}.txt`} />
            </div>
          )}
          {indexNowOut && <Output value={indexNowOut} rows={10} filename="indexnow-result.json" />}
        </div>
      )}

      {tab === "readiness" && (
        <div className="space-y-4">
          <Field label="Page URL" hint="We check live HTTP, noindex, robots.txt, canonical">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1"
              />
              <Button disabled={busy} onClick={() => void runAudit()}>
                {busy ? "Auditing…" : "Audit readiness"}
              </Button>
            </div>
          </Field>
          {audit && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Score" value={`${audit.score}/100`} />
                <Stat label="HTTP" value={audit.status} />
                <Stat label="robots.txt" value={audit.robotsTxtFound ? "Found" : "Missing"} />
                <Stat label="Blocked path" value={audit.robotsBlocked ? "Yes" : "No"} />
              </div>
              <p className="text-xs text-muted">
                {audit.title ? `Title: ${audit.title}` : "No title"} · {audit.finalUrl}
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {(
                      [
                        ["Meta robots", audit.metaRobots || "—"],
                        ["X-Robots-Tag", audit.xRobotsTag || "—"],
                        ["Canonical", audit.canonical || "—"],
                        ["Sitemaps", audit.sitemapHints.join(", ") || "—"],
                      ] as [string, string][]
                    ).map(([k, v]) => (
                      <tr key={k} className="border-b border-border last:border-0">
                        <td className="w-36 bg-surface-2 px-3 py-2 font-medium">{k}</td>
                        <td className="break-all px-3 py-2">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="list-inside list-disc text-sm text-muted">
                {audit.issues.map((i) => (
                  <li
                    key={i.code + i.message}
                    className={
                      i.severity === "error"
                        ? "text-rose-600"
                        : i.severity === "warn"
                          ? "text-amber-700"
                          : i.severity === "ok"
                            ? "text-emerald-700"
                            : ""
                    }
                  >
                    [{i.severity}] {i.message}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <a
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-brand"
                  href={audit.googleCheckUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Google site: check
                </a>
                <a
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-brand"
                  href={audit.bingCheckUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Bing site: check
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "check" && (
        <div className="space-y-4">
          <Notice tone="info">
            Soft check uses Bing search HTML (best-effort). Always confirm with Google and Bing{" "}
            <code className="text-xs">site:</code> links — especially for Google, which IndexNow does not cover.
          </Notice>
          <Field label="URL to check">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1"
              />
              <Button disabled={busy} onClick={() => void runCheck()}>
                {busy ? "Checking…" : "Soft index check"}
              </Button>
            </div>
          </Field>
          {checkOut && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat
                  label="Likely indexed"
                  value={
                    checkOut.likelyIndexed === null ? "Unknown" : checkOut.likelyIndexed ? "Yes" : "No"
                  }
                />
                <Stat label="Confidence" value={checkOut.confidence} />
              </div>
              <p className="text-sm text-muted">{checkOut.detail}</p>
              <div className="flex flex-wrap gap-2">
                <a
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-brand"
                  href={checkOut.googleCheckUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on Google
                </a>
                <a
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-brand"
                  href={checkOut.bingCheckUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on Bing
                </a>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (!singleUrl.trim()) return;
                    setItems((prev) => {
                      const url = singleUrl.trim();
                      const hit = prev.find((p) => p.url === url);
                      if (hit) {
                        return prev.map((p) =>
                          p.url === url ? { ...p, status: "indexed", updatedAt: Date.now() } : p,
                        );
                      }
                      return [
                        {
                          id: `${Date.now()}`,
                          url,
                          status: "indexed" as const,
                          updatedAt: Date.now(),
                        },
                        ...prev,
                      ];
                    });
                    setMsg("Marked indexed in tracker.");
                    setTab("tracker");
                  }}
                >
                  Mark indexed in tracker
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function IndexNowSubmitter() {
  return <UrlIndexingToolkit initialTab="indexnow" />;
}

export function IndexingReadinessChecker() {
  return <UrlIndexingToolkit initialTab="readiness" />;
}

export function UrlIndexStatusChecker() {
  return <UrlIndexingToolkit initialTab="check" />;
}
