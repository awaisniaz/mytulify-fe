"use client";

import * as React from "react";
import Link from "next/link";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Notice, CopyButton } from "@/components/tools/shared";
import { exportBrandedPdf } from "@/lib/pdf-doc";
import { download } from "@/lib/utils";
import {
  DEFAULT_DOC_BRAND,
  DocBrandControls,
  toPdfTheme,
  toPdfWatermark,
  type DocBrandState,
} from "./DocBrandControls";

const n = (v: string) => parseFloat(v);
const fmtMoney = (amount: string, currency: string) => {
  const sym = CURRENCIES.find((c) => c.code === currency)?.sym ?? "$";
  const val = n(amount);
  return Number.isFinite(val) ? `${sym}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : `${sym}0`;
};

const CURRENCIES = [
  { code: "USD", sym: "$", label: "USD ($)" },
  { code: "EUR", sym: "€", label: "EUR (€)" },
  { code: "GBP", sym: "£", label: "GBP (£)" },
  { code: "PKR", sym: "Rs ", label: "PKR (Rs)" },
  { code: "INR", sym: "₹", label: "INR (₹)" },
  { code: "CAD", sym: "C$", label: "CAD (C$)" },
  { code: "AUD", sym: "A$", label: "AUD (A$)" },
];

const CONTRACT_TEMPLATES = {
  web: {
    title: "Website Design & Development Agreement",
    scope:
      "Design and develop a responsive marketing website including up to 5 pages, mobile optimization, basic on-page SEO setup, contact form integration, and CMS handoff.\n\nExcluded unless added in writing: copywriting, stock photography licensing, ongoing hosting, maintenance retainers, and third-party plugin subscriptions.",
    revisions: "2",
    amount: "4500",
    schedule: "milestone",
  },
  design: {
    title: "Graphic Design Services Agreement",
    scope:
      "Deliver brand-aligned graphic design assets as specified in the project brief (e.g. logo variations, social media templates, presentation deck).\n\nExcluded: print production, font licensing beyond standard web fonts, and unlimited revision rounds.",
    revisions: "3",
    amount: "1800",
    schedule: "completion",
  },
  writing: {
    title: "Freelance Content Writing Agreement",
    scope:
      "Research and write SEO-friendly content per the agreed content calendar or brief. Deliverables include drafts in Google Docs/Word, one revision round per piece, and meta descriptions where applicable.\n\nExcluded: graphic design, publishing to CMS, paid media, and keyword tracking reports unless scoped separately.",
    revisions: "1",
    amount: "1200",
    schedule: "milestone",
  },
  consulting: {
    title: "Independent Consulting Agreement",
    scope:
      "Provide professional consulting services including discovery sessions, audit/analysis deliverables, written recommendations, and up to 30 days of email follow-up support.\n\nExcluded: hands-on implementation, staff management, and software procurement unless specified in a change order.",
    revisions: "1",
    amount: "5000",
    schedule: "upfront",
  },
  retainer: {
    title: "Monthly Retainer Services Agreement",
    scope:
      "Provide ongoing freelance services on a monthly retainer basis as defined in the monthly work plan (e.g. design hours, development support, content updates).\n\nUnused hours do not roll over unless agreed in writing. Out-of-scope requests require a change order.",
    revisions: "2",
    amount: "2500",
    schedule: "retainer",
  },
  dev: {
    title: "Software Development Agreement",
    scope:
      "Design, develop, and deliver custom software/application features per the technical specification. Includes source code delivery, basic documentation, and deployment assistance.\n\nExcluded: hosting infrastructure costs, third-party API fees, post-launch warranty beyond the support period, and security audits.",
    revisions: "2",
    amount: "8000",
    schedule: "custom",
  },
} as const;

type TemplateKey = keyof typeof CONTRACT_TEMPLATES;

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-[420px] overflow-y-auto">
      {children}
    </div>
  );
}

function ClauseToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

type ContractState = {
  template: TemplateKey | "blank";
  contractRef: string;
  projectTitle: string;
  effectiveDate: string;
  freelancer: string;
  freelancerEmail: string;
  freelancerAddress: string;
  client: string;
  clientEmail: string;
  clientAddress: string;
  scope: string;
  amount: string;
  currency: string;
  schedule: string;
  milestone1: string;
  milestone2: string;
  milestone3: string;
  depositPct: string;
  netDays: string;
  deadline: string;
  revisions: string;
  lateFee: string;
  killFee: string;
  ip: string;
  jurisdiction: string;
  dispute: string;
  confidentiality: boolean;
  portfolio: boolean;
  expenses: boolean;
  liabilityCap: boolean;
  forceMajeure: boolean;
  subcontract: boolean;
};

function buildPaymentText(s: ContractState): string {
  const total = fmtMoney(s.amount, s.currency);
  const dep = n(s.depositPct);
  const depAmt = Number.isFinite(dep) && dep > 0 ? fmtMoney(String((n(s.amount) * dep) / 100), s.currency) : null;

  switch (s.schedule) {
    case "upfront":
      return `Total fee: ${total}. 100% due before work begins.${depAmt ? ` Deposit of ${depAmt} (${s.depositPct}%) confirms the engagement.` : ""}`;
    case "completion":
      return `Total fee: ${total}. 100% due upon final delivery and Client acceptance.${depAmt ? ` A non-refundable deposit of ${depAmt} (${s.depositPct}%) is due before work starts.` : ""}`;
    case "milestone":
      return `Total fee: ${total}. 50% due upfront; 50% due upon completion and delivery.${depAmt ? ` Initial deposit: ${depAmt} (${s.depositPct}%).` : ""}`;
    case "custom":
      return [
        `Total fee: ${total}.`,
        s.milestone1.trim() && `Milestone 1: ${s.milestone1}`,
        s.milestone2.trim() && `Milestone 2: ${s.milestone2}`,
        s.milestone3.trim() && `Milestone 3: ${s.milestone3}`,
        depAmt ? `Deposit (${s.depositPct}%): ${depAmt} due upon signing.` : "",
      ]
        .filter(Boolean)
        .join("\n");
    case "retainer":
      return `Monthly retainer: ${total}/month, invoiced on the 1st and due within Net ${s.netDays || "15"}. Work is limited to the agreed monthly scope; overages billed separately.`;
    default:
      return `Total fee: ${total}. Payment due within Net ${s.netDays || "30"} days of invoice.`;
  }
}

function buildIpText(ip: string): string {
  if (ip === "transfers")
    return "Upon receipt of full payment, Freelancer assigns to Client all right, title, and interest in the final deliverables created specifically for this project (work made for hire where applicable by law). Freelancer retains ownership of pre-existing materials, tools, and generic components.";
  if (ip === "retains")
    return "Freelancer retains all intellectual property rights. Client receives a perpetual, worldwide, non-exclusive, royalty-free license to use the deliverables for its internal business purposes.";
  return "Freelancer grants Client a limited license to use deliverables as described in the Scope. Freelancer retains ownership of frameworks, libraries, templates, and pre-existing IP incorporated into the work.";
}

function buildContractDocument(s: ContractState) {
  const paymentText = buildPaymentText(s);
  const ipText = buildIpText(s.ip);
  const clauses: string[] = [];

  if (s.confidentiality) {
    clauses.push(
      "Confidentiality: Each party agrees to keep non-public business, technical, and financial information confidential during and for two (2) years after the project, except as required by law or with written consent.",
    );
  }
  if (s.portfolio) {
    clauses.push(
      "Portfolio rights: Freelancer may display non-confidential work in portfolio, case studies, and marketing materials unless Client requests otherwise in writing before launch.",
    );
  }
  if (s.expenses) {
    clauses.push(
      "Expenses: Pre-approved out-of-pocket expenses (travel, stock assets, software) will be reimbursed with receipts. All expenses require Client approval before purchase.",
    );
  }
  if (s.liabilityCap) {
    clauses.push(
      `Limitation of liability: Neither party is liable for indirect or consequential damages. Freelancer's total liability is capped at the fees paid under this agreement (${fmtMoney(s.amount, s.currency)}).`,
    );
  }
  if (s.forceMajeure) {
    clauses.push(
      "Force majeure: Neither party is responsible for delays caused by events beyond reasonable control (natural disasters, outages, government action). Timelines extend accordingly.",
    );
  }
  if (s.subcontract) {
    clauses.push(
      "Subcontracting: Freelancer may use qualified subcontractors but remains responsible for quality and confidentiality. Client will be notified of material subcontracting.",
    );
  }

  const disputeText =
    s.dispute === "arbitration"
      ? "Disputes will be resolved by binding arbitration in the governing jurisdiction before litigation."
      : s.dispute === "mediation"
        ? "Parties agree to attempt good-faith mediation before pursuing arbitration or court action."
        : "Disputes will be resolved in the courts of the governing jurisdiction.";

  const sections = [
    {
      heading: "1. Parties & project",
      body: `This Freelance Services Agreement ("Agreement") is entered into as of ${s.effectiveDate || "[date]"} between ${s.freelancer || "[Freelancer]"}${s.freelancerEmail ? ` (${s.freelancerEmail})` : ""}${s.freelancerAddress ? `, ${s.freelancerAddress}` : ""} ("Freelancer") and ${s.client || "[Client]"}${s.clientEmail ? ` (${s.clientEmail})` : ""}${s.clientAddress ? `, ${s.clientAddress}` : ""} ("Client").\n\nProject: ${s.projectTitle || "Professional services engagement"}\nReference: ${s.contractRef || "—"}`,
    },
    { heading: "2. Scope of work", body: s.scope || "[Describe deliverables, inclusions, and exclusions]" },
    {
      heading: "3. Timeline",
      body: `Target completion: ${s.deadline || "[date]"}. Timeline depends on timely Client feedback, content delivery, and approvals. Delays caused by Client may extend the schedule without penalty to Freelancer.`,
    },
    {
      heading: "4. Payment terms",
      body: `${paymentText}\n\nInvoices are due within Net ${s.netDays || "15"} days unless stated otherwise. Late payments may incur ${s.lateFee || "0"}% interest per month (or the maximum allowed by law) on overdue balances.`,
    },
    {
      heading: "5. Revisions & change orders",
      body: `Up to ${s.revisions || "0"} round(s) of revisions are included within the original scope. Additional revisions or new features require a written change order with updated fees and timeline.`,
    },
    { heading: "6. Intellectual property", body: ipText },
    {
      heading: "7. Termination & kill fee",
      body: `Either party may terminate with 14 days written notice. Client pays for all completed work through the termination date. If Client terminates without cause after work begins, a kill fee of ${s.killFee || "0"}% of the remaining contract value may apply. Deposits are non-refundable once work has commenced unless otherwise agreed.`,
    },
    ...(clauses.length
      ? [{ heading: "8. Additional terms", body: clauses.join("\n\n") }]
      : []),
    {
      heading: `${clauses.length ? "9" : "8"}. Governing law & disputes`,
      body: `Governing law: ${s.jurisdiction || "[State/Country]"}. ${disputeText}`,
    },
    {
      heading: `${clauses.length ? "10" : "9"}. General`,
      body: "This Agreement constitutes the entire understanding between the parties. Amendments must be in writing signed by both parties. This template is for informational purposes only and does not constitute legal advice. Consult a qualified attorney in your jurisdiction before signing.",
    },
  ];

  const plain = sections.map((sec) => `${sec.heading.toUpperCase()}\n${sec.body}`).join("\n\n");
  const header = `${s.projectTitle || "Freelance Services Agreement"}\n${s.freelancer} ↔ ${s.client}\n`;

  return { sections, fullText: header + plain, signatures: ["Freelancer signature / date", "Client signature / date"] };
}

export function ContractGenerator() {
  const [s, setS] = React.useState<ContractState>({
    template: "web",
    contractRef: `CTR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    projectTitle: CONTRACT_TEMPLATES.web.title,
    effectiveDate: new Date().toISOString().slice(0, 10),
    freelancer: "Alex Freelance LLC",
    freelancerEmail: "hello@example.com",
    freelancerAddress: "123 Main St, City, ST 10001",
    client: "Acme Corp",
    clientEmail: "legal@acme.com",
    clientAddress: "456 Business Ave, City, ST 10002",
    scope: CONTRACT_TEMPLATES.web.scope,
    amount: CONTRACT_TEMPLATES.web.amount,
    currency: "USD",
    schedule: CONTRACT_TEMPLATES.web.schedule,
    milestone1: "40% — upon signed agreement & kickoff",
    milestone2: "30% — upon design approval",
    milestone3: "30% — upon final delivery",
    depositPct: "25",
    netDays: "15",
    deadline: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    revisions: CONTRACT_TEMPLATES.web.revisions,
    lateFee: "1.5",
    killFee: "25",
    ip: "transfers",
    jurisdiction: "State of California, USA",
    dispute: "mediation",
    confidentiality: true,
    portfolio: true,
    expenses: false,
    liabilityCap: true,
    forceMajeure: true,
    subcontract: false,
  });
  const [brand, setBrand] = React.useState<DocBrandState>({ ...DEFAULT_DOC_BRAND, watermarkText: "CONTRACT" });
  const [busy, setBusy] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const patch = (p: Partial<ContractState>) => setS((prev) => ({ ...prev, ...p }));

  function applyTemplate(key: TemplateKey | "blank") {
    patch({ template: key });
    if (key === "blank") return;
    const t = CONTRACT_TEMPLATES[key];
    patch({
      projectTitle: t.title,
      scope: t.scope,
      revisions: t.revisions,
      amount: t.amount,
      schedule: t.schedule,
    });
  }

  const doc = buildContractDocument(s);

  async function exportPdf() {
    setBusy(true);
    try {
      await exportBrandedPdf({
        docType: "Contract",
        title: s.projectTitle || "Freelance Services Agreement",
        subtitle: "Independent contractor agreement template",
        meta: [
          { label: "Reference", value: s.contractRef },
          { label: "Freelancer", value: s.freelancer },
          { label: "Client", value: s.client },
          { label: "Effective date", value: s.effectiveDate },
        ],
        sections: doc.sections,
        signatures: doc.signatures,
        theme: toPdfTheme(brand),
        watermark: toPdfWatermark(brand),
        footerLeft: `${s.freelancer || "Freelancer"} · ${s.contractRef}`,
        filename: `freelance-contract-${s.contractRef.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}.pdf`,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Notice tone="info">
        Build a professional <strong>freelance contract template</strong> or{" "}
        <strong>independent contractor agreement</strong> with scope, payment schedule, IP, confidentiality, and
        termination clauses. Preview live, copy text, or download a branded PDF — 100% private in your browser.
      </Notice>

      <Field label="Contract template" hint="Pre-fills scope, pricing, and revision defaults for your industry">
        <Select value={s.template} onChange={(e) => applyTemplate(e.target.value as TemplateKey | "blank")}>
          <option value="web">Web design & development contract</option>
          <option value="design">Graphic design contract</option>
          <option value="writing">Freelance writing contract</option>
          <option value="consulting">Consulting / independent contractor agreement</option>
          <option value="retainer">Monthly retainer agreement</option>
          <option value="dev">Software development contract</option>
          <option value="blank">Blank — custom contract</option>
        </Select>
      </Field>

      <Row>
        <Field label="Contract reference #">
          <Input value={s.contractRef} onChange={(e) => patch({ contractRef: e.target.value })} placeholder="CTR-2026-001" />
        </Field>
        <Field label="Effective date">
          <Input type="date" value={s.effectiveDate} onChange={(e) => patch({ effectiveDate: e.target.value })} />
        </Field>
      </Row>

      <Field label="Project / agreement title">
        <Input value={s.projectTitle} onChange={(e) => patch({ projectTitle: e.target.value })} />
      </Field>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Freelancer details</p>
      <Row>
        <Field label="Freelancer / business name">
          <Input value={s.freelancer} onChange={(e) => patch({ freelancer: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={s.freelancerEmail} onChange={(e) => patch({ freelancerEmail: e.target.value })} />
        </Field>
      </Row>
      <Field label="Address">
        <Input value={s.freelancerAddress} onChange={(e) => patch({ freelancerAddress: e.target.value })} />
      </Field>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Client details</p>
      <Row>
        <Field label="Client / company name">
          <Input value={s.client} onChange={(e) => patch({ client: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input type="email" value={s.clientEmail} onChange={(e) => patch({ clientEmail: e.target.value })} />
        </Field>
      </Row>
      <Field label="Address">
        <Input value={s.clientAddress} onChange={(e) => patch({ clientAddress: e.target.value })} />
      </Field>

      <Field label="Scope of work & deliverables" hint="List inclusions AND exclusions to prevent scope creep">
        <Textarea value={s.scope} onChange={(e) => patch({ scope: e.target.value })} rows={6} className="font-sans text-sm" />
      </Field>

      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payment & timeline</p>
      <Row>
        <Field label="Total contract value">
          <Input type="number" min={0} value={s.amount} onChange={(e) => patch({ amount: e.target.value })} />
        </Field>
        <Field label="Currency">
          <Select value={s.currency} onChange={(e) => patch({ currency: e.target.value })}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Payment schedule">
          <Select value={s.schedule} onChange={(e) => patch({ schedule: e.target.value })}>
            <option value="upfront">100% upfront</option>
            <option value="milestone">50% upfront / 50% on completion</option>
            <option value="custom">Custom milestones</option>
            <option value="completion">100% on completion</option>
            <option value="retainer">Monthly retainer</option>
            <option value="net">Net terms (single invoice)</option>
          </Select>
        </Field>
        <Field label="Deposit % (optional)">
          <Input type="number" min={0} max={100} value={s.depositPct} onChange={(e) => patch({ depositPct: e.target.value })} />
        </Field>
      </Row>
      {s.schedule === "custom" && (
        <>
          <Field label="Milestone 1"><Input value={s.milestone1} onChange={(e) => patch({ milestone1: e.target.value })} /></Field>
          <Field label="Milestone 2"><Input value={s.milestone2} onChange={(e) => patch({ milestone2: e.target.value })} /></Field>
          <Field label="Milestone 3"><Input value={s.milestone3} onChange={(e) => patch({ milestone3: e.target.value })} /></Field>
        </>
      )}
      <Row>
        <Field label="Completion deadline">
          <Input type="date" value={s.deadline} onChange={(e) => patch({ deadline: e.target.value })} />
        </Field>
        <Field label="Invoice net days">
          <Select value={s.netDays} onChange={(e) => patch({ netDays: e.target.value })}>
            <option value="7">Net 7</option>
            <option value="15">Net 15</option>
            <option value="30">Net 30</option>
            <option value="45">Net 45</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Revision rounds included">
          <Input type="number" min={0} value={s.revisions} onChange={(e) => patch({ revisions: e.target.value })} />
        </Field>
        <Field label="Late payment fee (% / month)">
          <Input type="number" step="0.1" value={s.lateFee} onChange={(e) => patch({ lateFee: e.target.value })} />
        </Field>
      </Row>

      <button
        type="button"
        className="text-sm font-semibold text-brand hover:underline"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? "▾ Hide" : "▸ Show"} legal clauses & advanced options
      </button>

      {showAdvanced && (
        <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
          <Row>
            <Field label="IP / work ownership">
              <Select value={s.ip} onChange={(e) => patch({ ip: e.target.value })}>
                <option value="transfers">Transfer to client on full payment</option>
                <option value="retains">Freelancer retains; client licensed</option>
                <option value="licensed">Limited license; freelancer keeps tools</option>
              </Select>
            </Field>
            <Field label="Kill fee on early termination (%)">
              <Input type="number" value={s.killFee} onChange={(e) => patch({ killFee: e.target.value })} />
            </Field>
          </Row>
          <Row>
            <Field label="Governing law / jurisdiction">
              <Input value={s.jurisdiction} onChange={(e) => patch({ jurisdiction: e.target.value })} placeholder="State of New York, USA" />
            </Field>
            <Field label="Dispute resolution">
              <Select value={s.dispute} onChange={(e) => patch({ dispute: e.target.value })}>
                <option value="courts">Courts in governing jurisdiction</option>
                <option value="mediation">Mediation first, then courts</option>
                <option value="arbitration">Binding arbitration</option>
              </Select>
            </Field>
          </Row>
          <div className="grid gap-2 sm:grid-cols-2">
            <ClauseToggle label="Confidentiality (NDA) clause" checked={s.confidentiality} onChange={(v) => patch({ confidentiality: v })} />
            <ClauseToggle label="Portfolio / case study rights" checked={s.portfolio} onChange={(v) => patch({ portfolio: v })} />
            <ClauseToggle label="Reimbursable expenses" checked={s.expenses} onChange={(v) => patch({ expenses: v })} />
            <ClauseToggle label="Limitation of liability cap" checked={s.liabilityCap} onChange={(v) => patch({ liabilityCap: v })} />
            <ClauseToggle label="Force majeure" checked={s.forceMajeure} onChange={(v) => patch({ forceMajeure: v })} />
            <ClauseToggle label="Subcontracting allowed" checked={s.subcontract} onChange={(v) => patch({ subcontract: v })} />
          </div>
        </div>
      )}

      <DocBrandControls value={brand} onChange={setBrand} />

      <Field label="Live contract preview">
        <Preview>{doc.fullText}</Preview>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void exportPdf()} disabled={busy}>
          {busy ? "Generating PDF…" : "Download PDF contract"}
        </Button>
        <CopyButton value={doc.fullText} label="Copy contract text" />
        <Button
          type="button"
          variant="secondary"
          onClick={() => download(doc.fullText, `freelance-contract-${s.contractRef}.txt`, "text/plain")}
        >
          Download .txt
        </Button>
      </div>

      <Notice tone="info">
        Pair with{" "}
        <Link href="/freelancer-tools/proposal-generator" className="font-semibold text-brand underline">Proposal Generator</Link>
        {" "}before signing,{" "}
        <Link href="/freelancer-tools/nda-generator" className="font-semibold text-brand underline">NDA Generator</Link>
        {" "}for sensitive projects, and{" "}
        <Link href="/converters-generators/invoice-generator" className="font-semibold text-brand underline">Invoice Generator</Link>
        {" "}after work is approved. Template only — not legal advice.
      </Notice>
    </div>
  );
}
