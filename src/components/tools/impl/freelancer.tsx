"use client";

import * as React from "react";
import Link from "next/link";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Stat, Notice, Output, CopyResult } from "@/components/tools/shared";
import { exportBrandedPdf } from "@/lib/pdf-doc";
import { download } from "@/lib/utils";
import {
  DEFAULT_DOC_BRAND,
  DocBrandControls,
  toPdfTheme,
  toPdfWatermark,
  type DocBrandState,
} from "./DocBrandControls";
import { FreelancerTemplateBrowser } from "./FreelancerTemplateBrowser";
import { BrandedDocPreview } from "./BrandedDocPreview";
import {
  PROPOSAL_TEMPLATES_50,
  NDA_TEMPLATES_50,
  ONBOARDING_TEMPLATES_50,
  CHANGE_ORDER_TEMPLATES_50,
  RATE_TEMPLATES_50,
  QUOTE_TEMPLATES_50,
  LATE_FEE_TEMPLATES_50,
  BREAK_EVEN_TEMPLATES_50,
  TAX_TEMPLATES_50,
} from "@/lib/freelancer/templates/catalog";

const n = (v: string) => parseFloat(v);
const fmt = (x: number, d = 2) =>
  Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
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
export { ContractGenerator } from "./contract-generator";

/* ============================ 2. Proposal ============================ */
const FIRST_PROPOSAL = PROPOSAL_TEMPLATES_50[0]!;

export function ProposalGenerator() {
  const [templateId, setTemplateId] = React.useState<string | null>(FIRST_PROPOSAL.id);
  const [client, setClient] = React.useState("Acme Corp");
  const [summary, setSummary] = React.useState(FIRST_PROPOSAL.data.summary);
  const [scope, setScope] = React.useState(FIRST_PROPOSAL.data.scope);
  const [timeline, setTimeline] = React.useState(FIRST_PROPOSAL.data.timeline);
  const [pricing, setPricing] = React.useState(FIRST_PROPOSAL.data.pricing);
  const [about, setAbout] = React.useState(FIRST_PROPOSAL.data.about);
  const [brand, setBrand] = React.useState<DocBrandState>({ ...DEFAULT_DOC_BRAND, watermarkText: "PROPOSAL" });
  const [busy, setBusy] = React.useState(false);

  function applyTemplate(t: (typeof PROPOSAL_TEMPLATES_50)[number] | null) {
    if (!t) {
      setTemplateId(null);
      return;
    }
    setTemplateId(t.id);
    setSummary(t.data.summary);
    setScope(t.data.scope);
    setTimeline(t.data.timeline);
    setPricing(t.data.pricing);
    setAbout(t.data.about);
  }

  const body = `Prepared for: ${client}
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
      await exportBrandedPdf({
        docType: "Proposal",
        title: "Project Proposal",
        subtitle: "Prepared for your review",
        meta: [
          { label: "Prepared for", value: client },
          { label: "Date", value: new Date().toLocaleDateString() },
        ],
        sections: [
          { heading: "1. Executive summary", body: summary },
          { heading: "2. Project scope", body: scope },
          { heading: "3. Timeline & milestones", body: timeline },
          { heading: "4. Investment", body: pricing },
          { heading: "5. About", body: about },
          {
            heading: "Next step",
            body: "Reply to confirm, and we’ll send a contract and kickoff checklist.",
          },
        ],
        signatures: ["Client approval", "Freelancer"],
        theme: toPdfTheme(brand),
        watermark: toPdfWatermark(brand),
        footerLeft: `Proposal for ${client}`,
        filename: "freelance-proposal.pdf",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Choose from 50 proposal templates, edit every section, then export a PDF — private in your browser.
      </Notice>
      <InvoiceLink />
      <FreelancerTemplateBrowser
        templates={PROPOSAL_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => applyTemplate(t)}
        onBlank={() => applyTemplate(null)}
      />
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
      <DocBrandControls value={brand} onChange={setBrand} />
      <Field label="Live PDF preview">
        <BrandedDocPreview
          anchorId="live-doc-preview"
          docType="Proposal"
          title="Project Proposal"
          subtitle="Prepared for your review"
          meta={[
            { label: "Prepared for", value: client },
            { label: "Date", value: new Date().toLocaleDateString() },
          ]}
          sections={[
            { heading: "1. Executive summary", body: summary },
            { heading: "2. Project scope", body: scope },
            { heading: "3. Timeline & milestones", body: timeline },
            { heading: "4. Investment", body: pricing },
            { heading: "5. About", body: about },
            {
              heading: "Next step",
              body: "Reply to confirm, and we'll send a contract and kickoff checklist.",
            },
          ]}
          signatures={["Client approval", "Freelancer"]}
          footerLeft={`Proposal for ${client}`}
          brand={brand}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
          {busy ? "Generating…" : "Download designed PDF"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => download(body, "freelance-proposal.txt", "text/plain;charset=utf-8")}
        >
          Download TXT
        </Button>
      </div>
    </div>
  );
}

/* ============================ 3. NDA ============================ */
const FIRST_NDA = NDA_TEMPLATES_50[0]!;

export function NdaGenerator() {
  const [templateId, setTemplateId] = React.useState<string | null>(FIRST_NDA.id);
  const [disclosing, setDisclosing] = React.useState("Acme Corp");
  const [receiving, setReceiving] = React.useState("Alex Freelance LLC");
  const [purpose, setPurpose] = React.useState(FIRST_NDA.data.purpose);
  const [term, setTerm] = React.useState(FIRST_NDA.data.term);
  const [mutual, setMutual] = React.useState(FIRST_NDA.data.mutual);
  const [jurisdiction, setJurisdiction] = React.useState(FIRST_NDA.data.jurisdiction);
  const [brand, setBrand] = React.useState<DocBrandState>({
    ...DEFAULT_DOC_BRAND,
    watermarkEnabled: true,
    watermarkText: "CONFIDENTIAL",
  });
  const [busy, setBusy] = React.useState(false);

  function applyNdaTemplate(t: (typeof NDA_TEMPLATES_50)[number] | null) {
    if (!t) {
      setTemplateId(null);
      return;
    }
    setTemplateId(t.id);
    setPurpose(t.data.purpose);
    setTerm(t.data.term);
    setMutual(t.data.mutual);
    setJurisdiction(t.data.jurisdiction);
  }

  const body = `Type: ${mutual ? "Mutual" : "One-way"} NDA
Parties: ${disclosing} ↔ ${receiving}
Purpose: ${purpose}
Term: ${term} year(s)
Jurisdiction: ${jurisdiction}
Signatures appear at the bottom of the PDF.`;

  async function exportPdf() {
    setBusy(true);
    try {
      await exportBrandedPdf({
        docType: "NDA",
        title: "Non-Disclosure Agreement",
        subtitle: mutual ? "Mutual confidentiality agreement" : "One-way confidentiality agreement",
        meta: [
          { label: "Disclosing party", value: disclosing },
          { label: "Receiving party", value: receiving },
          { label: "Date", value: new Date().toLocaleDateString() },
        ],
        sections: [
          { heading: "1. Purpose", body: `Confidential Information may be shared for: ${purpose}` },
          {
            heading: "2. Obligations",
            body: `The Receiving Party${mutual ? " and Disclosing Party (each as a receiving party)" : ""} agree to keep Confidential Information secret, use it only for the stated purpose, and not disclose it to third parties without prior written consent, except as required by law.`,
          },
          {
            heading: "3. Term",
            body: `Confidentiality obligations last ${term || "2"} year(s) from the date of disclosure, or until the information becomes public through no fault of the receiving party.`,
          },
          {
            heading: "4. Exclusions",
            body: "Information that is public, independently developed, or rightfully received from another source without duty of confidentiality is not covered.",
          },
          {
            heading: "5. Governing law",
            body: `This Agreement is governed by the laws of ${jurisdiction || "[jurisdiction]"}. This template is not legal advice. Review with counsel before use.`,
          },
        ],
        signatures: ["Disclosing party", "Receiving party"],
        theme: toPdfTheme(brand),
        watermark: toPdfWatermark(brand),
        footerLeft: "NDA · Confidential",
        filename: "nda.pdf",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Pick from 50 NDA templates, edit parties & terms, then download PDF. Not a substitute for attorney-drafted agreements.
      </Notice>
      <FreelancerTemplateBrowser
        templates={NDA_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => applyNdaTemplate(t)}
        onBlank={() => applyNdaTemplate(null)}
      />
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
      <DocBrandControls value={brand} onChange={setBrand} />
      <Field label="Live PDF preview">
        <BrandedDocPreview
          anchorId="live-doc-preview"
          docType="NDA"
          title="Non-Disclosure Agreement"
          subtitle={mutual ? "Mutual confidentiality agreement" : "One-way confidentiality agreement"}
          meta={[
            { label: "Disclosing party", value: disclosing },
            { label: "Receiving party", value: receiving },
            { label: "Date", value: new Date().toLocaleDateString() },
          ]}
          sections={[
            { heading: "1. Purpose", body: `Confidential Information may be shared for: ${purpose}` },
            {
              heading: "2. Obligations",
              body: `The Receiving Party${mutual ? " and Disclosing Party (each as a receiving party)" : ""} agree to keep Confidential Information secret, use it only for the stated purpose, and not disclose it to third parties without prior written consent, except as required by law.`,
            },
            {
              heading: "3. Term",
              body: `Confidentiality obligations last ${term || "2"} year(s) from the date of disclosure, or until the information becomes public through no fault of the receiving party.`,
            },
            {
              heading: "4. Exclusions",
              body: "Information that is public, independently developed, or rightfully received from another source without duty of confidentiality is not covered.",
            },
            {
              heading: "5. Governing law",
              body: `This Agreement is governed by the laws of ${jurisdiction || "[jurisdiction]"}. This template is not legal advice. Review with counsel before use.`,
            },
          ]}
          signatures={["Disclosing party", "Receiving party"]}
          footerLeft="NDA · Confidential"
          brand={brand}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
          {busy ? "Generating…" : "Download designed PDF"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => download(body, "nda.txt", "text/plain;charset=utf-8")}>
          Download TXT
        </Button>
      </div>
    </div>
  );
}

/* ============================ 4. Rate calculator ============================ */
export function RateCalculator() {
  const [templateId, setTemplateId] = React.useState<string | null>(RATE_TEMPLATES_50[0]!.id);
  const [income, setIncome] = React.useState(RATE_TEMPLATES_50[0]!.data.income);
  const [expenses, setExpenses] = React.useState(RATE_TEMPLATES_50[0]!.data.expenses);
  const [daysOff, setDaysOff] = React.useState(RATE_TEMPLATES_50[0]!.data.daysOff);
  const [hoursWeek, setHoursWeek] = React.useState(RATE_TEMPLATES_50[0]!.data.hoursWeek);
  const [margin, setMargin] = React.useState(RATE_TEMPLATES_50[0]!.data.margin);

  const weeksWorked = Math.max(1, 52 - n(daysOff) / 5);
  const billableHours = weeksWorked * Math.max(1, n(hoursWeek));
  const costBase = n(income) + n(expenses);
  const withMargin = costBase * (1 + n(margin) / 100);
  const hourly = withMargin / billableHours;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        50 rate scenarios by specialty — select one, tweak numbers, copy your target hourly rate.
      </Notice>
      <FreelancerTemplateBrowser
        templates={RATE_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setIncome(t.data.income);
          setExpenses(t.data.expenses);
          setDaysOff(t.data.daysOff);
          setHoursWeek(t.data.hoursWeek);
          setMargin(t.data.margin);
        }}
        onBlank={() => setTemplateId(null)}
      />
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" id="live-doc-preview">
        <Stat label="Recommended hourly rate" value={`$${fmt(hourly, 0)}`} />
        <Stat label="Daily (8h)" value={`$${fmt(hourly * 8, 0)}`} />
        <Stat label="Weekly" value={`$${fmt(hourly * n(hoursWeek), 0)}`} />
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
  const first = QUOTE_TEMPLATES_50[0]!;
  const [templateId, setTemplateId] = React.useState<string | null>(first.id);
  const [hours, setHours] = React.useState(first.data.hours);
  const [rate, setRate] = React.useState(first.data.rate);
  const [expenses, setExpenses] = React.useState(first.data.expenses);
  const [margin, setMargin] = React.useState(first.data.margin);

  const labor = n(hours) * n(rate);
  const subtotal = labor + n(expenses);
  const marginAmt = subtotal * (n(margin) / 100);
  const total = subtotal + marginAmt;

  return (
    <div className="space-y-4">
      <Notice tone="info">50 quote presets by specialty — select, edit hours/rate/margin, then use the total.</Notice>
      <InvoiceLink />
      <FreelancerTemplateBrowser
        templates={QUOTE_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setHours(t.data.hours);
          setRate(t.data.rate);
          setExpenses(t.data.expenses);
          setMargin(t.data.margin);
        }}
        onBlank={() => setTemplateId(null)}
      />
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" id="live-doc-preview">
        <Stat label="Labor" value={`$${fmt(labor)}`} />
        <Stat label="Expenses" value={`$${fmt(n(expenses))}`} />
        <Stat label="Margin" value={`$${fmt(marginAmt)}`} />
        <Stat label="Total quote" value={`$${fmt(total)}`} />
      </div>
      <CopyResult
        filename="quote.txt"
        rows={[
          ["Labor", fmt(labor)],
          ["Expenses", fmt(n(expenses))],
          ["Margin", fmt(marginAmt)],
          ["Total", fmt(total)],
        ]}
      />
    </div>
  );
}

/* ============================ 6. Late fee ============================ */
export function LateFeeCalculator() {
  const first = LATE_FEE_TEMPLATES_50[0]!;
  const [templateId, setTemplateId] = React.useState<string | null>(first.id);
  const [amount, setAmount] = React.useState(first.data.amount);
  const dueBase = new Date();
  dueBase.setDate(dueBase.getDate() - first.data.daysOverdue);
  const [due, setDue] = React.useState(dueBase.toISOString().slice(0, 10));
  const [today, setToday] = React.useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = React.useState<"flat" | "pct">(first.data.type);
  const [rate, setRate] = React.useState(first.data.rate);

  const dueD = new Date(due);
  const todayD = new Date(today);
  const days = Math.max(0, Math.floor((todayD.getTime() - dueD.getTime()) / 86400000));
  const months = days / 30;
  const fee = type === "flat" ? (days > 0 ? n(rate) : 0) : n(amount) * (n(rate) / 100) * months;
  const total = n(amount) + fee;

  return (
    <div className="space-y-4">
      <Notice tone="info">50 late-fee scenarios — select a template, adjust dates/rates, see the new total.</Notice>
      <FreelancerTemplateBrowser
        templates={LATE_FEE_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setAmount(t.data.amount);
          setType(t.data.type);
          setRate(t.data.rate);
          const d = new Date();
          d.setDate(d.getDate() - t.data.daysOverdue);
          setDue(d.toISOString().slice(0, 10));
          setToday(new Date().toISOString().slice(0, 10));
        }}
        onBlank={() => setTemplateId(null)}
      />
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
      <div className="grid gap-3 sm:grid-cols-3" id="live-doc-preview">
        <Stat label="Days overdue" value={days} />
        <Stat label="Late fee" value={`$${fmt(fee)}`} />
        <Stat label="New total due" value={`$${fmt(total)}`} />
      </div>
      <CopyResult filename="late-fee.txt" rows={[["Days overdue", days], ["Fee", fmt(fee)], ["Total", fmt(total)]]} />
    </div>
  );
}

/* ============================ 7. Break-even ============================ */
export function BreakEvenCalculator() {
  const first = BREAK_EVEN_TEMPLATES_50[0]!;
  const [templateId, setTemplateId] = React.useState<string | null>(first.id);
  const [fixed, setFixed] = React.useState(first.data.fixed);
  const [price, setPrice] = React.useState(first.data.price);
  const [variable, setVariable] = React.useState(first.data.variable);
  const [mode, setMode] = React.useState<"project" | "hour">(first.data.mode);

  const contribution = n(price) - n(variable);
  const units = contribution > 0 ? n(fixed) / contribution : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">50 break-even scenarios — pick a specialty model, edit costs/prices, see units needed.</Notice>
      <FreelancerTemplateBrowser
        templates={BREAK_EVEN_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setFixed(t.data.fixed);
          setPrice(t.data.price);
          setVariable(t.data.variable);
          setMode(t.data.mode);
        }}
        onBlank={() => setTemplateId(null)}
      />
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
      <div className="grid gap-3 sm:grid-cols-3" id="live-doc-preview">
        <Stat label="Contribution margin" value={`$${fmt(contribution)}`} />
        <Stat
          label={mode === "hour" ? "Hours to break even" : "Projects to break even"}
          value={fmt(Math.ceil(units), 0)}
        />
        <Stat label="Exact" value={fmt(units, 2)} />
      </div>
      {Number.isFinite(units) && (
        <CopyResult
          filename="break-even.txt"
          rows={[
            ["Contribution", fmt(contribution)],
            ["Units", fmt(units, 2)],
          ]}
        />
      )}
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
  const first = TAX_TEMPLATES_50[0]!;
  const [templateId, setTemplateId] = React.useState<string | null>(first.id);
  const [region, setRegion] = React.useState<"us" | "pk">(first.data.region);
  const [income, setIncome] = React.useState(first.data.income);
  const net = n(income);

  const us = usSeTax(net);
  const pk = pkTax(net);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        50 US/PK income scenarios — select, edit, estimate. Not tax advice.
      </Notice>
      <FreelancerTemplateBrowser
        templates={TAX_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setRegion(t.data.region);
          setIncome(t.data.income);
        }}
        onBlank={() => setTemplateId(null)}
      />
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" id="live-doc-preview">
          <Stat label="SE tax (~15.3%)" value={`$${fmt(us.seTax)}`} />
          <Stat label="Est. income tax" value={`$${fmt(us.incomeTax)}`} />
          <Stat label="Combined estimate" value={`$${fmt(us.total)}`} />
          <Stat label="Approx. taxable" value={`$${fmt(us.taxable)}`} />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2" id="live-doc-preview">
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
  const first = ONBOARDING_TEMPLATES_50[0]!;
  const [templateId, setTemplateId] = React.useState<string | null>(first.id);
  const [business, setBusiness] = React.useState(first.data.business);
  const [includeBudget, setIncludeBudget] = React.useState(first.data.includeBudget);
  const [includeBrand, setIncludeBrand] = React.useState(first.data.includeBrand);
  const [extra, setExtra] = React.useState(first.data.extra);
  const [intro, setIntro] = React.useState(first.data.intro);
  const [brand, setBrand] = React.useState<DocBrandState>({ ...DEFAULT_DOC_BRAND, watermarkText: "INTAKE FORM" });
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
      await exportBrandedPdf({
        docType: "Onboarding",
        title: "Client Onboarding",
        subtitle: `${business} · Intake questionnaire`,
        meta: [
          { label: "From", value: business },
          { label: "Date", value: new Date().toLocaleDateString() },
        ],
        sections: [
          {
            heading: "Instructions",
            body: intro || "Please complete every section and return this form before kickoff. Leave blank lines for handwritten answers if printing.",
          },
          ...questions.map((q, i) => ({
            heading: `${i + 1}. ${q}`,
            body: "\n\n\n_______________________________________________\n_______________________________________________",
          })),
        ],
        signatures: ["Client completed by"],
        theme: toPdfTheme(brand),
        watermark: toPdfWatermark(brand),
        footerLeft: `${business} · Onboarding`,
        filename: "client-onboarding.pdf",
      });
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
        50 intake templates by specialty — select, edit questions, download PDF or HTML.
      </Notice>
      <FreelancerTemplateBrowser
        templates={ONBOARDING_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setBusiness(t.data.business);
          setIncludeBudget(t.data.includeBudget);
          setIncludeBrand(t.data.includeBrand);
          setExtra(t.data.extra);
          setIntro(t.data.intro);
        }}
        onBlank={() => setTemplateId(null)}
      />
      <Field label="Your business name">
        <Input value={business} onChange={(e) => setBusiness(e.target.value)} />
      </Field>
      <Field label="Intro / instructions">
        <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={2} className="font-sans text-sm" />
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
      <DocBrandControls value={brand} onChange={setBrand} />
      <Field label="Live PDF preview">
        <BrandedDocPreview
          anchorId="live-doc-preview"
          docType="Onboarding"
          title="Client Onboarding"
          subtitle={`${business} · Intake questionnaire`}
          meta={[
            { label: "From", value: business },
            { label: "Date", value: new Date().toLocaleDateString() },
          ]}
          sections={[
            {
              heading: "Instructions",
              body: intro || "Please complete every section and return this form before kickoff.",
            },
            ...questions.map((q, i) => ({
              heading: `${i + 1}. ${q}`,
              body: "_______________________________________________\n_______________________________________________",
            })),
          ]}
          signatures={["Client completed by"]}
          footerLeft={`${business} · Onboarding`}
          brand={brand}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
          {busy ? "Generating…" : "Download designed PDF"}
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
  const first = CHANGE_ORDER_TEMPLATES_50[0]!;
  const [templateId, setTemplateId] = React.useState<string | null>(first.id);
  const [project, setProject] = React.useState(first.data.project);
  const [originalRef, setOriginalRef] = React.useState(first.data.originalRef);
  const [work, setWork] = React.useState(first.data.work);
  const [cost, setCost] = React.useState(first.data.cost);
  const [days, setDays] = React.useState(first.data.days);
  const [brand, setBrand] = React.useState<DocBrandState>({ ...DEFAULT_DOC_BRAND, watermarkText: "CHANGE ORDER" });
  const [busy, setBusy] = React.useState(false);

  const body = `Project: ${project}
Original agreement: ${originalRef}
Date: ${new Date().toLocaleDateString()}

Additional work: ${work}
Additional cost: $${cost}
Timeline: +${days} day(s)

Signatures appear at the bottom of the PDF.`;

  async function exportPdf() {
    setBusy(true);
    try {
      await exportBrandedPdf({
        docType: "Change order",
        title: "Scope Change Order",
        subtitle: "Authorization for work outside the original agreement",
        meta: [
          { label: "Project", value: project },
          { label: "Original agreement", value: originalRef },
          { label: "Date", value: new Date().toLocaleDateString() },
        ],
        sections: [
          { heading: "1. Additional work requested", body: work },
          {
            heading: "2. Additional cost",
            body: `$${cost || "0"} (due per the payment terms of the original agreement unless noted otherwise).`,
          },
          {
            heading: "3. Timeline impact",
            body: `Estimated +${days || "0"} calendar day(s) added to the project schedule.`,
          },
          {
            heading: "4. Approval",
            body: 'Work outside the original scope will not begin until this change order is signed by both parties. "Just one more thing" requests without a signed change order are not included.',
          },
        ],
        signatures: ["Client approval", "Freelancer"],
        theme: toPdfTheme(brand),
        watermark: toPdfWatermark(brand),
        footerLeft: "Change order · Out of scope",
        filename: "change-order.pdf",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        50 change-order templates — select, edit cost/timeline, download PDF for signatures.
      </Notice>
      <InvoiceLink />
      <FreelancerTemplateBrowser
        templates={CHANGE_ORDER_TEMPLATES_50}
        selectedId={templateId}
        onSelect={(t) => {
          setTemplateId(t.id);
          setProject(t.data.project);
          setOriginalRef(t.data.originalRef);
          setWork(t.data.work);
          setCost(t.data.cost);
          setDays(t.data.days);
        }}
        onBlank={() => setTemplateId(null)}
      />
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
      <DocBrandControls value={brand} onChange={setBrand} />
      <Field label="Live PDF preview">
        <BrandedDocPreview
          anchorId="live-doc-preview"
          docType="Change order"
          title="Scope Change Order"
          subtitle="Authorization for work outside the original agreement"
          meta={[
            { label: "Project", value: project },
            { label: "Original agreement", value: originalRef },
            { label: "Date", value: new Date().toLocaleDateString() },
          ]}
          sections={[
            { heading: "1. Additional work requested", body: work },
            {
              heading: "2. Additional cost",
              body: `$${cost || "0"} (due per the payment terms of the original agreement unless noted otherwise).`,
            },
            {
              heading: "3. Timeline impact",
              body: `Estimated +${days || "0"} calendar day(s) added to the project schedule.`,
            },
            {
              heading: "4. Approval",
              body: 'Work outside the original scope will not begin until this change order is signed by both parties. "Just one more thing" requests without a signed change order are not included.',
            },
          ]}
          signatures={["Client approval", "Freelancer"]}
          footerLeft="Change order · Out of scope"
          brand={brand}
        />
      </Field>
      <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
        {busy ? "Generating…" : "Download designed PDF"}
      </Button>
    </div>
  );
}
