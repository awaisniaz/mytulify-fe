"use client";

import * as React from "react";
import { Input } from "@/components/ui/primitives";
import { Field } from "@/components/tools/shared";
import { cn } from "@/lib/utils";
import type { FlTemplateMeta } from "@/lib/freelancer/industries";
import { BrandedDocPreview, type BrandedDocSection } from "./BrandedDocPreview";
import { DEFAULT_DOC_BRAND } from "./DocBrandControls";

type Props<T extends FlTemplateMeta> = {
  label?: string;
  hint?: string;
  templates: T[];
  selectedId: string | null;
  onSelect: (template: T) => void;
  allowBlank?: boolean;
  onBlank?: () => void;
  /** Scroll target after apply (defaults to live PDF preview). */
  previewAnchorId?: string;
};

type PreviewDoc = {
  kind: "doc" | "email" | "calc";
  title: string;
  subtitle?: string;
  body: string;
  sections?: BrandedDocSection[];
  meta?: { label: string; value: string }[];
  signatures?: string[];
  stats?: { label: string; value: string }[];
};

function money(n: string | number) {
  const v = typeof n === "number" ? n : Number(String(n).replace(/,/g, ""));
  if (!Number.isFinite(v)) return String(n);
  return `$${v.toLocaleString()}`;
}

/** Build a real content preview from template.data so cards match download. */
function buildPreview(t: FlTemplateMeta & { data?: Record<string, unknown> }): PreviewDoc {
  const d = t.data ?? {};

  if (typeof d.projectTitle === "string" && typeof d.scope === "string") {
    const amount = money(String(d.amount ?? ""));
    const schedule = String(d.schedule ?? "milestone");
    const revisions = String(d.revisions ?? "2");
    return {
      kind: "doc",
      title: d.projectTitle,
      subtitle: `Fee ${amount} · ${schedule} · ${revisions} revisions`,
      body: String(d.scope),
      meta: [
        { label: "Fee", value: amount },
        { label: "Schedule", value: schedule },
        { label: "Revisions", value: revisions },
      ],
      sections: [
        { heading: "Scope of work", body: String(d.scope) },
        {
          heading: "Fees & payment",
          body: `Total / retainer: ${amount}\nPayment schedule: ${schedule}\nIncluded revision rounds: ${revisions}`,
        },
      ],
      signatures: ["Client", "Freelancer"],
    };
  }

  if (typeof d.summary === "string" && typeof d.pricing === "string") {
    return {
      kind: "doc",
      title: t.name,
      subtitle: "Project proposal",
      body: `${d.summary}\n\n${String(d.scope ?? "")}\n\n${String(d.pricing)}`,
      sections: [
        { heading: "1. Executive summary", body: String(d.summary) },
        { heading: "2. Project scope", body: String(d.scope ?? "") },
        { heading: "3. Timeline & milestones", body: String(d.timeline ?? "") },
        { heading: "4. Investment", body: String(d.pricing) },
        { heading: "5. About", body: String(d.about ?? "") },
      ],
      signatures: ["Client approval", "Freelancer"],
    };
  }

  if (typeof d.purpose === "string" && "mutual" in d) {
    const mutual = Boolean(d.mutual);
    const term = String(d.term ?? "2");
    const jurisdiction = String(d.jurisdiction ?? "");
    return {
      kind: "doc",
      title: mutual ? "Mutual NDA" : "One-way NDA",
      subtitle: `${term} yr · ${jurisdiction}`,
      body: String(d.purpose),
      meta: [
        { label: "Type", value: mutual ? "Mutual" : "One-way" },
        { label: "Term", value: `${term} years` },
        { label: "Jurisdiction", value: jurisdiction || "—" },
      ],
      sections: [
        { heading: "1. Purpose", body: `Confidential Information may be shared for: ${d.purpose}` },
        {
          heading: "2. Obligations",
          body: `The Receiving Party${mutual ? " and Disclosing Party (each as a receiving party)" : ""} agree to keep Confidential Information secret and use it only for the stated purpose.`,
        },
        {
          heading: "3. Term",
          body: `Confidentiality obligations last ${term} year(s) from the date of disclosure.`,
        },
        {
          heading: "4. Governing law",
          body: `This Agreement is governed by the laws of ${jurisdiction || "[jurisdiction]"}.`,
        },
      ],
      signatures: ["Disclosing party", "Receiving party"],
    };
  }

  if (typeof d.kind === "string" && typeof d.projectName === "string") {
    const kind = String(d.kind).replace(/-/g, " ");
    const tone = String(d.tone ?? "professional");
    const body = `Hi there,\n\nRegarding ${d.projectName}${d.invoiceAmount ? ` (${money(String(d.invoiceAmount))})` : ""}.\n\nThis ${kind} email is ready to personalize and send.\n\nBest regards`;
    return {
      kind: "email",
      title: `Subject: ${kind} — ${d.projectName}`,
      subtitle: `${tone} tone`,
      body,
      sections: [{ body }],
    };
  }

  if (typeof d.intro === "string" && typeof d.business === "string") {
    const questions = [
      "What is the primary goal of this project?",
      "Who is the decision-maker / point of contact?",
      "What is your preferred kickoff date?",
      d.includeBudget ? "What is your budget range?" : null,
      d.includeBrand ? "Do you have brand guidelines or assets to share?" : null,
      String(d.extra ?? ""),
    ].filter(Boolean) as string[];
    return {
      kind: "doc",
      title: `${d.business} — Client intake`,
      subtitle: d.includeBudget ? "Includes budget question" : "Intake questionnaire",
      body: `${d.intro}\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
      meta: [{ label: "From", value: String(d.business) }],
      sections: [
        { heading: "Instructions", body: String(d.intro) },
        ...questions.map((q, i) => ({
          heading: `${i + 1}. ${q}`,
          body: "_______________________________________________",
        })),
      ],
      signatures: ["Client completed by"],
    };
  }

  if (typeof d.work === "string" && typeof d.cost === "string") {
    return {
      kind: "doc",
      title: "Scope Change Order",
      subtitle: `${String(d.project ?? "")} · +${String(d.days ?? "?")} days`,
      body: `${d.work}\n\nAdditional cost: ${money(d.cost)}`,
      meta: [
        { label: "Project", value: String(d.project ?? "—") },
        { label: "Ref", value: String(d.originalRef ?? "—") },
        { label: "Extra cost", value: money(d.cost) },
        { label: "Extra days", value: String(d.days ?? "—") },
      ],
      sections: [
        { heading: "1. Additional work", body: String(d.work) },
        {
          heading: "2. Cost & timeline",
          body: `Additional fee: ${money(d.cost)}\nTimeline extension: +${String(d.days ?? "?")} day(s)`,
        },
        {
          heading: "3. Original reference",
          body: String(d.originalRef ?? "—"),
        },
      ],
      signatures: ["Client approval", "Freelancer"],
    };
  }

  if (typeof d.income === "string" && typeof d.hoursWeek === "string") {
    const income = Number(d.income);
    const expenses = Number(d.expenses ?? 0);
    const daysOff = Number(d.daysOff ?? 25);
    const hoursWeek = Number(d.hoursWeek);
    const margin = Number(d.margin ?? 20);
    const weeks = Math.max(1, 52 - daysOff / 5);
    const hours = weeks * Math.max(1, hoursWeek);
    const hourly = ((income + expenses) * (1 + margin / 100)) / hours;
    return {
      kind: "calc",
      title: "Rate scenario",
      body: t.blurb,
      stats: [
        { label: "Goal income", value: money(income) },
        { label: "Billable/wk", value: `${hoursWeek}h` },
        { label: "Target rate", value: `${money(Math.round(hourly))}/hr` },
      ],
    };
  }

  if (typeof d.hours === "string" && typeof d.rate === "string" && "expenses" in d && "margin" in d && !("income" in d)) {
    const hours = Number(d.hours);
    const rate = Number(d.rate);
    const expenses = Number(d.expenses ?? 0);
    const margin = Number(d.margin ?? 0);
    const labor = hours * rate;
    const total = (labor + expenses) * (1 + margin / 100);
    return {
      kind: "calc",
      title: "Project quote",
      body: t.blurb,
      stats: [
        { label: "Hours", value: String(hours) },
        { label: "Rate", value: `${money(rate)}/hr` },
        { label: "Quote", value: money(Math.round(total)) },
      ],
    };
  }

  if (typeof d.daysOverdue === "number" || (typeof d.amount === "string" && "type" in d)) {
    const amount = Number(d.amount ?? 0);
    const type = String(d.type ?? "pct");
    const rate = Number(d.rate ?? 0);
    const days = Number(d.daysOverdue ?? 14);
    const fee = type === "flat" ? rate : amount * (rate / 100) * (days / 30);
    return {
      kind: "calc",
      title: "Late fee estimate",
      body: t.blurb,
      stats: [
        { label: "Invoice", value: money(amount) },
        { label: "Overdue", value: `${days}d` },
        { label: "Fee", value: money(Math.round(fee)) },
      ],
    };
  }

  if (typeof d.fixed === "string" && typeof d.price === "string") {
    const fixed = Number(d.fixed);
    const price = Number(d.price);
    const variable = Number(d.variable ?? 0);
    const mode = String(d.mode ?? "project");
    const contrib = price - variable;
    const units = contrib > 0 ? fixed / contrib : 0;
    return {
      kind: "calc",
      title: `Break-even (${mode})`,
      body: t.blurb,
      stats: [
        { label: "Fixed/mo", value: money(fixed) },
        { label: "Price", value: money(price) },
        { label: "Need", value: `${units.toFixed(1)} ${mode === "hour" ? "hrs" : "jobs"}` },
      ],
    };
  }

  if ((d.region === "us" || d.region === "pk") && typeof d.income === "string") {
    return {
      kind: "calc",
      title: `${String(d.region).toUpperCase()} tax scenario`,
      body: t.blurb,
      stats: [
        { label: "Income", value: d.region === "pk" ? `Rs ${Number(d.income).toLocaleString()}` : money(d.income) },
        { label: "Region", value: String(d.region).toUpperCase() },
      ],
    };
  }

  if (Array.isArray(d.tasks) && typeof d.projectName === "string") {
    const tasks = d.tasks as { phase: string; name: string; hours: string }[];
    const hours = tasks.reduce((s, x) => s + Number(x.hours || 0), 0);
    const rate = Number(d.hourlyRate ?? 85);
    const lines = tasks.map((x) => `• ${x.phase}: ${x.name} (${x.hours}h)`).join("\n");
    return {
      kind: "doc",
      title: d.projectName,
      subtitle: `${hours}h · ${money(rate)}/hr · +${d.contingencyPct ?? 15}% contingency`,
      body: lines || t.blurb,
      meta: [
        { label: "Hours", value: String(hours) },
        { label: "Rate", value: `${money(rate)}/hr` },
        { label: "Contingency", value: `${d.contingencyPct ?? 15}%` },
        { label: "Margin", value: `${d.marginPct ?? 20}%` },
      ],
      sections: [
        { heading: "Task breakdown", body: lines },
        {
          heading: "Pricing assumptions",
          body: `Hourly rate: ${money(rate)}\nContingency: ${d.contingencyPct ?? 15}%\nProfit margin: ${d.marginPct ?? 20}%`,
        },
      ],
      signatures: ["Client approval", "Freelancer"],
    };
  }

  return {
    kind: "doc",
    title: t.name,
    subtitle: t.category,
    body: t.blurb,
    sections: [{ body: t.blurb }],
  };
}

const PALETTES = [
  { bar: "from-sky-500 to-cyan-600", accent: "#0284c7" },
  { bar: "from-violet-500 to-indigo-600", accent: "#7c3aed" },
  { bar: "from-rose-500 to-pink-600", accent: "#e11d48" },
  { bar: "from-emerald-500 to-teal-600", accent: "#059669" },
  { bar: "from-amber-500 to-orange-600", accent: "#d97706" },
  { bar: "from-fuchsia-500 to-purple-600", accent: "#c026d3" },
  { bar: "from-blue-600 to-indigo-700", accent: "#2563eb" },
  { bar: "from-lime-500 to-green-600", accent: "#65a30d" },
] as const;

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function TemplateThumb({ t, selected }: { t: FlTemplateMeta; selected: boolean }) {
  const preview = buildPreview(t as FlTemplateMeta & { data?: Record<string, unknown> });
  const pal = PALETTES[hashStr(t.id) % PALETTES.length]!;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-white text-left shadow-sm transition-shadow dark:bg-zinc-950",
        selected ? "border-brand ring-2 ring-brand/35 shadow-md" : "border-border hover:border-brand/40",
      )}
    >
      <div className={cn("flex items-center justify-between gap-1 bg-gradient-to-r px-2 py-1 text-[9px] font-bold text-white", pal.bar)}>
        <span className="truncate uppercase tracking-wide">
          {preview.kind === "email" ? "Email" : preview.kind === "calc" ? "Calculator" : "Document"}
        </span>
        <span className="shrink-0 opacity-90">{selected ? "Applied" : "Preview"}</span>
      </div>

      <div className="space-y-1 p-2" style={{ minHeight: 118 }}>
        <p className="line-clamp-2 text-[11px] font-bold leading-snug text-foreground">{preview.title}</p>
        {preview.subtitle && (
          <p className="line-clamp-1 text-[9px] font-medium" style={{ color: pal.accent }}>
            {preview.subtitle}
          </p>
        )}

        {preview.kind === "calc" && preview.stats ? (
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {preview.stats.slice(0, 3).map((s) => (
              <div key={s.label} className="rounded-md bg-surface-2 px-1 py-1 text-center">
                <p className="text-[8px] uppercase tracking-wide text-muted">{s.label}</p>
                <p className="truncate text-[10px] font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-0.5 line-clamp-5 whitespace-pre-wrap text-[9px] leading-relaxed text-muted">
            {preview.body}
          </p>
        )}
      </div>
    </div>
  );
}

function TemplateDetail({
  t,
  onJumpToLive,
}: {
  t: FlTemplateMeta & { data?: Record<string, unknown> };
  onJumpToLive: () => void;
}) {
  const preview = buildPreview(t);
  const brand = {
    ...DEFAULT_DOC_BRAND,
    watermarkEnabled: preview.kind === "doc",
    watermarkText: "TEMPLATE",
  };

  return (
    <div className="rounded-xl border border-brand/40 bg-brand/5 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand">Selected template — full detail</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{t.name}</p>
          <p className="text-xs text-muted">{t.category} · Applied to form, live preview & download</p>
        </div>
        <button
          type="button"
          onClick={onJumpToLive}
          className="shrink-0 rounded-lg border border-brand/30 bg-surface px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10"
        >
          Jump to live preview
        </button>
      </div>

      {preview.kind === "calc" && preview.stats ? (
        <div className="space-y-2 rounded-lg border border-border bg-surface p-3">
          <p className="text-sm font-bold">{preview.title}</p>
          <p className="text-xs text-muted">{preview.body}</p>
          <div className="grid grid-cols-3 gap-2">
            {preview.stats.map((s) => (
              <div key={s.label} className="rounded-md bg-surface-2 px-2 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wide text-muted">{s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : preview.kind === "email" ? (
        <div className="rounded-lg border border-border bg-surface p-3">
          <p className="text-xs font-semibold text-foreground">{preview.title}</p>
          {preview.subtitle ? <p className="mt-0.5 text-[11px] text-muted">{preview.subtitle}</p> : null}
          <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
            {preview.body}
          </pre>
        </div>
      ) : (
        <BrandedDocPreview
          docType="Template"
          title={preview.title}
          subtitle={preview.subtitle}
          meta={preview.meta}
          sections={preview.sections ?? [{ body: preview.body }]}
          signatures={preview.signatures}
          footerLeft={`${t.name} · template detail`}
          brand={brand}
          caption=""
          className="border-0 bg-transparent p-0 shadow-none"
        />
      )}
    </div>
  );
}

export function FreelancerTemplateBrowser<T extends FlTemplateMeta>({
  label = "Template library (50)",
  hint = "Select a template to load it into the form, live preview, and download.",
  templates,
  selectedId,
  onSelect,
  allowBlank = true,
  onBlank,
  previewAnchorId = "live-doc-preview",
}: Props<T>) {
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const detailRef = React.useRef<HTMLDivElement>(null);

  const categories = React.useMemo(() => {
    const set = new Set(templates.map((t) => t.category));
    return ["all", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [templates]);

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (!needle) return true;
      return (
        t.name.toLowerCase().includes(needle) ||
        t.blurb.toLowerCase().includes(needle) ||
        t.category.toLowerCase().includes(needle)
      );
    });
  }, [templates, q, category]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, T[]>();
    for (const t of filtered) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const selected = React.useMemo(
    () => (selectedId ? templates.find((t) => t.id === selectedId) ?? null : null),
    [templates, selectedId],
  );

  function jumpToLive() {
    const el = document.getElementById(previewAnchorId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSelect(t: T) {
    onSelect(t);
    // Show detail + live preview after React commits state
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      window.setTimeout(jumpToLive, 120);
    });
  }

  return (
    <Field label={label} hint={`${hint} · ${templates.length} templates`}>
      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="sm:flex-1"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 rounded-xl border border-border bg-surface px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All categories" : c}
              </option>
            ))}
          </select>
        </div>

        {allowBlank && onBlank && (
          <button
            type="button"
            onClick={() => {
              onBlank();
            }}
            className={cn(
              "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
              selectedId === null
                ? "border-brand bg-brand/10 font-semibold text-brand"
                : "border-border bg-surface hover:bg-surface-2",
            )}
          >
            Blank / keep current edits
          </button>
        )}

        {selected ? (
          <div ref={detailRef}>
            <TemplateDetail
              t={selected as FlTemplateMeta & { data?: Record<string, unknown> }}
              onJumpToLive={jumpToLive}
            />
          </div>
        ) : null}

        <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-border bg-surface-2/40 p-2 sm:max-h-[32rem] sm:p-3">
          {grouped.length === 0 ? (
            <p className="p-4 text-sm text-muted">No templates match. Try another search.</p>
          ) : (
            <div className="space-y-4">
              {grouped.map(([cat, items]) => (
                <div key={cat}>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
                    {cat} · {items.length}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((t) => {
                      const isSelected = selectedId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelect(t)}
                          className={cn(
                            "group text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected && "scale-[1.01]",
                          )}
                        >
                          <TemplateThumb t={t} selected={isSelected} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Field>
  );
}
