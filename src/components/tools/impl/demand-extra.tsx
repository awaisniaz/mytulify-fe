"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Stat, Output, CopyButton, Notice } from "@/components/tools/shared";

const n = (v: string) => parseFloat(v);
const fmt = (x: number, d = 2) =>
  Number.isFinite(x) ? x.toLocaleString(undefined, { maximumFractionDigits: d }) : "—";

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

/* ------------------------------ Currency converter ------------------------- */
const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "INR", "AED", "SAR", "CAD", "AUD", "JPY", "CNY", "CHF"] as const;

export function CurrencyConverter() {
  const [amount, setAmount] = React.useState("100");
  const [from, setFrom] = React.useState("USD");
  const [to, setTo] = React.useState("PKR");
  const [rate, setRate] = React.useState<number | null>(null);
  const [asOf, setAsOf] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    if (from === to) {
      setRate(1);
      setAsOf("same currency");
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      if (!res.ok) throw new Error("Rate lookup failed");
      const data = (await res.json()) as { rates?: Record<string, number>; date?: string };
      const r = data.rates?.[to];
      if (!r) throw new Error("Rate not available for this pair");
      setRate(r);
      setAsOf(data.date ?? "");
    } catch (e) {
      setRate(null);
      setError(e instanceof Error ? e.message : "Could not fetch rates");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const converted = rate != null ? n(amount) * rate : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">Live mid-market rates via Frankfurter (ECB). No API key required.</Notice>
      <Row>
        <Field label="Amount">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <Select value={from} onChange={(e) => setFrom(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="To">
            <Select value={to} onChange={(e) => setTo(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Row>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
          {loading ? "Updating…" : "Refresh rate"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
        >
          Swap
        </Button>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Result" value={`${fmt(converted)} ${to}`} />
        <Stat label="Rate" value={rate != null ? `1 ${from} = ${fmt(rate, 6)} ${to}` : "—"} />
        <Stat label="As of" value={asOf || "—"} />
      </div>
    </div>
  );
}

/* ------------------------------ px ↔ rem ----------------------------------- */
export function PxRemConverter() {
  const [base, setBase] = React.useState("16");
  const [px, setPx] = React.useState("16");
  const [rem, setRem] = React.useState("1");
  const root = n(base) || 16;

  function fromPx(v: string) {
    setPx(v);
    const p = n(v);
    setRem(Number.isFinite(p) ? String(+(p / root).toFixed(4)) : "");
  }
  function fromRem(v: string) {
    setRem(v);
    const r = n(v);
    setPx(Number.isFinite(r) ? String(+(r * root).toFixed(4)) : "");
  }

  return (
    <div className="space-y-4">
      <Field label="Root font size (px)" hint="Usually 16 in browsers">
        <Input
          type="number"
          value={base}
          onChange={(e) => {
            setBase(e.target.value);
            const p = n(px);
            const b = n(e.target.value) || 16;
            if (Number.isFinite(p)) setRem(String(+(p / b).toFixed(4)));
          }}
        />
      </Field>
      <Row>
        <Field label="Pixels (px)">
          <Input type="number" value={px} onChange={(e) => fromPx(e.target.value)} />
        </Field>
        <Field label="Rem">
          <Input type="number" value={rem} onChange={(e) => fromRem(e.target.value)} />
        </Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="CSS" value={`${rem || "—"}rem`} />
        <Stat label="Em (same root)" value={`${rem || "—"}em`} />
      </div>
      <Output
        value={rem ? `font-size: ${rem}rem; /* ${px}px at ${root}px root */` : ""}
        rows={2}
        filename="size.css"
      />
    </div>
  );
}

/* ------------------------------ EMI calculator ----------------------------- */
export function EmiCalculator() {
  const [principal, setPrincipal] = React.useState("500000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("5");
  const p = n(principal);
  const r = n(rate) / 100 / 12;
  const m = Math.max(1, Math.round(n(years) * 12));
  const emi = r === 0 ? p / m : (p * r * Math.pow(1 + r, m)) / (Math.pow(1 + r, m) - 1);
  const total = emi * m;
  const interest = total - p;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Loan amount">
          <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Field label="Tenure (years)">
        <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Monthly EMI" value={fmt(emi, 0)} />
        <Stat label="Total interest" value={fmt(interest, 0)} />
        <Stat label="Total payment" value={fmt(total, 0)} />
      </div>
      <Stat label="Months" value={m} />
    </div>
  );
}

/* ------------------------------ VAT / GST ---------------------------------- */
export function VatGstCalculator() {
  const [mode, setMode] = React.useState<"add" | "extract">("add");
  const [amount, setAmount] = React.useState("1000");
  const [rate, setRate] = React.useState("18");
  const a = n(amount);
  const r = n(rate) / 100;
  const tax = mode === "add" ? a * r : a - a / (1 + r);
  const net = mode === "add" ? a : a / (1 + r);
  const gross = mode === "add" ? a + tax : a;

  return (
    <div className="space-y-4">
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "add" | "extract")}>
          <option value="add">Add tax to net amount</option>
          <option value="extract">Extract tax from gross amount</option>
        </Select>
      </Field>
      <Row>
        <Field label={mode === "add" ? "Net amount" : "Gross amount"}>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="VAT / GST rate (%)">
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Net" value={fmt(net)} />
        <Stat label="Tax" value={fmt(tax)} />
        <Stat label="Gross" value={fmt(gross)} />
      </div>
    </div>
  );
}

/* ------------------------------ Email signature ---------------------------- */
export function EmailSignatureGenerator() {
  const [name, setName] = React.useState("Alex Khan");
  const [title, setTitle] = React.useState("Product Manager");
  const [company, setCompany] = React.useState("Mytulify");
  const [email, setEmail] = React.useState("alex@mytulify.com");
  const [phone, setPhone] = React.useState("+92 300 1234567");
  const [website, setWebsite] = React.useState("https://mytulify.com");
  const [color, setColor] = React.useState("#0d9488");

  const html = `<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#111;line-height:1.45">
  <tr>
    <td style="padding-right:14px;border-right:3px solid ${color};vertical-align:top">
      <div style="font-size:16px;font-weight:700;color:${color}">${escapeHtml(name)}</div>
      <div style="color:#555">${escapeHtml(title)}${company ? ` · ${escapeHtml(company)}` : ""}</div>
    </td>
    <td style="padding-left:14px;vertical-align:top;color:#333">
      ${email ? `<div><a href="mailto:${escapeAttr(email)}" style="color:#333;text-decoration:none">${escapeHtml(email)}</a></div>` : ""}
      ${phone ? `<div>${escapeHtml(phone)}</div>` : ""}
      ${website ? `<div><a href="${escapeAttr(website)}" style="color:${color}">${escapeHtml(website.replace(/^https?:\/\//, ""))}</a></div>` : ""}
    </td>
  </tr>
</table>`;

  const plain = [name, title && company ? `${title} · ${company}` : title || company, email, phone, website]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-4">
      <Row>
        <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Job title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        <Field label="Accent color"><Input value={color} onChange={(e) => setColor(e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      </Row>
      <Field label="Website"><Input value={website} onChange={(e) => setWebsite(e.target.value)} /></Field>
      <Field label="Preview">
        <div
          className="rounded-xl border border-border bg-white p-4"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Field>
      <Field label="HTML signature">
        <Output value={html} rows={10} filename="signature.html" mono={false} />
      </Field>
      <div className="flex gap-2">
        <CopyButton value={html} label="Copy HTML" />
        <CopyButton value={plain} label="Copy plain text" />
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

/* ------------------------------ vCard generator ---------------------------- */
export function VcardGenerator() {
  const [first, setFirst] = React.useState("Alex");
  const [last, setLast] = React.useState("Khan");
  const [org, setOrg] = React.useState("Mytulify");
  const [title, setTitle] = React.useState("Founder");
  const [email, setEmail] = React.useState("alex@mytulify.com");
  const [phone, setPhone] = React.useState("+923001234567");
  const [url, setUrl] = React.useState("https://mytulify.com");

  const vcf = `BEGIN:VCARD
VERSION:3.0
N:${escV(last)};${escV(first)};;;
FN:${escV(`${first} ${last}`.trim())}
ORG:${escV(org)}
TITLE:${escV(title)}
EMAIL;TYPE=INTERNET:${escV(email)}
TEL;TYPE=CELL:${escV(phone)}
URL:${escV(url)}
END:VCARD`;

  return (
    <div className="space-y-4">
      <Row>
        <Field label="First name"><Input value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
        <Field label="Last name"><Input value={last} onChange={(e) => setLast(e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Organization"><Input value={org} onChange={(e) => setOrg(e.target.value)} /></Field>
        <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      </Row>
      <Field label="Website"><Input value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
      <Output value={vcf} rows={12} filename="contact.vcf" />
    </div>
  );
}

function escV(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/* ------------------------------ ICS calendar event ------------------------- */
export function IcsCalendarGenerator() {
  const [title, setTitle] = React.useState("Product launch call");
  const [location, setLocation] = React.useState("Zoom");
  const [desc, setDesc] = React.useState("Quarterly product update");
  const [start, setStart] = React.useState("2026-07-20T10:00");
  const [end, setEnd] = React.useState("2026-07-20T11:00");

  const ics = React.useMemo(() => {
    const uid = `${Date.now()}@mytulify.com`;
    const stamp = toIcsUtc(new Date());
    const dtStart = toIcsLocal(start);
    const dtEnd = toIcsLocal(end);
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mytulify//ICS Generator//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${stamp}
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${escIcs(title)}
LOCATION:${escIcs(location)}
DESCRIPTION:${escIcs(desc)}
END:VEVENT
END:VCALENDAR`;
  }, [title, location, desc, start, end]);

  return (
    <div className="space-y-4">
      <Field label="Event title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Row>
        <Field label="Starts"><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Ends"><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        <Field label="Description"><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      </Row>
      <Output value={ics} rows={14} filename="event.ics" />
    </div>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toIcsUtc(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}
function toIcsLocal(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}
function escIcs(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}
