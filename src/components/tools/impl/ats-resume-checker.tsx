"use client";

import * as React from "react";
import { Button, Textarea } from "@/components/ui/primitives";
import { CopyButton, DownloadButton, Field, FileDrop, Notice } from "@/components/tools/shared";
import { AiUsageBanner, notifyUsageUpdated } from "@/components/billing/AiUsageBanner";
import { proHeaders } from "@/lib/billing/client";
import { Icon } from "@/components/ui/Icon";
import { cn, formatBytes } from "@/lib/utils";
import { parseResumeFile, parsePlainResume } from "@/lib/ats/parse";
import { buildAtsReport, reportToText } from "@/lib/ats/check";
import { mergeAiReview, parseAiAtsReview } from "@/lib/ats/ai-review";
import type { AtsIssue, AtsReport, AtsSeverity, ParsedResume } from "@/lib/ats/types";

type Tab = "issues" | "keywords" | "parsed" | "strengths";

function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, score)) / 100) * c;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#0ea5e9" : score >= 50 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" className="-rotate-90" width={size} height={size} aria-hidden>
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" className="text-border" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-3xl font-bold tabular-nums">{score}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">/ 100</div>
        </div>
      </div>
    </div>
  );
}

function severityStyles(s: AtsSeverity): { wrap: string; label: string } {
  switch (s) {
    case "critical":
      return { wrap: "border-rose-500/30 bg-rose-500/5", label: "bg-rose-500/15 text-rose-600" };
    case "warning":
      return { wrap: "border-amber-500/30 bg-amber-500/5", label: "bg-amber-500/15 text-amber-700 dark:text-amber-400" };
    case "pass":
      return { wrap: "border-emerald-500/30 bg-emerald-500/5", label: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
    default:
      return { wrap: "border-border bg-surface", label: "bg-surface-2 text-muted" };
  }
}

function IssueCard({ issue }: { issue: AtsIssue }) {
  const s = severityStyles(issue.severity);
  return (
    <article className={cn("rounded-xl border p-4", s.wrap)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", s.label)}>
          {issue.severity}
        </span>
        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          {issue.category}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-semibold">{issue.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{issue.detail}</p>
      <p className="mt-2 text-sm leading-relaxed">
        <span className="font-medium">How to fix: </span>
        {issue.howToFix}
      </p>
      {issue.example && (
        <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-2.5 text-xs leading-relaxed whitespace-pre-wrap">
          {issue.example}
        </pre>
      )}
    </article>
  );
}

function CatScore({ label, value }: { label: string; value: number | null }) {
  if (value == null) {
    return (
      <div className="rounded-xl border border-border bg-surface p-3 text-center">
        <div className="text-xs text-muted">{label}</div>
        <div className="mt-1 text-sm font-medium text-muted">n/a</div>
      </div>
    );
  }
  const bar =
    value >= 85 ? "bg-emerald-500" : value >= 70 ? "bg-sky-500" : value >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function AtsResumeChecker() {
  const [file, setFile] = React.useState<File | null>(null);
  const [paste, setPaste] = React.useState("");
  const [jd, setJd] = React.useState("");
  const pasteRef = React.useRef<HTMLTextAreaElement>(null);
  const jdRef = React.useRef<HTMLTextAreaElement>(null);
  const [report, setReport] = React.useState<AtsReport | null>(null);
  const [aiSummary, setAiSummary] = React.useState("");
  const [tab, setTab] = React.useState<Tab>("issues");
  const [loading, setLoading] = React.useState(false);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const onFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setFile(f);
    setPaste("");
    setReport(null);
    setAiSummary("");
    setError("");
  };

  async function run() {
    const pasted = (pasteRef.current?.value ?? paste).trim();
    const jobAd = (jdRef.current?.value ?? jd).trim();
    setPaste(pasted);
    setJd(jobAd);
    setError("");
    setAiSummary("");
    setLoading(true);
    setAiLoading(false);
    try {
      let parsed: ParsedResume;
      if (file) parsed = await parseResumeFile(file);
      else if (pasted.length >= 80) parsed = parsePlainResume(pasted);
      else {
        setError("Add a CV (PDF, DOCX, or TXT) or paste at least a few paragraphs of résumé text.");
        setLoading(false);
        return;
      }
      let next = buildAtsReport(parsed, jobAd);
      setReport(next);
      setTab("issues");
      setLoading(false);
      setAiLoading(true);

      const parseNotes = [
        `File: ${parsed.fileName} (${parsed.source}, ${formatBytes(parsed.fileSize)}, ~${parsed.pages} page(s))`,
        `Words: ${parsed.wordCount}`,
        `Layout: columns=${parsed.layout.hasMultiColumn} images=${parsed.layout.imageCount} tables=${parsed.layout.tableCount} scanned=${parsed.layout.likelyScanned} headerFooterContact=${parsed.layout.headerFooterContact} fonts=${parsed.layout.uniqueFonts}`,
        `Contact: email=${parsed.email ?? "none"} phone=${parsed.phone ?? "none"} linkedin=${parsed.linkedin ?? "none"}`,
        `Sections found: ${parsed.sections.filter((s) => s.found).map((s) => s.label).join(", ") || "none"}`,
        `Deterministic ATS score so far: ${next.overallScore}/100 (${next.verdict})`,
        `Keyword match: ${next.keywords.matchRate ?? "n/a"}%`,
      ].join("\n");

      const res = await fetch("/api/ai/ats-resume-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proHeaders() },
        body: JSON.stringify({
          resumeText: parsed.text.slice(0, 24_000),
          jobDescription: jobAd.slice(0, 12_000),
          parseNotes,
        }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || data.error) {
        setError(
          data.error
            ? `${data.error} The parse-based ATS score above is still valid.`
            : "AI review failed. The parse-based ATS score above is still valid.",
        );
      } else {
        const raw = data.text ?? "";
        const review = parseAiAtsReview(raw);
        next = mergeAiReview(next, review, raw);
        setReport(next);
        setAiSummary(review?.summary ?? "");
        notifyUsageUpdated();
      }
    } catch (e) {
      setError((e as Error).message || "Could not read that file.");
      setReport(null);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  }

  const counts = React.useMemo(() => {
    const issues = report?.issues ?? [];
    return {
      critical: issues.filter((i) => i.severity === "critical").length,
      warning: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
    };
  }, [report]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "issues", label: `Issues${report ? ` (${report.issues.filter((i) => i.severity !== "pass").length})` : ""}` },
    { id: "keywords", label: "Keywords" },
    { id: "parsed", label: "What ATS sees" },
    { id: "strengths", label: "Strengths" },
  ];

  return (
    <div className="space-y-5">
      <AiUsageBanner />

      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          label="1. Add your CV"
          hint="PDF is what most ATS portals accept. DOCX and pasted text also work. Screenshots and old .doc files do not."
        >
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted">{formatBytes(file.size)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setReport(null);
                  setAiSummary("");
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <FileDrop
              accept=".pdf,.docx,.txt"
              onFiles={onFiles}
              label="Drop CV here or click to upload"
            />
          )}
          <Textarea
            ref={pasteRef}
            className="mt-3 font-sans"
            rows={8}
            value={paste}
            onChange={(e) => {
              setPaste(e.target.value);
              if (e.target.value) setFile(null);
            }}
            placeholder="Or paste the résumé you will submit…"
          />
        </Field>

        <Field
          label="2. Job description (recommended)"
          hint="Paste the full posting. Keyword match is how ATS actually ranks you against other applicants."
        >
          <Textarea
            ref={jdRef}
            className="font-sans min-h-48"
            rows={12}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the role requirements, must-haves, and responsibilities…"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={run} disabled={loading || aiLoading}>
          {loading || aiLoading ? (
            <>
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
              {loading ? "Parsing CV…" : "Scoring with ATS + AI…"}
            </>
          ) : (
            <>
              <Icon name="Search" className="h-4 w-4" /> Check ATS score
            </>
          )}
        </Button>
        <span className="text-xs text-muted">Parse runs in your browser first, then a detailed AI review.</span>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {report && (
        <div className="space-y-4">
          <div className="glass rounded-2xl border border-border p-5">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <ScoreRing score={report.overallScore} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overall ATS score</p>
                <p className="mt-1 text-lg font-semibold">{report.verdict}</p>
                {aiSummary && <p className="mt-2 text-sm leading-relaxed text-muted">{aiSummary}</p>}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-rose-500/10 px-2.5 py-1 font-medium text-rose-600">
                    {counts.critical} critical
                  </span>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-700 dark:text-amber-400">
                    {counts.warning} warnings
                  </span>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-muted">
                    {counts.info} notes
                  </span>
                  {report.keywords.matchRate != null && (
                    <span className="rounded-full bg-brand/10 px-2.5 py-1 font-medium text-brand">
                      {report.keywords.matchRate}% keyword match
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              <CatScore label="Parse" value={report.categoryScores.parse} />
              <CatScore label="Format" value={report.categoryScores.format} />
              <CatScore label="Structure" value={report.categoryScores.structure} />
              <CatScore label="Content" value={report.categoryScores.content} />
              <CatScore label="Keywords" value={report.categoryScores.keywords} />
            </div>
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface-2/60 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  tab === t.id ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "issues" && (
            <div className="space-y-3">
              {report.issues.filter((i) => i.severity !== "pass").length === 0 ? (
                <Notice tone="success">No blocking issues. Still skim the parsed text to confirm the ATS order looks right.</Notice>
              ) : (
                report.issues.filter((i) => i.severity !== "pass").map((issue) => <IssueCard key={issue.id} issue={issue} />)
              )}
              {report.issues
                .filter((i) => i.severity === "pass")
                .map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
            </div>
          )}

          {tab === "keywords" && (
            <div className="space-y-3">
              {report.keywords.matchRate == null ? (
                <Notice tone="info">Paste a job description and run the check again to see required vs missing keywords.</Notice>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Match rate is based on terms an ATS would extract from the job ad (tools, skills, repeated phrases) vs the parsed résumé text.
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                        <tr>
                          <th className="px-3 py-2 font-medium">Term</th>
                          <th className="px-3 py-2 font-medium">In CV</th>
                          <th className="px-3 py-2 font-medium">Hits</th>
                          <th className="px-3 py-2 font-medium">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...report.keywords.missing, ...report.keywords.matched].map((k) => (
                          <tr key={k.term} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{k.term}</td>
                            <td className="px-3 py-2">{k.inResume ? "Yes" : "Missing"}</td>
                            <td className="px-3 py-2 tabular-nums">{k.count}</td>
                            <td className="px-3 py-2 capitalize">{k.importance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "parsed" && (
            <div className="space-y-3">
              <Notice tone="info">
                This is the reading order extracted from your file — close to what Workday / Greenhouse / Taleo store. If names, dates, or skills look jumbled, the ATS sees the same mess.
              </Notice>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {report.parsed.sections.map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-xs font-medium",
                      s.found ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : "border-border text-muted",
                    )}
                  >
                    {s.found ? "✓" : "✗"} {s.label}
                  </div>
                ))}
              </div>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed">
                {report.parsed.text || "(no text extracted)"}
              </pre>
            </div>
          )}

          {tab === "strengths" && (
            <ul className="space-y-2">
              {(report.strengths.length ? report.strengths : ["No strengths flagged yet — fix critical issues first."]).map((s) => (
                <li key={s} className="flex gap-2 rounded-xl border border-border bg-surface p-3 text-sm">
                  <Icon name="Check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2">
            <CopyButton value={reportToText(report)} label="Copy full report" />
            <DownloadButton value={reportToText(report)} filename="ats-report.txt" />
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted">
        <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Parsing stays in your browser. The optional AI review is sent to Mytulify servers (free daily quota / Pro unlimited).
          Don&apos;t upload résumés you wouldn&apos;t share with an online tool. This is not a live Workday login — it simulates how those systems extract and score text.
        </span>
      </p>
    </div>
  );
}
