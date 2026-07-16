"use client";

import * as React from "react";
import Link from "next/link";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Stat, Notice, Output } from "@/components/tools/shared";
import { createPdfWriter } from "@/lib/pdf-doc";
import { download } from "@/lib/utils";

const n = (v: string) => parseFloat(v);
const fmt = (x: number, d = 2) =>
  Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed whitespace-pre-wrap">
      {children}
    </div>
  );
}

function InvoiceLink() {
  return (
    <Notice tone="info">
      Need an invoice after you win the job? Use the free{" "}
      <Link href="/converters-generators/invoice-generator" className="font-semibold text-brand underline">
        Invoice Generator
      </Link>
      .
    </Notice>
  );
}

/* ============================ 1. Contract ============================ */
export function ContractGenerator() {
  const [freelancer, setFreelancer] = React.useState("Alex Freelance LLC");
  const [client, setClient] = React.useState("Acme Corp");
  const [scope, setScope] = React.useState("Design and develop a 5-page marketing website, including desktop and mobile layouts.");
  const [amount, setAmount] = React.useState("3500");
  const [schedule, setSchedule] = React.useState("milestone");
  const [deadline, setDeadline] = React.useState("2026-08-30");
  const [revisions, setRevisions] = React.useState("2");
  const [lateFee, setLateFee] = React.useState("1.5");
  const [ip, setIp] = React.useState("transfers");
  const [busy, setBusy] = React.useState(false);

  const ipText =
    ip === "transfers"
      ? "Intellectual property in the deliverables transfers to the Client upon full payment."
      : ip === "retains"
        ? "Freelancer retains all IP; Client receives a perpetual, non-exclusive license to use the deliverables for their business."
        : "Freelancer grants Client a limited license to use the deliverables as specified in the scope; Freelancer retains ownership of tools, frameworks, and pre-existing materials.";

  const scheduleText =
    schedule === "upfront"
      ? `100% ($${amount}) due before work begins.`
      : schedule === "completion"
        ? `100% ($${amount}) due upon project completion and delivery.`
        : `50% ($${(n(amount) / 2).toFixed(2)}) upfront; 50% upon completion.`;

  const body = `FREELANCE SERVICES AGREEMENT

This Agreement is between ${freelancer || "[Freelancer]"} ("Freelancer") and ${client || "[Client]"} ("Client").

1. SCOPE OF WORK
${scope || "[Describe deliverables]"}

2. TIMELINE
Work is targeted for completion by ${deadline || "[date]"}, subject to timely Client feedback.

3. PAYMENT
Total fee: $${amount || "0"}.
Payment schedule: ${scheduleText}
Late payments may incur a fee of ${lateFee || "0"}% per month on unpaid balances.

4. REVISIONS
Up to ${revisions || "0"} rounds of revisions are included. Additional revisions may be billed separately.

5. INTELLECTUAL PROPERTY
${ipText}

6. TERMINATION
Either party may terminate with written notice. Client pays for work completed through the termination date. Deposits are non-refundable once work has started, unless otherwise agreed in writing.

7. GENERAL
This document is a practical template, not legal advice. Have a qualified attorney review for your jurisdiction before signing.

Signatures
Freelancer: ________________________ Date: ________
Client: ____________________________ Date: ________`;

  async function exportPdf() {
    setBusy(true);
    try {
      const w = await createPdfWriter();
      w.draw("FREELANCE SERVICES AGREEMENT", { size: 16, bold: true });
      w.gap(6);
      for (const line of body.split("\n")) w.draw(line || " ", { size: 10, gap: 3 });
      await w.save("freelance-contract.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        A solid freelance contract usually covers scope, payment schedule, timeline, revisions, IP ownership,
        late fees, and how either side can end the engagement. Fill the fields — preview updates live — then
        download a PDF. This is a template, not legal advice.
      </Notice>
      <InvoiceLink />
      <Row>
        <Field label="Freelancer / business name">
          <Input value={freelancer} onChange={(e) => setFreelancer(e.target.value)} />
        </Field>
        <Field label="Client name">
          <Input value={client} onChange={(e) => setClient(e.target.value)} />
        </Field>
      </Row>
      <Field label="Project scope / deliverables">
        <Textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={4} className="font-sans text-sm" />
      </Field>
      <Row>
        <Field label="Payment amount ($)">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Payment schedule">
          <Select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
            <option value="upfront">Upfront</option>
            <option value="milestone">Milestone (50/50)</option>
            <option value="completion">On completion</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Deadline">
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Revision rounds included">
          <Input type="number" value={revisions} onChange={(e) => setRevisions(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Late payment fee (% / month)">
          <Input type="number" value={lateFee} onChange={(e) => setLateFee(e.target.value)} />
        </Field>
        <Field label="IP ownership">
          <Select value={ip} onChange={(e) => setIp(e.target.value)}>
            <option value="transfers">Transfers to client on payment</option>
            <option value="retains">Freelancer retains; client licensed</option>
            <option value="licensed">Limited license; freelancer keeps tools</option>
          </Select>
        </Field>
      </Row>
      <Field label="Live preview">
        <Preview>{body}</Preview>
      </Field>
      <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
        {busy ? "Generating…" : "Download PDF contract"}
      </Button>
    </div>
  );
}

/* ============================ 2. Proposal ============================ */
const PROPOSAL_TEMPLATES = {
  web: {
    summary: "Your current site underperforms on mobile and conversions. We’ll redesign and rebuild a fast, conversion-focused marketing site.",
    scope: "Included: wireframes, UI design, responsive build, basic SEO setup, 2 revision rounds.\nExcluded: copywriting, photography, ongoing hosting/maintenance.",
    about: "We specialize in conversion-focused websites for small businesses and startups.",
  },
  writing: {
    summary: "You need consistent, SEO-friendly content that ranks and converts. We’ll plan and deliver a content package tailored to your audience.",
    scope: "Included: keyword research outline, drafts, 1 revision round per piece, formatting for CMS.\nExcluded: graphic design, paid distribution.",
    about: "Professional content writer focused on clear, search-friendly articles for B2B and SaaS brands.",
  },
  consulting: {
    summary: "We’ll audit your current process, identify bottlenecks, and deliver a prioritized action plan your team can execute.",
    scope: "Included: discovery call, audit report, roadmap workshop, 30-day email support.\nExcluded: hands-on implementation unless scoped separately.",
    about: "Independent consultant helping teams ship clearer processes and measurable outcomes.",
  },
} as const;

export function ProposalGenerator() {
  const [template, setTemplate] = React.useState<keyof typeof PROPOSAL_TEMPLATES | "blank">("web");
  const [client, setClient] = React.useState("Acme Corp");
  const [summary, setSummary] = React.useState<string>(PROPOSAL_TEMPLATES.web.summary);
  const [scope, setScope] = React.useState<string>(PROPOSAL_TEMPLATES.web.scope);
  const [timeline, setTimeline] = React.useState("Week 1: Discovery\nWeek 2–3: Design\nWeek 4–5: Build\nWeek 6: Launch");
  const [pricing, setPricing] = React.useState("Discovery & strategy — $500\nDesign — $1,500\nDevelopment — $2,000\nTotal — $4,000");
  const [about, setAbout] = React.useState<string>(PROPOSAL_TEMPLATES.web.about);
  const [busy, setBusy] = React.useState(false);

  function applyTemplate(key: keyof typeof PROPOSAL_TEMPLATES | "blank") {
    setTemplate(key);
    if (key === "blank") return;
    const t = PROPOSAL_TEMPLATES[key];
    setSummary(t.summary);
    setScope(t.scope);
    setAbout(t.about);
  }

  const body = `PROJECT PROPOSAL
Prepared for: ${client}
Date: ${new Date().toLocaleDateString()}

1. EXECUTIVE SUMMARY
${summary}

2. PROJECT SCOPE
${scope}

3. TIMELINE & MILESTONES
${timeline}

4. INVESTMENT
${pricing}

5. ABOUT
${about}

Next step: Reply to confirm, and we’ll send a contract and kickoff checklist.`;

  async function exportPdf() {
    setBusy(true);
    try {
      const w = await createPdfWriter();
      w.draw("PROJECT PROPOSAL", { size: 16, bold: true });
      w.gap(4);
      for (const line of body.split("\n")) w.draw(line || " ", { size: 10, gap: 3 });
      await w.save("freelance-proposal.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Start from a template or write your own. Export a clean PDF you can email to clients — private in your browser.
      </Notice>
      <InvoiceLink />
      <Field label="Starter template">
        <Select
          value={template}
          onChange={(e) => applyTemplate(e.target.value as keyof typeof PROPOSAL_TEMPLATES | "blank")}
        >
          <option value="web">Web Design Proposal</option>
          <option value="writing">Content Writing Proposal</option>
          <option value="consulting">Consulting Proposal</option>
          <option value="blank">Blank (keep current text)</option>
        </Select>
      </Field>
      <Field label="Client name">
        <Input value={client} onChange={(e) => setClient(e.target.value)} />
      </Field>
      <Field label="Executive summary">
        <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="font-sans text-sm" />
      </Field>
      <Field label="Scope (included / excluded)">
        <Textarea value={scope} onChange={(e) => setScope(e.target.value)} rows={4} className="font-sans text-sm" />
      </Field>
      <Field label="Timeline & milestones">
        <Textarea value={timeline} onChange={(e) => setTimeline(e.target.value)} rows={4} className="font-sans text-sm" />
      </Field>
      <Field label="Itemized pricing">
        <Textarea value={pricing} onChange={(e) => setPricing(e.target.value)} rows={4} className="font-sans text-sm" />
      </Field>
      <Field label="About you">
        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={3} className="font-sans text-sm" />
      </Field>
      <Field label="Live preview">
        <Preview>{body}</Preview>
      </Field>
      <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
        {busy ? "Generating…" : "Download PDF proposal"}
      </Button>
    </div>
  );
}

/* ============================ 3. NDA ============================ */
export function NdaGenerator() {
  const [disclosing, setDisclosing] = React.useState("Acme Corp");
  const [receiving, setReceiving] = React.useState("Alex Freelance LLC");
  const [purpose, setPurpose] = React.useState("Evaluating a potential freelance engagement and reviewing product/business information.");
  const [term, setTerm] = React.useState("2");
  const [mutual, setMutual] = React.useState(true);
  const [jurisdiction, setJurisdiction] = React.useState("State of Delaware, USA");
  const [busy, setBusy] = React.useState(false);

  const body = `NON-DISCLOSURE AGREEMENT (${mutual ? "MUTUAL" : "ONE-WAY"})

This Agreement is entered into by ${disclosing || "[Disclosing Party]"} ("Disclosing Party") and ${receiving || "[Receiving Party]"} ("Receiving Party").

1. PURPOSE
Confidential Information may be shared for: ${purpose}

2. OBLIGATIONS
The Receiving Party${mutual ? " and Disclosing Party (each as a receiving party)" : ""} agree to keep Confidential Information secret, use it only for the stated purpose, and not disclose it to third parties without prior written consent, except as required by law.

3. TERM
Confidentiality obligations last ${term || "2"} year(s) from the date of disclosure, or until the information becomes public through no fault of the receiving party.

4. EXCLUSIONS
Information that is public, independently developed, or rightfully received from another source without duty of confidentiality is not covered.

5. GOVERNING LAW
This Agreement is governed by the laws of ${jurisdiction || "[jurisdiction]"}.

This template is not legal advice. Review with counsel before use.

Disclosing Party: ____________________ Date: ________
Receiving Party: _____________________ Date: ________`;

  async function exportPdf() {
    setBusy(true);
    try {
      const w = await createPdfWriter();
      w.draw("NON-DISCLOSURE AGREEMENT", { size: 16, bold: true });
      w.gap(6);
      for (const line of body.split("\n")) w.draw(line || " ", { size: 10, gap: 3 });
      await w.save("nda.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">Generate a simple one-way or mutual NDA PDF in your browser. Not a substitute for attorney-drafted agreements.</Notice>
      <Row>
        <Field label="Disclosing party">
          <Input value={disclosing} onChange={(e) => setDisclosing(e.target.value)} />
        </Field>
        <Field label="Receiving party">
          <Input value={receiving} onChange={(e) => setReceiving(e.target.value)} />
        </Field>
      </Row>
      <Field label="Purpose of disclosure">
        <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={3} className="font-sans text-sm" />
      </Field>
      <Row>
        <Field label="Confidentiality term (years)">
          <Input type="number" value={term} onChange={(e) => setTerm(e.target.value)} />
        </Field>
        <Field label="NDA type">
          <Select value={mutual ? "mutual" : "oneway"} onChange={(e) => setMutual(e.target.value === "mutual")}>
            <option value="mutual">Mutual</option>
            <option value="oneway">One-way</option>
          </Select>
        </Field>
      </Row>
      <Field label="Governing jurisdiction">
        <Input value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="e.g. Province of Punjab, Pakistan" />
      </Field>
      <Field label="Live preview">
        <Preview>{body}</Preview>
      </Field>
      <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
        {busy ? "Generating…" : "Download NDA PDF"}
      </Button>
    </div>
  );
}

/* ============================ 4. Rate calculator ============================ */
export function RateCalculator() {
  const [income, setIncome] = React.useState("80000");
  const [expenses, setExpenses] = React.useState("12000");
  const [daysOff, setDaysOff] = React.useState("25");
  const [hoursWeek, setHoursWeek] = React.useState("25");
  const [margin, setMargin] = React.useState("20");

  const weeksWorked = Math.max(1, 52 - n(daysOff) / 5);
  const billableHours = weeksWorked * Math.max(1, n(hoursWeek));
  const costBase = n(income) + n(expenses);
  const withMargin = costBase * (1 + n(margin) / 100);
  const hourly = withMargin / billableHours;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Freelancers rarely bill 40 hours/week — sales, admin, and learning eat the rest. Use realistic billable hours
        so your rate actually funds your life. Math is shown below.
      </Notice>
      <Row>
        <Field label="Desired annual income ($)">
          <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
        </Field>
        <Field label="Annual business expenses ($)">
          <Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Vacation / sick days per year">
          <Input type="number" value={daysOff} onChange={(e) => setDaysOff(e.target.value)} />
        </Field>
        <Field label="Billable hours per week" hint="Often 20–30, not 40">
          <Input type="number" value={hoursWeek} onChange={(e) => setHoursWeek(e.target.value)} />
        </Field>
      </Row>
      <Field label="Profit / buffer margin (%)">
        <Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Recommended hourly rate" value={`$${fmt(hourly, 0)}`} />
        <Stat label="Billable hours / year" value={fmt(billableHours, 0)} />
      </div>
      <Output
        value={[
          `Income goal: $${fmt(n(income), 0)}`,
          `+ Expenses: $${fmt(n(expenses), 0)}`,
          `= Cost base: $${fmt(costBase, 0)}`,
          `× (1 + ${margin}% margin) = $${fmt(withMargin, 0)}`,
          `÷ ${fmt(billableHours, 0)} billable hours (${fmt(weeksWorked, 1)} weeks × ${hoursWeek} h/wk)`,
          `= $${fmt(hourly, 2)} / hour`,
        ].join("\n")}
        rows={7}
        filename="freelance-rate.txt"
      />
    </div>
  );
}

/* ============================ 5. Quote ============================ */
export function QuoteCalculator() {
  const [hours, setHours] = React.useState("40");
  const [rate, setRate] = React.useState("85");
  const [expenses, setExpenses] = React.useState("200");
  const [margin, setMargin] = React.useState("15");

  const labor = n(hours) * n(rate);
  const subtotal = labor + n(expenses);
  const marginAmt = subtotal * (n(margin) / 100);
  const total = subtotal + marginAmt;

  return (
    <div className="space-y-4">
      <Notice tone="info">Build a transparent quote: labor + project expenses + your margin.</Notice>
      <InvoiceLink />
      <Row>
        <Field label="Estimated hours">
          <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
        </Field>
        <Field label="Hourly rate ($)">
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Fixed project expenses ($)">
          <Input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
        </Field>
        <Field label="Desired profit margin (%)">
          <Input type="number" value={margin} onChange={(e) => setMargin(e.target.value)} />
        </Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Labor" value={`$${fmt(labor)}`} />
        <Stat label="Expenses" value={`$${fmt(n(expenses))}`} />
        <Stat label="Margin" value={`$${fmt(marginAmt)}`} />
        <Stat label="Total quote" value={`$${fmt(total)}`} />
      </div>
    </div>
  );
}

/* ============================ 6. Late fee ============================ */
export function LateFeeCalculator() {
  const [amount, setAmount] = React.useState("2500");
  const [due, setDue] = React.useState("2026-06-01");
  const [today, setToday] = React.useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = React.useState<"flat" | "pct">("pct");
  const [rate, setRate] = React.useState("1.5");

  const dueD = new Date(due);
  const todayD = new Date(today);
  const days = Math.max(0, Math.floor((todayD.getTime() - dueD.getTime()) / 86400000));
  const months = days / 30;
  const fee = type === "flat" ? (days > 0 ? n(rate) : 0) : n(amount) * (n(rate) / 100) * months;
  const total = n(amount) + fee;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Invoice amount ($)">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Fee type">
          <Select value={type} onChange={(e) => setType(e.target.value as "flat" | "pct")}>
            <option value="pct">% per month</option>
            <option value="flat">Flat fee when overdue</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Due date">
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="As of date">
          <Input type="date" value={today} onChange={(e) => setToday(e.target.value)} />
        </Field>
      </Row>
      <Field label={type === "flat" ? "Flat late fee ($)" : "Monthly late fee (%)"}>
        <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Days overdue" value={days} />
        <Stat label="Late fee" value={`$${fmt(fee)}`} />
        <Stat label="New total due" value={`$${fmt(total)}`} />
      </div>
    </div>
  );
}

/* ============================ 7. Break-even ============================ */
export function BreakEvenCalculator() {
  const [fixed, setFixed] = React.useState("3000");
  const [price, setPrice] = React.useState("1500");
  const [variable, setVariable] = React.useState("100");
  const [mode, setMode] = React.useState<"project" | "hour">("project");

  const contribution = n(price) - n(variable);
  const units = contribution > 0 ? n(fixed) / contribution : NaN;

  return (
    <div className="space-y-4">
      <Field label="Sell by">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "project" | "hour")}>
          <option value="project">Projects</option>
          <option value="hour">Hours</option>
        </Select>
      </Field>
      <Row>
        <Field label="Fixed monthly costs ($)">
          <Input type="number" value={fixed} onChange={(e) => setFixed(e.target.value)} />
        </Field>
        <Field label={mode === "hour" ? "Price per hour ($)" : "Price per project ($)"}>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
      </Row>
      <Field label={mode === "hour" ? "Variable cost per hour ($)" : "Variable cost per project ($)"}>
        <Input type="number" value={variable} onChange={(e) => setVariable(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Contribution margin" value={`$${fmt(contribution)}`} />
        <Stat
          label={mode === "hour" ? "Hours to break even" : "Projects to break even"}
          value={fmt(Math.ceil(units), 0)}
        />
        <Stat label="Exact" value={fmt(units, 2)} />
      </div>
      {!Number.isFinite(units) && (
        <Notice tone="error">Price must be greater than variable cost.</Notice>
      )}
    </div>
  );
}

/* ============================ 8. Self-employment tax ============================ */
function usSeTax(net: number) {
  const seBase = net * 0.9235;
  const seTax = seBase * 0.153;
  const deductibleHalf = seTax / 2;
  // Rough federal income tax on (net - half SE) using simplified brackets (single, 2024-ish)
  const taxable = Math.max(0, net - deductibleHalf);
  let incomeTax = 0;
  const brackets: [number, number][] = [
    [11600, 0.1],
    [47150, 0.12],
    [100525, 0.22],
    [191950, 0.24],
    [243725, 0.32],
    [609350, 0.35],
    [Infinity, 0.37],
  ];
  let prev = 0;
  for (const [cap, rate] of brackets) {
    const slice = Math.min(taxable, cap) - prev;
    if (slice > 0) incomeTax += slice * rate;
    if (taxable <= cap) break;
    prev = cap;
  }
  return { seTax, incomeTax, total: seTax + incomeTax, taxable };
}

/** Simplified Pakistan individual tax slabs (illustrative FY planning). */
function pkTax(net: number) {
  // Simplified progressive estimate in PKR-like numbers; user enters income in local currency units
  let tax = 0;
  const slabs: [number, number, number][] = [
    [600000, 0, 0],
    [1200000, 0.05, 0],
    [2200000, 0.15, 30000],
    [3200000, 0.25, 180000],
    [4100000, 0.3, 430000],
    [Infinity, 0.35, 700000],
  ];
  let lower = 0;
  for (const [upper, rate, base] of slabs) {
    if (net <= upper) {
      tax = base + Math.max(0, net - lower) * rate;
      break;
    }
    lower = upper;
  }
  return { incomeTax: tax, total: tax };
}

export function SelfEmploymentTaxCalculator() {
  const [region, setRegion] = React.useState<"us" | "pk">("us");
  const [income, setIncome] = React.useState("75000");
  const net = n(income);

  const us = usSeTax(net);
  const pk = pkTax(net);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Estimates only — not tax advice. Rules change; consult a qualified tax professional for filing.
      </Notice>
      <Field label="Country / region">
        <Select value={region} onChange={(e) => setRegion(e.target.value as "us" | "pk")}>
          <option value="us">United States (SE tax + rough income tax)</option>
          <option value="pk">Pakistan (simplified income tax estimate)</option>
        </Select>
      </Field>
      <Field label={region === "us" ? "Net freelance income (USD)" : "Taxable freelance income (PKR)"}>
        <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
      </Field>
      {region === "us" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="SE tax (~15.3%)" value={`$${fmt(us.seTax)}`} />
          <Stat label="Est. income tax" value={`$${fmt(us.incomeTax)}`} />
          <Stat label="Combined estimate" value={`$${fmt(us.total)}`} />
          <Stat label="Approx. taxable" value={`$${fmt(us.taxable)}`} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Est. income tax" value={`Rs ${fmt(pk.incomeTax, 0)}`} />
          <Stat label="Effective rate" value={`${fmt((pk.total / Math.max(net, 1)) * 100, 1)}%`} />
        </div>
      )}
      <Output
        value={
          region === "us"
            ? `US planning estimate on $${fmt(net, 0)} net:\n- Self-employment tax: $${fmt(us.seTax)}\n- Rough federal income tax: $${fmt(us.incomeTax)}\n- Combined: $${fmt(us.total)}\n\nDisclaimer: Not tax advice.`
            : `Pakistan simplified estimate on Rs ${fmt(net, 0)}:\n- Estimated tax: Rs ${fmt(pk.incomeTax, 0)}\n\nDisclaimer: Illustrative slabs only — not tax advice.`
        }
        rows={8}
        filename="tax-estimate.txt"
      />
    </div>
  );
}

/* ============================ 9. Onboarding form ============================ */
export function ClientOnboardingForm() {
  const [business, setBusiness] = React.useState("Alex Freelance");
  const [includeBudget, setIncludeBudget] = React.useState(true);
  const [includeBrand, setIncludeBrand] = React.useState(true);
  const [extra, setExtra] = React.useState("Anything else we should know?");
  const [busy, setBusy] = React.useState(false);

  const questions = [
    "Client / company name:",
    "Primary contact name & email:",
    "Project goals (what does success look like?):",
    "Target launch or deadline:",
    includeBudget ? "Budget range:" : null,
    "Preferred communication (email / Slack / WhatsApp / calls):",
    includeBrand ? "Brand assets available (logo, fonts, guidelines) — list or attach:" : null,
    "Stakeholders who must approve work:",
    "Must-have features or deliverables:",
    "Out of scope / not needed:",
    extra || null,
  ].filter(Boolean) as string[];

  const text = `${business} — Client Onboarding Questionnaire\n\nPlease complete and return before kickoff.\n\n${questions
    .map((q, i) => `${i + 1}. ${q}\n\n________________________________\n`)
    .join("\n")}`;

  async function exportPdf() {
    setBusy(true);
    try {
      const w = await createPdfWriter();
      w.draw(`${business} — Client Onboarding`, { size: 16, bold: true });
      w.gap(8);
      for (const line of text.split("\n")) w.draw(line || " ", { size: 10, gap: 3 });
      await w.save("client-onboarding.pdf");
    } finally {
      setBusy(false);
    }
  }

  function exportHtml() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Client Onboarding</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 16px;line-height:1.5}
label{display:block;font-weight:600;margin-top:1.25rem}textarea,input{width:100%;margin-top:.35rem;padding:.5rem;border:1px solid #ccc;border-radius:8px}
h1{font-size:1.5rem}</style></head><body>
<h1>${escapeHtml(business)} — Client Onboarding</h1>
<p>Fill this form and send it back before kickoff. Runs offline — no data is uploaded.</p>
<form>${questions
      .map(
        (q) =>
          `<label>${escapeHtml(q)}<textarea rows="3"></textarea></label>`,
      )
      .join("")}<p style="margin-top:2rem"><button type="button" onclick="window.print()">Print / Save as PDF</button></p></form></body></html>`;
    download(html, "client-onboarding.html", "text/html");
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Generate a printable PDF or a downloadable HTML form you can email or host yourself. Everything stays on your device.
      </Notice>
      <Field label="Your business name">
        <Input value={business} onChange={(e) => setBusiness(e.target.value)} />
      </Field>
      <Row>
        <Field label="Include budget question">
          <Select value={includeBudget ? "yes" : "no"} onChange={(e) => setIncludeBudget(e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </Field>
        <Field label="Include brand assets question">
          <Select value={includeBrand ? "yes" : "no"} onChange={(e) => setIncludeBrand(e.target.value === "yes")}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
        </Field>
      </Row>
      <Field label="Custom closing question">
        <Input value={extra} onChange={(e) => setExtra(e.target.value)} />
      </Field>
      <Field label="Preview">
        <Preview>{text}</Preview>
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
          {busy ? "Generating…" : "Download PDF"}
        </Button>
        <Button type="button" variant="secondary" onClick={exportHtml}>
          Download HTML form
        </Button>
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ============================ 10. Change order ============================ */
export function ChangeOrderGenerator() {
  const [project, setProject] = React.useState("Website redesign — Acme Corp");
  const [originalRef, setOriginalRef] = React.useState("Contract dated 2026-06-01 / Proposal #P-104");
  const [work, setWork] = React.useState("Add a blog section with CMS templates and category filters (not in original scope).");
  const [cost, setCost] = React.useState("1200");
  const [days, setDays] = React.useState("7");
  const [busy, setBusy] = React.useState(false);

  const body = `SCOPE CHANGE ORDER

Project: ${project}
Original agreement: ${originalRef}
Date: ${new Date().toLocaleDateString()}

1. ADDITIONAL WORK REQUESTED
${work}

2. ADDITIONAL COST
$${cost || "0"} (due per the payment terms of the original agreement unless noted otherwise).

3. TIMELINE IMPACT
Estimated +${days || "0"} calendar day(s) added to the project schedule.

4. APPROVAL
Work outside the original scope will not begin until this change order is signed by both parties.
"Just one more thing" requests without a signed change order are not included.

Client approval: ________________________ Date: ________
Freelancer: ____________________________ Date: ________`;

  async function exportPdf() {
    setBusy(true);
    try {
      const w = await createPdfWriter();
      w.draw("SCOPE CHANGE ORDER", { size: 16, bold: true });
      w.gap(6);
      for (const line of body.split("\n")) w.draw(line || " ", { size: 10, gap: 3 });
      await w.save("change-order.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Protect yourself when clients ask for “just one more thing.” Document extra work, cost, and time — then get a signature.
      </Notice>
      <InvoiceLink />
      <Field label="Project name">
        <Input value={project} onChange={(e) => setProject(e.target.value)} />
      </Field>
      <Field label="Original project reference">
        <Input value={originalRef} onChange={(e) => setOriginalRef(e.target.value)} />
      </Field>
      <Field label="Additional work requested">
        <Textarea value={work} onChange={(e) => setWork(e.target.value)} rows={4} className="font-sans text-sm" />
      </Field>
      <Row>
        <Field label="Additional cost ($)">
          <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Extra days on timeline">
          <Input type="number" value={days} onChange={(e) => setDays(e.target.value)} />
        </Field>
      </Row>
      <Field label="Live preview">
        <Preview>{body}</Preview>
      </Field>
      <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
        {busy ? "Generating…" : "Download change order PDF"}
      </Button>
    </div>
  );
}
