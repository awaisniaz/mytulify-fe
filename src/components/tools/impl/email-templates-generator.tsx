"use client";

import * as React from "react";
import Link from "next/link";
import { Input, Select, Button } from "@/components/ui/primitives";
import { Field, Notice, CopyButton } from "@/components/tools/shared";

type TemplateId =
  | "cold-pitch"
  | "project-follow-up"
  | "invoice-friendly"
  | "invoice-firm"
  | "invoice-final"
  | "retainer"
  | "thank-you"
  | "scope-change";

type Tone = "friendly" | "professional" | "firm";

type Fields = {
  clientName: string;
  projectName: string;
  invoiceAmount: string;
  dueDate: string;
  daysOverdue: string;
  yourName: string;
  subjectOverride: string;
};

const TEMPLATES: { id: TemplateId; label: string; needsInvoice: boolean }[] = [
  { id: "cold-pitch", label: "Cold Pitch / Introduction", needsInvoice: false },
  { id: "project-follow-up", label: "Project Follow-Up", needsInvoice: false },
  { id: "invoice-friendly", label: "Invoice Reminder — Friendly", needsInvoice: true },
  { id: "invoice-firm", label: "Invoice Reminder — Firm", needsInvoice: true },
  { id: "invoice-final", label: "Invoice Reminder — Final Notice", needsInvoice: true },
  { id: "retainer", label: "Contract Renewal / Retainer Check-in", needsInvoice: false },
  { id: "thank-you", label: "Project Completion / Thank You", needsInvoice: false },
  { id: "scope-change", label: "Scope Change Notification", needsInvoice: true },
];

const DEFAULTS: Fields = {
  clientName: "Alex",
  projectName: "Website redesign",
  invoiceAmount: "2,500",
  dueDate: "June 1, 2026",
  daysOverdue: "14",
  yourName: "Jordan Lee",
  subjectOverride: "",
};

function greeting(client: string, tone: Tone) {
  const name = client.trim() || "there";
  if (tone === "friendly") return `Hi ${name},`;
  if (tone === "firm") return `Hello ${name},`;
  return `Dear ${name},`;
}

function signOff(you: string, tone: Tone) {
  const name = you.trim() || "Your name";
  if (tone === "friendly") return `Thanks so much,\n${name}`;
  if (tone === "firm") return `Regards,\n${name}`;
  return `Best regards,\n${name}`;
}

function money(amount: string) {
  const a = amount.trim();
  if (!a) return "$[amount]";
  return a.startsWith("$") ? a : `$${a}`;
}

function buildSubject(id: TemplateId, f: Fields, tone: Tone): string {
  const project = f.projectName.trim() || "your project";
  switch (id) {
    case "cold-pitch":
      return tone === "friendly"
        ? `Quick idea for ${project}`
        : `Introduction — help with ${project}`;
    case "project-follow-up":
      return `Following up on my proposal for ${project}`;
    case "invoice-friendly":
      return `Friendly reminder: invoice for ${project}`;
    case "invoice-firm":
      return `Overdue invoice for ${project} — action needed`;
    case "invoice-final":
      return `Final notice: unpaid invoice for ${project}`;
    case "retainer":
      return `Checking in on our retainer / next phase for ${project}`;
    case "thank-you":
      return `Thank you — ${project} wrapped + a quick favor`;
    case "scope-change":
      return `Scope update for ${project} — confirmation needed`;
    default:
      return "Quick note";
  }
}

function buildBody(id: TemplateId, f: Fields, tone: Tone): string {
  const g = greeting(f.clientName, tone);
  const s = signOff(f.yourName, tone);
  const project = f.projectName.trim() || "the project";
  const amt = money(f.invoiceAmount);
  const due = f.dueDate.trim() || "[due date]";
  const days = f.daysOverdue.trim() || "several";

  switch (id) {
    case "cold-pitch": {
      const open =
        tone === "friendly"
          ? `I came across your work and thought a short note might be useful.`
          : tone === "firm"
            ? `I’m reaching out because I believe I can help you move ${project} forward efficiently.`
            : `I’m a freelancer who helps teams like yours with ${project}.`;
      const ask =
        tone === "friendly"
          ? `Would you be open to a 15-minute chat this week to see if there’s a fit?`
          : tone === "firm"
            ? `If you’re evaluating help on this, I’d like to send a one-page outline of approach and pricing.`
            : `If this is relevant, I’m happy to share a brief proposal or jump on a quick call.`;
      return `${g}\n\n${open}\n\nI specialize in delivering clear scope, timelines, and results for projects like ${project} — without the overhead of a big agency.\n\n${ask}\n\n${s}`;
    }
    case "project-follow-up": {
      const open =
        tone === "friendly"
          ? `Just floating this back to the top of your inbox — no pressure.`
          : tone === "firm"
            ? `I wanted to follow up on the proposal I sent regarding ${project}.`
            : `I’m following up on the proposal I shared for ${project}.`;
      const close =
        tone === "firm"
          ? `If priorities have shifted, a quick “not now” helps me plan. Otherwise I’m ready to start as soon as you are.`
          : `Happy to adjust scope or timing if that helps. Just let me know how you’d like to proceed.`;
      return `${g}\n\n${open}\n\nI’m still excited about helping with ${project} and am holding a tentative start window. ${close}\n\n${s}`;
    }
    case "invoice-friendly": {
      const open =
        tone === "firm"
          ? `This is a reminder that invoice payment for ${project} (${amt}) was due on ${due}.`
          : `Hope you’re doing well! Quick nudge on the invoice for ${project}.`;
      return `${g}\n\n${open}\n\nAmount due: ${amt}\nOriginal due date: ${due}\n\nIf you’ve already sent payment, thank you — please ignore this note. Otherwise, whenever you can take care of it this week would be appreciated.\n\nI can resend the invoice or share updated payment details if helpful.\n\n${s}`;
    }
    case "invoice-firm": {
      const open =
        tone === "friendly"
          ? `Checking in again on the overdue invoice for ${project}.`
          : `Your invoice for ${project} is now ${days} day(s) past due.`;
      return `${g}\n\n${open}\n\nAmount due: ${amt}\nOriginal due date: ${due}\nDays overdue: ${days}\n\nPlease arrange payment within the next 5 business days, or reply with a confirmed payment date. If there’s a billing issue on your side, tell me what you need and I’ll help unblock it.\n\n${s}`;
    }
    case "invoice-final": {
      const open =
        tone === "friendly"
          ? `I need to send a final notice on the unpaid invoice for ${project}.`
          : `This is a final notice regarding the unpaid invoice for ${project}.`;
      return `${g}\n\n${open}\n\nAmount due: ${amt}\nOriginal due date: ${due}\nDays overdue: ${days}\n\nIf payment is not received (or a written payment plan agreed) within 7 days, I will apply the late fee outlined in our agreement and escalate collection as needed. I prefer to resolve this directly — please confirm payment today.\n\n${s}`;
    }
    case "retainer": {
      const open =
        tone === "friendly"
          ? `Wanted to check in on how things are going and whether you’d like to continue our retainer.`
          : `I’m writing to discuss renewing our retainer / next phase for ${project}.`;
      return `${g}\n\n${open}\n\nIt’s been great working together. If the current cadence still fits, I can prepare a simple renewal with the same terms (or adjusted hours if your needs changed).\n\nWould you like me to send a short renewal summary this week?\n\n${s}`;
    }
    case "thank-you": {
      const open =
        tone === "firm"
          ? `${project} is complete. Thank you for the opportunity.`
          : `Just a note to say thank you — ${project} is wrapped, and I really enjoyed the collaboration.`;
      return `${g}\n\n${open}\n\nIf you’re happy with the result, would you be willing to share a short testimonial (2–3 sentences) I can use on my site? A reply to this email is perfect.\n\nI’m also glad to help with follow-up work whenever you’re ready.\n\n${s}`;
    }
    case "scope-change": {
      const open =
        tone === "friendly"
          ? `Quick heads-up: the extra request on ${project} sits outside our original scope.`
          : `I’m confirming a scope change on ${project} before I proceed.`;
      return `${g}\n\n${open}\n\nProposed addition: work beyond the agreed deliverables for ${project}.\nEstimated additional fee: ${amt}\n\nPlease reply with approval (or questions) so I can update the timeline and issue a change order / revised invoice. I won’t start the extra work until you confirm.\n\n${s}`;
    }
    default:
      return `${g}\n\n${s}`;
  }
}

function encodeMail(subject: string, body: string) {
  return {
    subject: encodeURIComponent(subject),
    body: encodeURIComponent(body),
  };
}

export function EmailTemplatesGenerator() {
  const [templateId, setTemplateId] = React.useState<TemplateId>("invoice-friendly");
  const [tone, setTone] = React.useState<Tone>("professional");
  const [fields, setFields] = React.useState<Fields>(DEFAULTS);

  const meta = TEMPLATES.find((t) => t.id === templateId)!;
  const autoSubject = buildSubject(templateId, fields, tone);
  const subject = fields.subjectOverride.trim() || autoSubject;
  const body = buildBody(templateId, fields, tone);
  const full = `Subject: ${subject}\n\n${body}`;

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  const mail = encodeMail(subject, body);
  const gmailHref = `https://mail.google.com/mail/?view=cm&fs=1&su=${mail.subject}&body=${mail.body}`;
  const outlookHref = `https://outlook.live.com/mail/0/deeplink/compose?subject=${mail.subject}&body=${mail.body}`;
  const mailtoHref = `mailto:?subject=${mail.subject}&body=${mail.body}`;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Pick a template, personalize the fields, then copy or open in Gmail/Outlook. Pair reminders with the{" "}
        <Link href="/converters-generators/invoice-generator" className="font-semibold text-brand underline">
          Invoice Generator
        </Link>{" "}
        and{" "}
        <Link href="/freelancer-tools/late-fee-calculator" className="font-semibold text-brand underline">
          Late Payment Fee Calculator
        </Link>
        .
      </Notice>

      <Field label="Template">
        <Select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value as TemplateId);
            set("subjectOverride", "");
          }}
        >
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Tone" hint="Rewrites phrasing — not just a label">
        <div className="inline-flex rounded-xl border border-border p-1">
          {(
            [
              ["friendly", "Friendly"],
              ["professional", "Professional"],
              ["firm", "Firm"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTone(id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                tone === id ? "bg-brand text-white" : "text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Client name">
          <Input value={fields.clientName} onChange={(e) => set("clientName", e.target.value)} />
        </Field>
        <Field label="Your name / business">
          <Input value={fields.yourName} onChange={(e) => set("yourName", e.target.value)} />
        </Field>
        <Field label="Project / service name">
          <Input value={fields.projectName} onChange={(e) => set("projectName", e.target.value)} />
        </Field>
        {meta.needsInvoice && (
          <Field label="Invoice amount">
            <Input
              value={fields.invoiceAmount}
              onChange={(e) => set("invoiceAmount", e.target.value)}
              placeholder="2,500"
            />
          </Field>
        )}
        {(templateId === "invoice-friendly" ||
          templateId === "invoice-firm" ||
          templateId === "invoice-final") && (
          <>
            <Field label="Original due date">
              <Input value={fields.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </Field>
            <Field label="Days overdue">
              <Input value={fields.daysOverdue} onChange={(e) => set("daysOverdue", e.target.value)} />
            </Field>
          </>
        )}
      </div>

      <Field label="Subject line" hint="Auto-generated — edit anytime">
        <Input
          value={fields.subjectOverride || autoSubject}
          onChange={(e) => set("subjectOverride", e.target.value)}
        />
      </Field>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">Live preview</p>
        <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm leading-relaxed whitespace-pre-wrap">
          <p className="mb-3 font-semibold text-fg">Subject: {subject}</p>
          {body}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton value={full} label="Copy to clipboard" />
        <Button size="sm" variant="secondary" onClick={() => window.open(gmailHref, "_blank")}>
          Open in Gmail
        </Button>
        <Button size="sm" variant="secondary" onClick={() => window.open(outlookHref, "_blank")}>
          Open in Outlook
        </Button>
        <a
          href={mailtoHref}
          className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:border-brand"
        >
          Open mail app
        </a>
      </div>
    </div>
  );
}
