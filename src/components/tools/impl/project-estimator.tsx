"use client";

import * as React from "react";
import Link from "next/link";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Stat, Notice, Output, CopyButton } from "@/components/tools/shared";
import { exportBrandedPdf } from "@/lib/pdf-doc";
import {
  DEFAULT_DOC_BRAND,
  DocBrandControls,
  toPdfTheme,
  toPdfWatermark,
  type DocBrandState,
} from "./DocBrandControls";

const n = (v: string) => parseFloat(v);
const fmt = (x: number, d = 2) =>
  Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";

const CURRENCIES = [
  { code: "USD", sym: "$", label: "USD ($)" },
  { code: "EUR", sym: "€", label: "EUR (€)" },
  { code: "GBP", sym: "£", label: "GBP (£)" },
  { code: "PKR", sym: "Rs ", label: "PKR (Rs)" },
  { code: "INR", sym: "₹", label: "INR (₹)" },
  { code: "CAD", sym: "C$", label: "CAD (C$)" },
  { code: "AUD", sym: "A$", label: "AUD (A$)" },
];

type TaskRow = { id: string; phase: string; name: string; hours: string; rateOverride: string };
type ExpenseRow = { id: string; name: string; amount: string };

const uid = () => Math.random().toString(36).slice(2, 10);

const PROJECT_TEMPLATES = {
  web: {
    label: "Website Design & Development",
    tasks: [
      { phase: "Discovery", name: "Kickoff & requirements workshop", hours: "4" },
      { phase: "Discovery", name: "Sitemap, wireframes & content plan", hours: "10" },
      { phase: "Design", name: "Visual design (all pages)", hours: "24" },
      { phase: "Design", name: "Design revisions (2 rounds)", hours: "8" },
      { phase: "Development", name: "Responsive frontend build", hours: "32" },
      { phase: "Development", name: "CMS integration & forms", hours: "14" },
      { phase: "QA", name: "Cross-browser QA & fixes", hours: "8" },
      { phase: "Launch", name: "Deployment, DNS & handoff", hours: "4" },
    ],
    expenses: [
      { name: "Stock photos / assets", amount: "150" },
      { name: "Premium fonts or plugins", amount: "80" },
    ],
  },
  design: {
    label: "Brand & Graphic Design",
    tasks: [
      { phase: "Discovery", name: "Brand questionnaire & moodboard", hours: "4" },
      { phase: "Concept", name: "Logo concepts (3 directions)", hours: "12" },
      { phase: "Refinement", name: "Logo refinement & color palette", hours: "8" },
      { phase: "Deliverables", name: "Brand guidelines document", hours: "10" },
      { phase: "Deliverables", name: "Social media template pack", hours: "8" },
      { phase: "Deliverables", name: "Business card & letterhead", hours: "4" },
    ],
    expenses: [{ name: "Stock imagery licensing", amount: "60" }],
  },
  content: {
    label: "Content Writing Package",
    tasks: [
      { phase: "Strategy", name: "Keyword research & content briefs", hours: "6" },
      { phase: "Writing", name: "Long-form pillar article (×2)", hours: "16" },
      { phase: "Writing", name: "Supporting blog posts (×4)", hours: "16" },
      { phase: "Editing", name: "Editing, SEO meta & formatting", hours: "6" },
      { phase: "Delivery", name: "CMS upload & internal linking", hours: "4" },
    ],
    expenses: [{ name: "SEO / research tools (pass-through)", amount: "40" }],
  },
  consulting: {
    label: "Consulting Engagement",
    tasks: [
      { phase: "Discovery", name: "Stakeholder interviews & data review", hours: "8" },
      { phase: "Analysis", name: "Process audit & gap analysis", hours: "16" },
      { phase: "Delivery", name: "Written report & recommendations", hours: "12" },
      { phase: "Workshop", name: "Roadmap workshop with leadership", hours: "4" },
      { phase: "Support", name: "30-day email follow-up support", hours: "6" },
    ],
    expenses: [{ name: "Travel / meeting expenses", amount: "200" }],
  },
  mobile: {
    label: "Mobile App Development",
    tasks: [
      { phase: "Discovery", name: "Requirements & technical spec", hours: "12" },
      { phase: "Design", name: "UX flows & UI screens", hours: "24" },
      { phase: "Development", name: "Core app build (MVP features)", hours: "80" },
      { phase: "Development", name: "API integration & auth", hours: "20" },
      { phase: "QA", name: "Device testing & bug fixes", hours: "16" },
      { phase: "Launch", name: "App store submission & docs", hours: "8" },
    ],
    expenses: [
      { name: "Apple / Google developer accounts", amount: "125" },
      { name: "Third-party API credits", amount: "100" },
    ],
  },
  custom: {
    label: "Blank (custom project)",
    tasks: [{ phase: "Phase 1", name: "Task description", hours: "8" }],
    expenses: [],
  },
} as const;

type TemplateKey = keyof typeof PROJECT_TEMPLATES;

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface-1 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function makeTasks(template: TemplateKey): TaskRow[] {
  return PROJECT_TEMPLATES[template].tasks.map((t) => ({
    id: uid(),
    phase: t.phase,
    name: t.name,
    hours: t.hours,
    rateOverride: "",
  }));
}

function makeExpenses(template: TemplateKey): ExpenseRow[] {
  return PROJECT_TEMPLATES[template].expenses.map((e) => ({
    id: uid(),
    name: e.name,
    amount: e.amount,
  }));
}

export function ProjectEstimator() {
  const [template, setTemplate] = React.useState<TemplateKey>("web");
  const [projectName, setProjectName] = React.useState("Website Redesign");
  const [clientName, setClientName] = React.useState("Acme Corp");
  const [currency, setCurrency] = React.useState("USD");
  const [hourlyRate, setHourlyRate] = React.useState("85");
  const [hoursPerWeek, setHoursPerWeek] = React.useState("25");
  const [contingencyPct, setContingencyPct] = React.useState("15");
  const [marginPct, setMarginPct] = React.useState("20");
  const [discountPct, setDiscountPct] = React.useState("0");
  const [taxReservePct, setTaxReservePct] = React.useState("30");
  const [notes, setNotes] = React.useState(
    "Assumes client provides content and feedback within 3 business days. Two revision rounds included per deliverable.",
  );
  const [tasks, setTasks] = React.useState<TaskRow[]>(() => makeTasks("web"));
  const [expenses, setExpenses] = React.useState<ExpenseRow[]>(() => makeExpenses("web"));
  const [brand, setBrand] = React.useState<DocBrandState>({ ...DEFAULT_DOC_BRAND, watermarkText: "ESTIMATE" });
  const [busy, setBusy] = React.useState(false);

  const sym = CURRENCIES.find((c) => c.code === currency)?.sym ?? "$";

  function applyTemplate(key: TemplateKey) {
    setTemplate(key);
    setTasks(makeTasks(key));
    setExpenses(makeExpenses(key));
    if (key !== "custom") {
      setProjectName(PROJECT_TEMPLATES[key].label);
    }
  }

  function updateTask(id: string, patch: Partial<TaskRow>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function updateExpense(id: string, patch: Partial<ExpenseRow>) {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  const calc = React.useMemo(() => {
    const baseRate = n(hourlyRate);
    let totalHours = 0;
    let laborCost = 0;

    const taskLines = tasks.map((t) => {
      const hrs = Math.max(0, n(t.hours) || 0);
      const rate = t.rateOverride.trim() ? n(t.rateOverride) : baseRate;
      const cost = hrs * rate;
      totalHours += hrs;
      laborCost += cost;
      return { ...t, hrs, rate, cost };
    });

    const expenseTotal = expenses.reduce((sum, e) => sum + Math.max(0, n(e.amount) || 0), 0);
    const subtotal = laborCost + expenseTotal;
    const contingency = subtotal * (Math.max(0, n(contingencyPct)) / 100);
    const afterContingency = subtotal + contingency;
    const margin = afterContingency * (Math.max(0, n(marginPct)) / 100);
    const beforeDiscount = afterContingency + margin;
    const discount = beforeDiscount * (Math.max(0, n(discountPct)) / 100);
    const fixedQuote = beforeDiscount - discount;
    const effectiveRate = totalHours > 0 ? fixedQuote / totalHours : 0;
    const weeklyHours = Math.max(1, n(hoursPerWeek) || 1);
    const weeks = totalHours / weeklyHours;
    const taxReserve = fixedQuote * (Math.max(0, n(taxReservePct)) / 100);
    const netAfterTax = fixedQuote - taxReserve;
    const hourlyOnly = totalHours * baseRate + expenseTotal;
    const retainerMonthly = fixedQuote / Math.max(weeks / 4.33, 1);

    return {
      taskLines,
      totalHours,
      laborCost,
      expenseTotal,
      subtotal,
      contingency,
      margin,
      discount,
      fixedQuote,
      effectiveRate,
      weeks,
      taxReserve,
      netAfterTax,
      hourlyOnly,
      retainerMonthly,
    };
  }, [tasks, expenses, hourlyRate, contingencyPct, marginPct, discountPct, taxReservePct, hoursPerWeek]);

  const summaryText = React.useMemo(() => {
    const lines = [
      `PROJECT ESTIMATE — ${projectName}`,
      `Client: ${clientName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      "",
      "TASK BREAKDOWN",
      ...calc.taskLines.map(
        (t) =>
          `• [${t.phase}] ${t.name}: ${fmt(t.hrs, 1)}h × ${sym}${fmt(t.rate)}/hr = ${sym}${fmt(t.cost)}`,
      ),
      "",
      "EXPENSES",
      ...(expenses.length
        ? expenses.map((e) => `• ${e.name}: ${sym}${fmt(Math.max(0, n(e.amount) || 0))}`)
        : ["• None"]),
      "",
      "FINANCIAL SUMMARY",
      `Total hours: ${fmt(calc.totalHours, 1)}`,
      `Labor: ${sym}${fmt(calc.laborCost)}`,
      `Expenses: ${sym}${fmt(calc.expenseTotal)}`,
      `Subtotal: ${sym}${fmt(calc.subtotal)}`,
      `Contingency (${contingencyPct}%): ${sym}${fmt(calc.contingency)}`,
      `Profit margin (${marginPct}%): ${sym}${fmt(calc.margin)}`,
      ...(n(discountPct) > 0 ? [`Discount (${discountPct}%): −${sym}${fmt(calc.discount)}`] : []),
      "",
      `RECOMMENDED FIXED QUOTE: ${sym}${fmt(calc.fixedQuote)}`,
      `Effective hourly rate: ${sym}${fmt(calc.effectiveRate)}/hr`,
      `Estimated timeline: ${fmt(calc.weeks, 1)} weeks (${hoursPerWeek} hrs/week)`,
      "",
      "PRICING COMPARISON",
      `Fixed price (recommended): ${sym}${fmt(calc.fixedQuote)}`,
      `Pure hourly (${fmt(calc.totalHours, 1)}h × ${sym}${hourlyRate}): ${sym}${fmt(calc.hourlyOnly)}`,
      `Monthly retainer equivalent: ${sym}${fmt(calc.retainerMonthly)}/mo`,
      "",
      `Tax reserve (${taxReservePct}%): ${sym}${fmt(calc.taxReserve)}`,
      `Estimated net after tax reserve: ${sym}${fmt(calc.netAfterTax)}`,
      "",
      "ASSUMPTIONS & NOTES",
      notes,
      "",
      "Disclaimer: Planning estimate only — not a binding quote or tax advice.",
    ];
    return lines.join("\n");
  }, [projectName, clientName, calc, expenses, sym, contingencyPct, marginPct, discountPct, taxReservePct, hoursPerWeek, hourlyRate, notes]);

  async function exportPdf() {
    setBusy(true);
    try {
      const taskTable = calc.taskLines
        .map((t) => `${t.phase} — ${t.name}\n  ${fmt(t.hrs, 1)} hrs × ${sym}${fmt(t.rate)}/hr = ${sym}${fmt(t.cost)}`)
        .join("\n\n");

      const expenseBody =
        expenses.length > 0
          ? expenses.map((e) => `• ${e.name}: ${sym}${fmt(Math.max(0, n(e.amount) || 0))}`).join("\n")
          : "No pass-through expenses included.";

      await exportBrandedPdf({
        docType: "Project estimate",
        title: "Freelance Project Estimate",
        subtitle: projectName,
        meta: [
          { label: "Client", value: clientName },
          { label: "Date", value: new Date().toLocaleDateString() },
          { label: "Recommended quote", value: `${sym}${fmt(calc.fixedQuote)}` },
        ],
        sections: [
          { heading: "Task breakdown", body: taskTable },
          { heading: "Project expenses", body: expenseBody },
          {
            heading: "Financial summary",
            body: [
              `Total hours: ${fmt(calc.totalHours, 1)}`,
              `Labor: ${sym}${fmt(calc.laborCost)}`,
              `Expenses: ${sym}${fmt(calc.expenseTotal)}`,
              `Contingency (${contingencyPct}%): ${sym}${fmt(calc.contingency)}`,
              `Profit margin (${marginPct}%): ${sym}${fmt(calc.margin)}`,
              n(discountPct) > 0 ? `Discount (${discountPct}%): −${sym}${fmt(calc.discount)}` : "",
              "",
              `Recommended fixed quote: ${sym}${fmt(calc.fixedQuote)}`,
              `Effective hourly rate: ${sym}${fmt(calc.effectiveRate)}/hr`,
              `Estimated timeline: ${fmt(calc.weeks, 1)} weeks`,
            ]
              .filter(Boolean)
              .join("\n"),
          },
          {
            heading: "Pricing comparison",
            body: [
              `Fixed price: ${sym}${fmt(calc.fixedQuote)}`,
              `Pure hourly: ${sym}${fmt(calc.hourlyOnly)}`,
              `Retainer equivalent: ${sym}${fmt(calc.retainerMonthly)}/month`,
            ].join("\n"),
          },
          { heading: "Assumptions & notes", body: notes },
        ],
        signatures: ["Client approval", "Freelancer"],
        theme: toPdfTheme(brand),
        watermark: toPdfWatermark(brand),
        footerLeft: `Estimate for ${clientName}`,
        filename: "freelance-project-estimate.pdf",
      });
    } finally {
      setBusy(false);
    }
  }

  const undercharging = calc.effectiveRate < n(hourlyRate) * 0.9;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Break a project into phases and tasks, add expenses and buffers, and get a profit-aware fixed quote with
        timeline and pricing comparisons. Everything runs privately in your browser.
      </Notice>
      <Notice tone="info">
        Need your baseline hourly rate first? Use the{" "}
        <Link href="/freelancer-tools/rate-calculator" className="font-semibold text-brand underline">
          Freelance Rate Calculator
        </Link>
        , then turn the estimate into a{" "}
        <Link href="/freelancer-tools/proposal-generator" className="font-semibold text-brand underline">
          client proposal
        </Link>
        .
      </Notice>

      <Section title="Project setup">
        <Field label="Project template">
          <Select value={template} onChange={(e) => applyTemplate(e.target.value as TemplateKey)}>
            {(Object.keys(PROJECT_TEMPLATES) as TemplateKey[]).map((k) => (
              <option key={k} value={k}>
                {PROJECT_TEMPLATES[k].label}
              </option>
            ))}
          </Select>
        </Field>
        <Row>
          <Field label="Project name">
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </Field>
          <Field label="Client name">
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Base hourly rate">
            <Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
          </Field>
        </Row>
        <Field label="Billable hours per week (for timeline)">
          <Input type="number" min="1" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} />
        </Field>
      </Section>

      <Section title="Task breakdown">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 pr-2 font-medium">Phase</th>
                <th className="pb-2 pr-2 font-medium">Task</th>
                <th className="pb-2 pr-2 font-medium w-20">Hours</th>
                <th className="pb-2 pr-2 font-medium w-24">Rate override</th>
                <th className="pb-2 font-medium w-24">Subtotal</th>
                <th className="pb-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const hrs = Math.max(0, n(t.hours) || 0);
                const rate = t.rateOverride.trim() ? n(t.rateOverride) : n(hourlyRate);
                const sub = hrs * rate;
                return (
                  <tr key={t.id} className="border-b border-border/60">
                    <td className="py-2 pr-2">
                      <Input
                        value={t.phase}
                        onChange={(e) => updateTask(t.id, { phase: e.target.value })}
                        className="text-xs"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        value={t.name}
                        onChange={(e) => updateTask(t.id, { name: e.target.value })}
                        className="text-xs"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={t.hours}
                        onChange={(e) => updateTask(t.id, { hours: e.target.value })}
                        className="text-xs"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Default"
                        value={t.rateOverride}
                        onChange={(e) => updateTask(t.id, { rateOverride: e.target.value })}
                        className="text-xs"
                      />
                    </td>
                    <td className="py-2 pr-2 text-muted whitespace-nowrap">
                      {sym}
                      {fmt(sub)}
                    </td>
                    <td className="py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted"
                        onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                        disabled={tasks.length <= 1}
                        aria-label="Remove task"
                      >
                        ×
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            setTasks((prev) => [
              ...prev,
              { id: uid(), phase: "Phase", name: "New task", hours: "4", rateOverride: "" },
            ])
          }
        >
          + Add task
        </Button>
      </Section>

      <Section title="Project expenses">
        {expenses.length === 0 ? (
          <p className="text-sm text-muted">No pass-through expenses. Add software, stock assets, or travel costs.</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((e) => (
              <div key={e.id} className="grid gap-2 sm:grid-cols-[1fr_120px_32px]">
                <Input value={e.name} onChange={(ev) => updateExpense(e.id, { name: ev.target.value })} />
                <Input
                  type="number"
                  min="0"
                  value={e.amount}
                  onChange={(ev) => updateExpense(e.id, { amount: ev.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 w-8 p-0 text-muted"
                  onClick={() => setExpenses((prev) => prev.filter((x) => x.id !== e.id))}
                  aria-label="Remove expense"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setExpenses((prev) => [...prev, { id: uid(), name: "New expense", amount: "0" }])}
        >
          + Add expense
        </Button>
      </Section>

      <Section title="Buffers & profit">
        <Row>
          <Field label="Contingency buffer (%)">
            <Input
              type="number"
              min="0"
              max="50"
              value={contingencyPct}
              onChange={(e) => setContingencyPct(e.target.value)}
            />
          </Field>
          <Field label="Profit margin (%)">
            <Input type="number" min="0" max="100" value={marginPct} onChange={(e) => setMarginPct(e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Client discount (%)">
            <Input
              type="number"
              min="0"
              max="50"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
            />
          </Field>
          <Field label="Tax reserve (% of quote)">
            <Input
              type="number"
              min="0"
              max="60"
              value={taxReservePct}
              onChange={(e) => setTaxReservePct(e.target.value)}
            />
          </Field>
        </Row>
        <Field label="Assumptions & scope notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="font-sans text-sm" />
        </Field>
      </Section>

      <Section title="Estimate results">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total hours" value={fmt(calc.totalHours, 1)} />
          <Stat label="Labor cost" value={`${sym}${fmt(calc.laborCost)}`} />
          <Stat label="Expenses" value={`${sym}${fmt(calc.expenseTotal)}`} />
          <Stat label="Contingency" value={`${sym}${fmt(calc.contingency)}`} />
          <Stat label="Profit margin" value={`${sym}${fmt(calc.margin)}`} />
          <Stat label="Recommended quote" value={`${sym}${fmt(calc.fixedQuote)}`} />
          <Stat label="Effective rate" value={`${sym}${fmt(calc.effectiveRate)}/hr`} />
          <Stat label="Timeline" value={`${fmt(calc.weeks, 1)} wks`} />
        </div>

        {undercharging && (
          <Notice tone="error">
            Your effective rate ({sym}
            {fmt(calc.effectiveRate)}/hr) is below your base rate ({sym}
            {hourlyRate}/hr) after buffers. Increase margin, reduce discount, or trim scope.
          </Notice>
        )}

        <div className="rounded-lg border border-border bg-surface-2 p-3 text-sm space-y-1">
          <p className="font-semibold text-foreground">Pricing model comparison</p>
          <p>
            Fixed price (recommended): <strong>{sym}{fmt(calc.fixedQuote)}</strong>
          </p>
          <p>
            Pure hourly ({fmt(calc.totalHours, 1)}h × {sym}{hourlyRate}): {sym}{fmt(calc.hourlyOnly)}
          </p>
          <p>
            Monthly retainer equivalent: {sym}{fmt(calc.retainerMonthly)}/mo
          </p>
          <p className="text-muted pt-1">
            Tax reserve ({taxReservePct}%): {sym}{fmt(calc.taxReserve)} → est. net {sym}{fmt(calc.netAfterTax)}
          </p>
        </div>
      </Section>

      <DocBrandControls value={brand} onChange={setBrand} />

      <Field label="Full estimate summary">
        <Output value={summaryText} rows={14} filename="project-estimate.txt" />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
          {busy ? "Generating…" : "Download estimate PDF"}
        </Button>
        <CopyButton value={summaryText} label="Copy summary" size="md" />
      </div>
    </div>
  );
}
