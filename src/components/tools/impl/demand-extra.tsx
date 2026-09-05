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

/* ------------------------------ Aspect ratio ------------------------------- */
const ASPECT_PRESETS = [
  { label: "16:9 (YouTube / HD)", w: 16, h: 9 },
  { label: "9:16 (Reels / Shorts)", w: 9, h: 16 },
  { label: "1:1 (Square)", w: 1, h: 1 },
  { label: "4:5 (Instagram feed)", w: 4, h: 5 },
  { label: "4:3 (Classic)", w: 4, h: 3 },
  { label: "21:9 (Ultrawide)", w: 21, h: 9 },
  { label: "3:2 (Photo)", w: 3, h: 2 },
  { label: "2:3 (Portrait photo)", w: 2, h: 3 },
] as const;

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function AspectRatioCalculator() {
  const [width, setWidth] = React.useState("1920");
  const [height, setHeight] = React.useState("1080");
  const [lock, setLock] = React.useState({ w: 16, h: 9 });
  const [mode, setMode] = React.useState<"fromDims" | "fromRatio">("fromDims");

  const w = n(width);
  const h = n(height);
  const g = Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? gcd(w, h) : 1;
  const ratioW = Number.isFinite(w) && w > 0 ? Math.round(w / g) : 0;
  const ratioH = Number.isFinite(h) && h > 0 ? Math.round(h / g) : 0;
  const decimal = Number.isFinite(w) && Number.isFinite(h) && h > 0 ? w / h : NaN;

  function applyPreset(pw: number, ph: number) {
    setLock({ w: pw, h: ph });
    setMode("fromRatio");
    const base = n(width) || 1920;
    setWidth(String(base));
    setHeight(String(Math.round((base * ph) / pw)));
  }

  function onWidthChange(v: string) {
    setWidth(v);
    if (mode === "fromRatio") {
      const nw = n(v);
      if (Number.isFinite(nw)) setHeight(String(Math.round((nw * lock.h) / lock.w)));
    }
  }

  function onHeightChange(v: string) {
    setHeight(v);
    if (mode === "fromRatio") {
      const nh = n(v);
      if (Number.isFinite(nh)) setWidth(String(Math.round((nh * lock.w) / lock.h)));
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Mode">
        <Select value={mode} onChange={(e) => setMode(e.target.value as "fromDims" | "fromRatio")}>
          <option value="fromDims">Find ratio from width × height</option>
          <option value="fromRatio">Scale dimensions to a preset ratio</option>
        </Select>
      </Field>
      <Field label="Common presets">
        <div className="flex flex-wrap gap-2">
          {ASPECT_PRESETS.map((p) => (
            <Button key={p.label} type="button" variant="secondary" size="sm" onClick={() => applyPreset(p.w, p.h)}>
              {p.label}
            </Button>
          ))}
        </div>
      </Field>
      <Row>
        <Field label="Width (px)">
          <Input type="number" value={width} onChange={(e) => onWidthChange(e.target.value)} />
        </Field>
        <Field label="Height (px)">
          <Input type="number" value={height} onChange={(e) => onHeightChange(e.target.value)} />
        </Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Aspect ratio" value={ratioW && ratioH ? `${ratioW}:${ratioH}` : "—"} />
        <Stat label="Decimal" value={fmt(decimal, 4)} />
        <Stat label="CSS" value={ratioW && ratioH ? `aspect-ratio: ${ratioW} / ${ratioH};` : "—"} />
      </div>
      {ratioW > 0 && ratioH > 0 && (
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="mb-2 text-xs font-medium text-muted">Preview</p>
          <div className="mx-auto max-w-xs overflow-hidden rounded-lg border border-border bg-brand/10">
            <div style={{ aspectRatio: `${ratioW} / ${ratioH}` }} className="grid place-items-center text-sm font-semibold text-brand">
              {ratioW}:{ratioH}
            </div>
          </div>
        </div>
      )}
      <Output
        value={
          ratioW && ratioH
            ? `/* ${width}×${height} → ${ratioW}:${ratioH} */\naspect-ratio: ${ratioW} / ${ratioH};\n/* or */\npadding-bottom: ${fmt((ratioH / ratioW) * 100, 4)}%;`
            : ""
        }
        rows={5}
        filename="aspect-ratio.css"
      />
    </div>
  );
}

/* ------------------------------ Profit margin ------------------------------ */
export function ProfitMarginCalculator() {
  const [cost, setCost] = React.useState("50");
  const [price, setPrice] = React.useState("80");
  const [targetMargin, setTargetMargin] = React.useState("40");
  const c = n(cost);
  const p = n(price);
  const profit = p - c;
  const margin = p !== 0 ? (profit / p) * 100 : NaN;
  const markup = c !== 0 ? (profit / c) * 100 : NaN;
  const tm = n(targetMargin);
  const priceForMargin = 100 - tm !== 0 ? c / (1 - tm / 100) : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">Margin = profit ÷ selling price. Markup = profit ÷ cost. They are not the same.</Notice>
      <Row>
        <Field label="Cost">
          <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
        </Field>
        <Field label="Selling price">
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Profit" value={fmt(profit)} />
        <Stat label="Profit margin" value={`${fmt(margin, 2)}%`} />
        <Stat label="Markup" value={`${fmt(markup, 2)}%`} />
      </div>
      <Field label="Target margin (%) — find required price">
        <Input type="number" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} />
      </Field>
      <Stat label="Price for target margin" value={fmt(priceForMargin)} />
    </div>
  );
}

/* ------------------------------ SIP Calculator ----------------------------- */
/** Future value of a level monthly SIP (end-of-month deposits). */
function sipFutureValue(monthly: number, annualRatePct: number, months: number): number {
  if (months <= 0 || monthly <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/** Step-up SIP: monthly amount grows by stepPct each year. */
function stepUpSipFutureValue(
  startMonthly: number,
  annualRatePct: number,
  years: number,
  stepPct: number,
): { invested: number; maturity: number } {
  const monthsTotal = Math.max(0, Math.round(years * 12));
  if (monthsTotal === 0 || startMonthly <= 0) return { invested: 0, maturity: 0 };
  const r = annualRatePct / 100 / 12;
  const step = stepPct / 100;
  let invested = 0;
  let maturity = 0;
  for (let m = 0; m < monthsTotal; m++) {
    const yearIndex = Math.floor(m / 12);
    const payment = startMonthly * Math.pow(1 + step, yearIndex);
    invested += payment;
    const monthsLeft = monthsTotal - m;
    if (r === 0) maturity += payment;
    else maturity += payment * Math.pow(1 + r, monthsLeft);
  }
  return { invested, maturity };
}

export function SipCalculator() {
  const [monthly, setMonthly] = React.useState("10000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("10");
  const [stepUp, setStepUp] = React.useState("0");

  const p = Math.max(0, n(monthly) || 0);
  const annual = Math.max(0, n(rate) || 0);
  const y = Math.max(0, n(years) || 0);
  const step = Math.max(0, n(stepUp) || 0);
  const months = Math.max(0, Math.round(y * 12));

  const result = React.useMemo(() => {
    if (step > 0) return stepUpSipFutureValue(p, annual, y, step);
    const maturity = sipFutureValue(p, annual, months);
    return { invested: p * months, maturity };
  }, [p, annual, y, months, step]);

  const gains = result.maturity - result.invested;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Estimates use the standard SIP future-value formula. Actual mutual fund returns vary — this is a planning tool, not advice.
      </Notice>
      <Row>
        <Field label="Monthly SIP amount">
          <Input type="number" min={0} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
        </Field>
        <Field label="Expected annual return (%)">
          <Input type="number" min={0} step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure (years)">
          <Input type="number" min={0} step="0.5" value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
        <Field label="Annual step-up (%)" hint="Optional — increase SIP each year (e.g. 10)">
          <Input type="number" min={0} step="1" value={stepUp} onChange={(e) => setStepUp(e.target.value)} />
        </Field>
      </Row>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Total invested" value={fmt(result.invested, 0)} />
        <Stat label="Estimated returns" value={fmt(gains, 0)} />
        <Stat label="Maturity value" value={fmt(result.maturity, 0)} />
      </div>
      <Stat label="Months" value={months} />
    </div>
  );
}

/* ------------------------------ FD Calculator ------------------------------ */
type FdCompounding = "monthly" | "quarterly" | "half-yearly" | "yearly" | "simple";

const FD_COMPOUNDING: { value: FdCompounding; label: string; n: number }[] = [
  { value: "monthly", label: "Monthly", n: 12 },
  { value: "quarterly", label: "Quarterly (common for bank FDs)", n: 4 },
  { value: "half-yearly", label: "Half-yearly", n: 2 },
  { value: "yearly", label: "Yearly", n: 1 },
  { value: "simple", label: "Simple interest (no compounding)", n: 0 },
];

/** Fixed-deposit maturity: compound A = P(1+r/n)^(n·t) or simple A = P(1+r·t). */
export function fdMaturity(
  principal: number,
  annualRatePct: number,
  years: number,
  compounding: FdCompounding,
): { maturity: number; interest: number } {
  if (!(principal > 0) || !(years > 0) || !(annualRatePct >= 0)) {
    return { maturity: NaN, interest: NaN };
  }
  const r = annualRatePct / 100;
  if (compounding === "simple" || r === 0) {
    const maturity = principal * (1 + r * years);
    return { maturity, interest: maturity - principal };
  }
  const freq = FD_COMPOUNDING.find((c) => c.value === compounding)?.n ?? 4;
  const maturity = principal * Math.pow(1 + r / freq, freq * years);
  return { maturity, interest: maturity - principal };
}

export function FdCalculator() {
  const [principal, setPrincipal] = React.useState("100000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("3");
  const [months, setMonths] = React.useState("0");
  const [compounding, setCompounding] = React.useState<FdCompounding>("quarterly");

  const p = n(principal);
  const annual = n(rate);
  const yParts = Math.max(0, n(years) || 0);
  const mParts = Math.max(0, Math.min(11, Math.round(n(months) || 0)));
  const tenureYears = yParts + mParts / 12;
  const valid =
    Number.isFinite(p) &&
    p > 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    tenureYears > 0;

  const { maturity, interest } = valid
    ? fdMaturity(p, annual, tenureYears, compounding)
    : { maturity: NaN, interest: NaN };
  const effectiveYield =
    valid && Number.isFinite(maturity) ? ((maturity / p - 1) / tenureYears) * 100 : NaN;

  let error = "";
  if (principal.trim() === "" || rate.trim() === "") error = "Enter principal and interest rate.";
  else if (!Number.isFinite(p) || p <= 0) error = "Principal must be a positive number.";
  else if (!Number.isFinite(annual) || annual < 0) error = "Interest rate cannot be negative.";
  else if (tenureYears <= 0) error = "Set tenure to at least 1 month.";

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Bank FD rates and payout rules vary. This tool uses the standard compound (or simple) interest
        formula for planning — confirm final maturity with your bank.
      </Notice>
      <Row>
        <Field label="Deposit amount (principal)">
          <Input
            type="number"
            min={0}
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(p) || p <= 0))}
          />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure — years">
          <Input
            type="number"
            min={0}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        <Field label="Extra months" hint="0–11 (added to years)">
          <Input
            type="number"
            min={0}
            max={11}
            step="1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </Field>
      </Row>
      <Field label="Compounding frequency">
        <Select
          value={compounding}
          onChange={(e) => setCompounding(e.target.value as FdCompounding)}
        >
          {FD_COMPOUNDING.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Maturity amount" value={fmt(maturity, 0)} />
            <Stat label="Interest earned" value={fmt(interest, 0)} />
            <Stat
              label="Effective annual yield"
              value={Number.isFinite(effectiveYield) ? `${fmt(effectiveYield, 2)}%` : "—"}
            />
          </div>
          <Stat
            label="Tenure"
            value={
              mParts > 0
                ? `${yParts} yr ${mParts} mo (${fmt(tenureYears, 2)} years)`
                : `${yParts} year${yParts === 1 ? "" : "s"}`
            }
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------ RD Calculator ------------------------------ */
type RdInterestMode = "quarterly" | "simple";

/**
 * Recurring deposit maturity.
 * Quarterly: common bank formula M = P × [((1+i)^n − 1) / (1 − (1+i)^(-1/3))]
 *   where i = annualRate%/400 and n = tenure months ÷ 3.
 * Simple: Interest = P × n(n+1)/2 × r/(12×100); maturity = deposits + interest.
 */
export function rdMaturity(
  monthlyDeposit: number,
  annualRatePct: number,
  tenureMonths: number,
  mode: RdInterestMode,
): { maturity: number; interest: number; invested: number } {
  const invested = monthlyDeposit * tenureMonths;
  if (!(monthlyDeposit > 0) || !(tenureMonths > 0) || !(annualRatePct >= 0)) {
    return { maturity: NaN, interest: NaN, invested: NaN };
  }
  if (annualRatePct === 0) {
    return { maturity: invested, interest: 0, invested };
  }

  if (mode === "simple") {
    const interest =
      (monthlyDeposit * tenureMonths * (tenureMonths + 1) * annualRatePct) / (2 * 12 * 100);
    return { maturity: invested + interest, interest, invested };
  }

  // Quarterly compounding — tenure should align to whole quarters for the closed form.
  const quarters = tenureMonths / 3;
  if (!Number.isFinite(quarters) || quarters <= 0) {
    return { maturity: NaN, interest: NaN, invested };
  }
  const i = annualRatePct / 400;
  const factor = (Math.pow(1 + i, quarters) - 1) / (1 - Math.pow(1 + i, -1 / 3));
  const maturity = monthlyDeposit * factor;
  return { maturity, interest: maturity - invested, invested };
}

export function RdCalculator() {
  const [monthly, setMonthly] = React.useState("5000");
  const [rate, setRate] = React.useState("7");
  const [years, setYears] = React.useState("3");
  const [months, setMonths] = React.useState("0");
  const [mode, setMode] = React.useState<RdInterestMode>("quarterly");

  const p = n(monthly);
  const annual = n(rate);
  const yParts = Math.max(0, n(years) || 0);
  const mParts = Math.max(0, Math.min(11, Math.round(n(months) || 0)));
  const tenureMonths = Math.round(yParts * 12 + mParts);
  const valid =
    Number.isFinite(p) &&
    p > 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    tenureMonths > 0;

  const quarterlyAligned = mode !== "quarterly" || tenureMonths % 3 === 0;
  const { maturity, interest, invested } =
    valid && quarterlyAligned
      ? rdMaturity(p, annual, tenureMonths, mode)
      : { maturity: NaN, interest: NaN, invested: NaN };

  let error = "";
  if (monthly.trim() === "" || rate.trim() === "") error = "Enter monthly deposit and interest rate.";
  else if (!Number.isFinite(p) || p <= 0) error = "Monthly deposit must be a positive number.";
  else if (!Number.isFinite(annual) || annual < 0) error = "Interest rate cannot be negative.";
  else if (tenureMonths <= 0) error = "Set tenure to at least 1 month.";
  else if (mode === "quarterly" && tenureMonths % 3 !== 0) {
    error = "Quarterly compounding needs a tenure in whole quarters (multiples of 3 months). Adjust years/months or switch to simple interest.";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Bank RD rates and payout rules vary. Quarterly compounding uses the common closed-form RD
        formula for planning — confirm final maturity with your bank.
      </Notice>
      <Row>
        <Field label="Monthly deposit">
          <Input
            type="number"
            min={0}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(p) || p <= 0))}
          />
        </Field>
        <Field label="Annual interest rate (%)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure — years">
          <Input
            type="number"
            min={0}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        <Field label="Extra months" hint="0–11 (added to years)">
          <Input
            type="number"
            min={0}
            max={11}
            step="1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </Field>
      </Row>
      <Field label="Interest method">
        <Select value={mode} onChange={(e) => setMode(e.target.value as RdInterestMode)}>
          <option value="quarterly">Quarterly compounding (common for bank RDs)</option>
          <option value="simple">Simple interest</option>
        </Select>
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Maturity amount" value={fmt(maturity, 0)} />
            <Stat label="Interest earned" value={fmt(interest, 0)} />
            <Stat label="Total deposited" value={fmt(invested, 0)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Tenure"
              value={
                mParts > 0
                  ? `${yParts} yr ${mParts} mo (${tenureMonths} months)`
                  : `${yParts} year${yParts === 1 ? "" : "s"} (${tenureMonths} months)`
              }
            />
            <Stat label="Installments" value={tenureMonths} />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ CAGR Calculator ---------------------------- */
export function CagrCalculator() {
  const [begin, setBegin] = React.useState("100000");
  const [end, setEnd] = React.useState("250000");
  const [years, setYears] = React.useState("5");

  const b = n(begin);
  const e = n(end);
  const y = n(years);
  const valid = Number.isFinite(b) && Number.isFinite(e) && b > 0 && e > 0 && y > 0;
  const cagr = valid ? Math.pow(e / b, 1 / y) - 1 : NaN;
  const totalGain = valid ? e - b : NaN;
  const totalGainPct = valid ? ((e - b) / b) * 100 : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        CAGR smooths multi-year growth into one annual rate. It ignores interim deposits and withdrawals.
      </Notice>
      <Row>
        <Field label="Beginning value">
          <Input type="number" min={0} value={begin} onChange={(e) => setBegin(e.target.value)} />
        </Field>
        <Field label="Ending value">
          <Input type="number" min={0} value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </Row>
      <Field label="Number of years">
        <Input type="number" min={0.01} step="0.1" value={years} onChange={(e) => setYears(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="CAGR" value={Number.isFinite(cagr) ? `${fmt(cagr * 100, 2)}%` : "—"} />
        <Stat label="Total gain" value={fmt(totalGain, 0)} />
        <Stat label="Total gain %" value={Number.isFinite(totalGainPct) ? `${fmt(totalGainPct, 2)}%` : "—"} />
      </div>
    </div>
  );
}

/* ------------------------------ PPF Calculator ----------------------------- */
/**
 * Public Provident Fund maturity with yearly contributions.
 * Deposits are applied at the start of each year; interest compounds yearly
 * (common planning model used by online PPF calculators).
 */
export function ppfMaturity(
  yearlyContribution: number,
  annualRatePct: number,
  years: number,
  openingBalance = 0,
): { invested: number; maturity: number; interest: number } {
  if (
    !(yearlyContribution >= 0) ||
    !(annualRatePct >= 0) ||
    !(years > 0) ||
    !Number.isFinite(openingBalance) ||
    openingBalance < 0
  ) {
    return { invested: NaN, maturity: NaN, interest: NaN };
  }
  const r = annualRatePct / 100;
  const nYears = Math.max(1, Math.round(years));
  let balance = openingBalance;
  let contributions = 0;
  for (let y = 0; y < nYears; y++) {
    balance += yearlyContribution;
    contributions += yearlyContribution;
    balance *= 1 + r;
  }
  const invested = openingBalance + contributions;
  return { invested, maturity: balance, interest: balance - invested };
}

export function PpfCalculator() {
  const [yearly, setYearly] = React.useState("150000");
  const [rate, setRate] = React.useState("7.1");
  const [years, setYears] = React.useState("15");
  const [opening, setOpening] = React.useState("0");

  const contribution = n(yearly);
  const annual = n(rate);
  const tenure = Math.round(n(years) || 0);
  const openBal = n(opening) || 0;

  const valid =
    Number.isFinite(contribution) &&
    contribution >= 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    tenure > 0 &&
    Number.isFinite(openBal) &&
    openBal >= 0 &&
    (contribution > 0 || openBal > 0);

  const { invested, maturity, interest } = valid
    ? ppfMaturity(contribution, annual, tenure, openBal)
    : { invested: NaN, maturity: NaN, interest: NaN };

  let error = "";
  if (yearly.trim() === "" || rate.trim() === "" || years.trim() === "") {
    error = "Enter yearly contribution, interest rate, and tenure.";
  } else if (!Number.isFinite(contribution) || contribution < 0) {
    error = "Yearly contribution cannot be negative.";
  } else if (!Number.isFinite(annual) || annual < 0) {
    error = "Interest rate cannot be negative.";
  } else if (!(tenure > 0)) {
    error = "Tenure must be at least 1 year.";
  } else if (!Number.isFinite(openBal) || openBal < 0) {
    error = "Opening balance cannot be negative.";
  } else if (contribution === 0 && openBal === 0) {
    error = "Enter a yearly contribution or an opening balance greater than zero.";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        PPF rules (contribution limits, lock-in, and the notified rate) can change. This tool uses
        yearly compounding for planning — confirm final maturity with your bank or post office.
      </Notice>
      <Row>
        <Field label="Yearly contribution" hint="Common planning max is ₹1,50,000 per year">
          <Input
            type="number"
            min={0}
            value={yearly}
            onChange={(e) => setYearly(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(contribution) || contribution < 0))}
          />
        </Field>
        <Field label="Annual interest rate (%)" hint="Enter the current notified PPF rate">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure (years)" hint="Standard PPF block is 15 years; extensions are in 5-year blocks">
          <Input
            type="number"
            min={1}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        <Field label="Opening balance (optional)" hint="Existing PPF balance before new yearly deposits">
          <Input
            type="number"
            min={0}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </Field>
      </Row>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total invested" value={fmt(invested, 0)} />
            <Stat label="Interest earned" value={fmt(interest, 0)} />
            <Stat label="Maturity value" value={fmt(maturity, 0)} />
          </div>
          <Stat
            label="Tenure"
            value={`${tenure} year${tenure === 1 ? "" : "s"} · rate ${fmt(annual, 2)}% p.a.`}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------ Reading time ------------------------------- */
export function ReadingTimeCalculator() {
  const [text, setText] = React.useState(
    "Paste your article, blog post, or email here to estimate how long it takes an average adult to read.",
  );
  const [wpm, setWpm] = React.useState("200");
  const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = text.length;
  const rate = Math.max(1, n(wpm) || 200);
  const minutes = words / rate;
  const totalSec = Math.round(minutes * 60);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  return (
    <div className="space-y-4">
      <Field label="Text">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="font-sans text-sm"
          placeholder="Paste your content…"
        />
      </Field>
      <Field label="Reading speed (words per minute)" hint="Adults typically read 200–250 WPM silently">
        <Input type="number" value={wpm} onChange={(e) => setWpm(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Words" value={fmt(words, 0)} />
        <Stat label="Characters" value={fmt(chars, 0)} />
        <Stat label="Reading time" value={words ? `${mins}m ${secs}s` : "—"} />
        <Stat label="Rounded" value={words ? `${Math.max(1, Math.ceil(minutes))} min read` : "—"} />
      </div>
      <Output
        value={words ? `${Math.max(1, Math.ceil(minutes))} min read · ${words.toLocaleString()} words · ${rate} WPM` : ""}
        rows={2}
        filename="reading-time.txt"
      />
    </div>
  );
}

/* ------------------------------ SWP Calculator ----------------------------- */
/**
 * Systematic Withdrawal Plan: each month the corpus grows at the monthly rate,
 * then a fixed withdrawal is taken. If balance cannot cover the withdrawal,
 * the remaining balance is withdrawn and the plan stops.
 */
export function swpProjection(
  corpus: number,
  monthlyWithdrawal: number,
  annualRatePct: number,
  years: number,
): {
  totalWithdrawn: number;
  finalCorpus: number;
  returnsEarned: number;
  monthsLasted: number;
  depleted: boolean;
} {
  if (!(corpus > 0) || !(monthlyWithdrawal > 0) || !(annualRatePct >= 0) || !(years > 0)) {
    return {
      totalWithdrawn: NaN,
      finalCorpus: NaN,
      returnsEarned: NaN,
      monthsLasted: 0,
      depleted: false,
    };
  }
  const months = Math.max(1, Math.round(years * 12));
  const r = annualRatePct / 100 / 12;
  let balance = corpus;
  let totalWithdrawn = 0;
  let monthsLasted = 0;
  let depleted = false;

  for (let m = 0; m < months; m++) {
    balance *= 1 + r;
    if (balance <= 0) {
      depleted = true;
      break;
    }
    if (balance < monthlyWithdrawal) {
      totalWithdrawn += balance;
      balance = 0;
      monthsLasted = m + 1;
      depleted = true;
      break;
    }
    balance -= monthlyWithdrawal;
    totalWithdrawn += monthlyWithdrawal;
    monthsLasted = m + 1;
  }

  const returnsEarned = totalWithdrawn + balance - corpus;
  return { totalWithdrawn, finalCorpus: balance, returnsEarned, monthsLasted, depleted };
}

export function SwpCalculator() {
  const [corpus, setCorpus] = React.useState("1000000");
  const [withdrawal, setWithdrawal] = React.useState("10000");
  const [rate, setRate] = React.useState("10");
  const [years, setYears] = React.useState("10");

  const c = n(corpus);
  const w = n(withdrawal);
  const annual = n(rate);
  const y = n(years);
  const monthsPlanned = Math.max(0, Math.round((Number.isFinite(y) ? y : 0) * 12));

  let error = "";
  if (corpus.trim() === "" || withdrawal.trim() === "" || rate.trim() === "" || years.trim() === "") {
    error = "Enter corpus, monthly withdrawal, return rate, and tenure.";
  } else if (!Number.isFinite(c) || c <= 0) {
    error = "Initial corpus must be a positive number.";
  } else if (!Number.isFinite(w) || w <= 0) {
    error = "Monthly withdrawal must be a positive number.";
  } else if (!Number.isFinite(annual) || annual < 0) {
    error = "Expected return cannot be negative.";
  } else if (!Number.isFinite(y) || y <= 0) {
    error = "Tenure must be greater than zero.";
  }

  const result =
    !error
      ? swpProjection(c, w, annual, y)
      : {
          totalWithdrawn: NaN,
          finalCorpus: NaN,
          returnsEarned: NaN,
          monthsLasted: 0,
          depleted: false,
        };

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Estimates assume a constant monthly return before each withdrawal. Actual mutual fund SWP
        payouts and NAV returns vary — this is a planning tool, not advice.
      </Notice>
      <Row>
        <Field label="Initial investment (corpus)">
          <Input
            type="number"
            min={0}
            value={corpus}
            onChange={(e) => setCorpus(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(c) || c <= 0))}
          />
        </Field>
        <Field label="Monthly withdrawal">
          <Input
            type="number"
            min={0}
            value={withdrawal}
            onChange={(e) => setWithdrawal(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(w) || w <= 0))}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Expected annual return (%)">
          <Input
            type="number"
            min={0}
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        <Field label="Tenure (years)">
          <Input
            type="number"
            min={0}
            step="0.5"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
      </Row>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          {result.depleted && (
            <Notice tone="error">
              Corpus would run out after {result.monthsLasted} month
              {result.monthsLasted === 1 ? "" : "s"}
              {monthsPlanned > result.monthsLasted
                ? ` (before the planned ${monthsPlanned} months). Lower the withdrawal or raise the expected return.`
                : "."}
            </Notice>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total withdrawn" value={fmt(result.totalWithdrawn, 0)} />
            <Stat label="Estimated returns" value={fmt(result.returnsEarned, 0)} />
            <Stat label="Final corpus" value={fmt(result.finalCorpus, 0)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Months lasted"
              value={
                result.depleted
                  ? `${result.monthsLasted} / ${monthsPlanned}`
                  : String(monthsPlanned)
              }
            />
            <Stat
              label="Planned withdrawals"
              value={`${fmt(w, 0)} × ${monthsPlanned} = ${fmt(w * monthsPlanned, 0)}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* --------------------------- Lumpsum Calculator ---------------------------- */
type LumpsumCompounding = "yearly" | "monthly";

/**
 * One-time (lumpsum) investment future value.
 * Yearly: A = P(1+r)^t — common for mutual-fund lumpsum planners.
 * Monthly: A = P(1+r/12)^(12t) — compounds more frequently at the same annual rate.
 */
export function lumpsumMaturity(
  principal: number,
  annualRatePct: number,
  years: number,
  compounding: LumpsumCompounding = "yearly",
): { maturity: number; gains: number } {
  if (!(principal > 0) || !(years > 0) || !(annualRatePct >= 0)) {
    return { maturity: NaN, gains: NaN };
  }
  const r = annualRatePct / 100;
  if (r === 0) return { maturity: principal, gains: 0 };
  const maturity =
    compounding === "monthly"
      ? principal * Math.pow(1 + r / 12, 12 * years)
      : principal * Math.pow(1 + r, years);
  return { maturity, gains: maturity - principal };
}

export function LumpsumCalculator() {
  const [principal, setPrincipal] = React.useState("100000");
  const [rate, setRate] = React.useState("12");
  const [years, setYears] = React.useState("10");
  const [months, setMonths] = React.useState("0");
  const [compounding, setCompounding] = React.useState<LumpsumCompounding>("yearly");

  const p = n(principal);
  const annual = n(rate);
  const yParts = Math.max(0, n(years) || 0);
  const mParts = Math.max(0, Math.min(11, Math.round(n(months) || 0)));
  const tenureYears = yParts + mParts / 12;
  const valid =
    Number.isFinite(p) &&
    p > 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    tenureYears > 0;

  const result = React.useMemo(
    () => (valid ? lumpsumMaturity(p, annual, tenureYears, compounding) : { maturity: NaN, gains: NaN }),
    [valid, p, annual, tenureYears, compounding],
  );

  const error = !valid
    ? "Enter a positive investment amount, a non-negative expected return, and a tenure greater than zero."
    : "";

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Estimates use compound growth at your assumed annual return. Actual mutual fund returns vary — this is a planning tool, not advice.
      </Notice>
      <Row>
        <Field label="Lumpsum investment amount">
          <Input
            type="number"
            min={0}
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            aria-invalid={!!error && !(p > 0)}
          />
        </Field>
        <Field label="Expected annual return (%)">
          <Input
            type="number"
            min={0}
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure (years)">
          <Input
            type="number"
            min={0}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        <Field label="Extra months (0–11)" hint="Optional — added to years">
          <Input
            type="number"
            min={0}
            max={11}
            step="1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </Field>
      </Row>
      <Field label="Compounding">
        <Select
          value={compounding}
          onChange={(e) => setCompounding(e.target.value as LumpsumCompounding)}
        >
          <option value="yearly">Yearly (common for MF lumpsum planners)</option>
          <option value="monthly">Monthly</option>
        </Select>
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Total invested" value={fmt(p, 0)} />
          <Stat label="Estimated returns" value={fmt(result.gains, 0)} />
          <Stat label="Maturity value" value={fmt(result.maturity, 0)} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------ EPF calculator ----------------------------- */
export type EpfEmployerMode = "epf-share" | "full-12" | "custom";

/** Planning model: monthly PF deposits, interest accrued monthly, credited yearly. */
export function epfMaturity(
  basicMonthly: number,
  employeePct: number,
  employerPct: number,
  annualRatePct: number,
  years: number,
  salaryHikePct = 0,
  openingBalance = 0,
): {
  maturity: number;
  totalEmployee: number;
  totalEmployer: number;
  totalContributed: number;
  interest: number;
} {
  if (
    !(basicMonthly > 0) ||
    !(employeePct >= 0) ||
    !(employerPct >= 0) ||
    !(annualRatePct >= 0) ||
    !(years > 0) ||
    !Number.isFinite(salaryHikePct) ||
    salaryHikePct < 0 ||
    !Number.isFinite(openingBalance) ||
    openingBalance < 0
  ) {
    return {
      maturity: NaN,
      totalEmployee: NaN,
      totalEmployer: NaN,
      totalContributed: NaN,
      interest: NaN,
    };
  }

  const nYears = Math.max(1, Math.round(years));
  const monthlyRate = annualRatePct / 100 / 12;
  let balance = openingBalance;
  let totalEmployee = 0;
  let totalEmployer = 0;
  let basic = basicMonthly;

  for (let y = 0; y < nYears; y++) {
    if (y > 0 && salaryHikePct > 0) {
      basic *= 1 + salaryHikePct / 100;
    }
    const emp = basic * (employeePct / 100);
    const er = basic * (employerPct / 100);
    let yearInterest = 0;
    for (let m = 0; m < 12; m++) {
      balance += emp + er;
      totalEmployee += emp;
      totalEmployer += er;
      yearInterest += balance * monthlyRate;
    }
    balance += yearInterest;
  }

  const totalContributed = totalEmployee + totalEmployer;
  return {
    maturity: balance,
    totalEmployee,
    totalEmployer,
    totalContributed,
    interest: balance - openingBalance - totalContributed,
  };
}

export function EpfCalculator() {
  const [basic, setBasic] = React.useState("50000");
  const [empPct, setEmpPct] = React.useState("12");
  const [employerMode, setEmployerMode] = React.useState<EpfEmployerMode>("epf-share");
  const [customErPct, setCustomErPct] = React.useState("3.67");
  const [rate, setRate] = React.useState("8.25");
  const [years, setYears] = React.useState("20");
  const [hike, setHike] = React.useState("5");
  const [opening, setOpening] = React.useState("0");

  const basicN = n(basic);
  const empN = n(empPct);
  const customErN = n(customErPct);
  const rateN = n(rate);
  const yearsN = Math.round(n(years) || 0);
  const hikeN = n(hike) || 0;
  const openN = n(opening) || 0;

  const employerPct =
    employerMode === "full-12" ? 12 : employerMode === "epf-share" ? 3.67 : customErN;

  const valid =
    Number.isFinite(basicN) &&
    basicN > 0 &&
    Number.isFinite(empN) &&
    empN >= 0 &&
    Number.isFinite(employerPct) &&
    employerPct >= 0 &&
    Number.isFinite(rateN) &&
    rateN >= 0 &&
    yearsN > 0 &&
    Number.isFinite(hikeN) &&
    hikeN >= 0 &&
    Number.isFinite(openN) &&
    openN >= 0;

  const result = valid
    ? epfMaturity(basicN, empN, employerPct, rateN, yearsN, hikeN, openN)
    : {
        maturity: NaN,
        totalEmployee: NaN,
        totalEmployer: NaN,
        totalContributed: NaN,
        interest: NaN,
      };

  let error = "";
  if (basic.trim() === "" || empPct.trim() === "" || rate.trim() === "" || years.trim() === "") {
    error = "Enter basic salary, contribution rates, interest rate, and years of service.";
  } else if (!Number.isFinite(basicN) || basicN <= 0) {
    error = "Monthly basic salary (EPF wages) must be a positive number.";
  } else if (!Number.isFinite(empN) || empN < 0) {
    error = "Employee contribution % cannot be negative.";
  } else if (employerMode === "custom" && (!Number.isFinite(customErN) || customErN < 0)) {
    error = "Employer EPF contribution % cannot be negative.";
  } else if (!Number.isFinite(rateN) || rateN < 0) {
    error = "Interest rate cannot be negative.";
  } else if (!(yearsN > 0)) {
    error = "Years of service must be at least 1.";
  } else if (!Number.isFinite(hikeN) || hikeN < 0) {
    error = "Annual salary hike % cannot be negative.";
  } else if (!Number.isFinite(openN) || openN < 0) {
    error = "Opening EPF balance cannot be negative.";
  }

  const monthlyEmp = valid ? basicN * (empN / 100) : NaN;
  const monthlyEr = valid ? basicN * (employerPct / 100) : NaN;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Planning estimate only. Real EPF interest is notified periodically and credited per EPFO rules;
        employer EPS vs EPF splits and wage ceilings can differ by employer. Confirm balances on the
        official EPFO / UAN portal.
      </Notice>
      <Row>
        <Field label="Monthly basic salary (EPF wages)" hint="Often basic + DA used for PF">
          <Input
            type="number"
            min={0}
            value={basic}
            onChange={(e) => setBasic(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(basicN) || basicN <= 0))}
          />
        </Field>
        <Field label="Employee contribution (%)" hint="Common default is 12%">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={empPct}
            onChange={(e) => setEmpPct(e.target.value)}
          />
        </Field>
      </Row>
      <Field label="Employer contribution to EPF">
        <Select
          value={employerMode}
          onChange={(e) => setEmployerMode(e.target.value as EpfEmployerMode)}
        >
          <option value="epf-share">3.67% to EPF (common when 8.33% goes to EPS)</option>
          <option value="full-12">12% to EPF (no EPS split modeled)</option>
          <option value="custom">Custom employer EPF %</option>
        </Select>
      </Field>
      {employerMode === "custom" && (
        <Field label="Custom employer EPF contribution (%)">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={customErPct}
            onChange={(e) => setCustomErPct(e.target.value)}
          />
        </Field>
      )}
      <Row>
        <Field label="Assumed annual interest rate (%)" hint="Enter the rate you want to model">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
        <Field label="Years of service">
          <Input
            type="number"
            min={1}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Expected annual salary hike (%)" hint="Applied from year 2 onward; use 0 for flat salary">
          <Input
            type="number"
            min={0}
            step="0.1"
            value={hike}
            onChange={(e) => setHike(e.target.value)}
          />
        </Field>
        <Field label="Opening EPF balance (optional)" hint="Existing PF balance before new contributions">
          <Input
            type="number"
            min={0}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </Field>
      </Row>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Maturity value" value={fmt(result.maturity, 0)} />
            <Stat label="Interest earned" value={fmt(result.interest, 0)} />
            <Stat label="Employee total" value={fmt(result.totalEmployee, 0)} />
            <Stat label="Employer (EPF) total" value={fmt(result.totalEmployer, 0)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total contributed" value={fmt(result.totalContributed, 0)} />
            <Stat label="Month 1 employee" value={fmt(monthlyEmp, 0)} />
            <Stat label="Month 1 employer (EPF)" value={fmt(monthlyEr, 0)} />
          </div>
          <Stat
            label="Model"
            value={`${yearsN} year${yearsN === 1 ? "" : "s"} · emp ${fmt(empN, 2)}% · er ${fmt(employerPct, 2)}% · ${fmt(rateN, 2)}% p.a.`}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------ NPS Calculator ----------------------------- */
/**
 * National Pension System planning estimate:
 * grow optional opening corpus + monthly contributions (optional annual step-up)
 * at an assumed annual return, then split retirement corpus into lump-sum vs annuity illustration.
 */
export function npsCorpus(
  monthly: number,
  annualRatePct: number,
  years: number,
  stepPct: number,
  opening: number,
  lumpSumPct: number,
): {
  corpus: number;
  invested: number;
  returns: number;
  lumpSum: number;
  annuityPurchase: number;
  months: number;
} {
  const months = Math.max(0, Math.round(years * 12));
  if (!(years > 0) || !(annualRatePct >= 0) || !(monthly >= 0) || !(opening >= 0)) {
    return {
      corpus: NaN,
      invested: NaN,
      returns: NaN,
      lumpSum: NaN,
      annuityPurchase: NaN,
      months: 0,
    };
  }
  const r = annualRatePct / 100 / 12;
  const step = Math.max(0, stepPct) / 100;
  const lump = Math.min(100, Math.max(0, lumpSumPct)) / 100;

  let invested = 0;
  let contribValue = 0;
  for (let m = 0; m < months; m++) {
    const yearIndex = Math.floor(m / 12);
    const payment = monthly * Math.pow(1 + step, yearIndex);
    invested += payment;
    const monthsLeft = months - m;
    if (r === 0) contribValue += payment;
    else contribValue += payment * Math.pow(1 + r, monthsLeft);
  }

  const openingGrown =
    opening <= 0 ? 0 : r === 0 ? opening : opening * Math.pow(1 + r, months);
  const corpus = contribValue + openingGrown;
  const totalIn = invested + opening;
  const returns = corpus - totalIn;

  return {
    corpus,
    invested: totalIn,
    returns,
    lumpSum: corpus * lump,
    annuityPurchase: corpus * (1 - lump),
    months,
  };
}

export function NpsCalculator() {
  const [monthly, setMonthly] = React.useState("10000");
  const [rate, setRate] = React.useState("10");
  const [currentAge, setCurrentAge] = React.useState("30");
  const [retireAge, setRetireAge] = React.useState("60");
  const [stepUp, setStepUp] = React.useState("5");
  const [opening, setOpening] = React.useState("0");
  const [lumpPct, setLumpPct] = React.useState("60");

  const monthlyN = n(monthly);
  const rateN = n(rate);
  const ageN = Math.round(n(currentAge) || 0);
  const retireN = Math.round(n(retireAge) || 0);
  const stepN = n(stepUp) || 0;
  const openN = n(opening) || 0;
  const lumpN = n(lumpPct);
  const years = retireN - ageN;

  const valid =
    Number.isFinite(monthlyN) &&
    monthlyN >= 0 &&
    Number.isFinite(rateN) &&
    rateN >= 0 &&
    ageN > 0 &&
    retireN > ageN &&
    Number.isFinite(stepN) &&
    stepN >= 0 &&
    Number.isFinite(openN) &&
    openN >= 0 &&
    Number.isFinite(lumpN) &&
    lumpN >= 0 &&
    lumpN <= 100 &&
    (monthlyN > 0 || openN > 0);

  const result = valid
    ? npsCorpus(monthlyN, rateN, years, stepN, openN, lumpN)
    : {
        corpus: NaN,
        invested: NaN,
        returns: NaN,
        lumpSum: NaN,
        annuityPurchase: NaN,
        months: 0,
      };

  let error = "";
  if (
    monthly.trim() === "" ||
    rate.trim() === "" ||
    currentAge.trim() === "" ||
    retireAge.trim() === "" ||
    lumpPct.trim() === ""
  ) {
    error = "Enter monthly contribution, expected return, ages, and lump-sum %.";
  } else if (!Number.isFinite(monthlyN) || monthlyN < 0) {
    error = "Monthly contribution cannot be negative.";
  } else if (!Number.isFinite(rateN) || rateN < 0) {
    error = "Expected annual return cannot be negative.";
  } else if (!(ageN > 0)) {
    error = "Current age must be a positive number.";
  } else if (!(retireN > ageN)) {
    error = "Retirement age must be greater than current age.";
  } else if (!Number.isFinite(stepN) || stepN < 0) {
    error = "Annual step-up % cannot be negative.";
  } else if (!Number.isFinite(openN) || openN < 0) {
    error = "Opening NPS balance cannot be negative.";
  } else if (!Number.isFinite(lumpN) || lumpN < 0 || lumpN > 100) {
    error = "Lump-sum percentage must be between 0 and 100.";
  } else if (!(monthlyN > 0 || openN > 0)) {
    error = "Enter a monthly contribution and/or an opening balance.";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Planning estimate only. NPS returns depend on fund choice and markets; exit rules,
        annuity purchase requirements, and tax treatment can change. Confirm details with your
        PRAN statement and a qualified advisor — this is not investment advice.
      </Notice>
      <Row>
        <Field label="Monthly contribution" hint="Employee + employer total if both contribute">
          <Input
            type="number"
            min={0}
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(monthlyN) || monthlyN < 0))}
          />
        </Field>
        <Field label="Expected annual return (%)" hint="Blended equity/debt assumption you want to model">
          <Input
            type="number"
            min={0}
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Current age">
          <Input
            type="number"
            min={1}
            step="1"
            value={currentAge}
            onChange={(e) => setCurrentAge(e.target.value)}
          />
        </Field>
        <Field label="Retirement age" hint="Common planning ages are 60 or 65">
          <Input
            type="number"
            min={2}
            step="1"
            value={retireAge}
            onChange={(e) => setRetireAge(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Annual contribution step-up (%)" hint="Raise monthly deposit each year; use 0 for flat">
          <Input
            type="number"
            min={0}
            step="1"
            value={stepUp}
            onChange={(e) => setStepUp(e.target.value)}
          />
        </Field>
        <Field label="Opening NPS balance (optional)" hint="Existing corpus before new contributions">
          <Input
            type="number"
            min={0}
            value={opening}
            onChange={(e) => setOpening(e.target.value)}
          />
        </Field>
      </Row>
      <Field
        label="Lump-sum at retirement (%)"
        hint="Remainder is illustrated as annuity purchase (rules may require a minimum annuity share)"
      >
        <Input
          type="number"
          min={0}
          max={100}
          step="1"
          value={lumpPct}
          onChange={(e) => setLumpPct(e.target.value)}
        />
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Corpus at retirement" value={fmt(result.corpus, 0)} />
            <Stat label="Estimated returns" value={fmt(result.returns, 0)} />
            <Stat label="Total invested" value={fmt(result.invested, 0)} />
            <Stat label="Years to retirement" value={String(years)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={`Lump-sum (${fmt(lumpN, 0)}%)`} value={fmt(result.lumpSum, 0)} />
            <Stat
              label={`Annuity purchase (${fmt(100 - lumpN, 0)}%)`}
              value={fmt(result.annuityPurchase, 0)}
            />
            <Stat label="Contribution months" value={String(result.months)} />
          </div>
          <Stat
            label="Model"
            value={`${ageN}→${retireN} · ${fmt(monthlyN, 0)}/mo · step-up ${fmt(stepN, 0)}% · ${fmt(rateN, 2)}% p.a.`}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------ Gratuity Calculator ------------------------ */
export type GratuityFormula = "act-26" | "private-30";

/**
 * Indian gratuity planning estimate.
 * Act formula: (last drawn salary × 15 × service years) / 26
 * Private / non-Act illustration: same numerator with ÷30
 * Half-year rounding: leftover months strictly greater than 6 count as a full year.
 */
export function gratuityAmount(
  lastSalary: number,
  years: number,
  months: number,
  formula: GratuityFormula,
  roundHalfYear: boolean,
): {
  gratuity: number;
  serviceYears: number;
  divisor: number;
  dailyWage: number;
} {
  if (!(lastSalary > 0) || years < 0 || months < 0 || months >= 12) {
    return { gratuity: NaN, serviceYears: NaN, divisor: formula === "act-26" ? 26 : 30, dailyWage: NaN };
  }
  const totalMonths = Math.round(years) * 12 + Math.round(months);
  let serviceYears: number;
  if (roundHalfYear) {
    const completed = Math.floor(totalMonths / 12);
    const rem = totalMonths % 12;
    serviceYears = rem > 6 ? completed + 1 : completed;
  } else {
    serviceYears = totalMonths / 12;
  }
  const divisor = formula === "act-26" ? 26 : 30;
  const dailyWage = lastSalary / divisor;
  const gratuity = dailyWage * 15 * serviceYears;
  return { gratuity, serviceYears, divisor, dailyWage };
}

export function GratuityCalculator() {
  const [salary, setSalary] = React.useState("50000");
  const [years, setYears] = React.useState("10");
  const [months, setMonths] = React.useState("0");
  const [formula, setFormula] = React.useState<GratuityFormula>("act-26");
  const [roundHalf, setRoundHalf] = React.useState(true);
  const [exemptCap, setExemptCap] = React.useState("2000000");

  const salaryN = n(salary);
  const yearsN = Math.round(n(years) || 0);
  const monthsN = Math.round(n(months) || 0);
  const capN = n(exemptCap);

  const valid =
    Number.isFinite(salaryN) &&
    salaryN > 0 &&
    yearsN >= 0 &&
    monthsN >= 0 &&
    monthsN < 12 &&
    (yearsN > 0 || monthsN > 0) &&
    Number.isFinite(capN) &&
    capN >= 0;

  const result = valid
    ? gratuityAmount(salaryN, yearsN, monthsN, formula, roundHalf)
    : { gratuity: NaN, serviceYears: NaN, divisor: formula === "act-26" ? 26 : 30, dailyWage: NaN };

  const taxableIllustration =
    valid && Number.isFinite(result.gratuity)
      ? Math.max(0, result.gratuity - capN)
      : NaN;
  const exemptIllustration =
    valid && Number.isFinite(result.gratuity) ? Math.min(result.gratuity, capN) : NaN;
  const eligibleHint = valid && result.serviceYears >= 5;

  let error = "";
  if (salary.trim() === "" || years.trim() === "") {
    error = "Enter last drawn salary and years of service.";
  } else if (!Number.isFinite(salaryN) || salaryN <= 0) {
    error = "Last drawn salary (basic + DA) must be a positive number.";
  } else if (!(yearsN >= 0) || !Number.isFinite(yearsN)) {
    error = "Completed years of service cannot be negative.";
  } else if (!(monthsN >= 0 && monthsN < 12)) {
    error = "Extra months must be between 0 and 11.";
  } else if (!(yearsN > 0 || monthsN > 0)) {
    error = "Enter at least some service tenure (years and/or months).";
  } else if (!Number.isFinite(capN) || capN < 0) {
    error = "Tax exemption ceiling cannot be negative.";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Planning estimate only. Eligibility, rounding, and tax treatment depend on whether the Payment
        of Gratuity Act applies to your employer and on current law. Confirm with payroll / HR and a
        qualified advisor — this is not tax or legal advice.
      </Notice>
      <Row>
        <Field label="Last drawn salary (basic + DA)" hint="Monthly wages used for gratuity">
          <Input
            type="number"
            min={0}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(salaryN) || salaryN <= 0))}
          />
        </Field>
        <Field label="Formula">
          <Select
            value={formula}
            onChange={(e) => setFormula(e.target.value as GratuityFormula)}
            aria-label="Gratuity formula"
          >
            <option value="act-26">Payment of Gratuity Act (÷26)</option>
            <option value="private-30">Private / non-Act illustration (÷30)</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label="Completed years of service">
          <Input
            type="number"
            min={0}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </Field>
        <Field label="Extra months" hint="0–11; used with half-year rounding">
          <Input
            type="number"
            min={0}
            max={11}
            step="1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </Field>
      </Row>
      <Field label="Service year rounding">
        <Select
          value={roundHalf ? "half" : "exact"}
          onChange={(e) => setRoundHalf(e.target.value === "half")}
          aria-label="Service year rounding"
        >
          <option value="half">Round up when leftover months &gt; 6 (common Act-style)</option>
          <option value="exact">Use exact years including fractional months</option>
        </Select>
      </Field>
      <Field
        label="Tax exemption ceiling (optional)"
        hint="Illustration only — enter the exemption limit you are modeling; leave high to ignore"
      >
        <Input
          type="number"
          min={0}
          value={exemptCap}
          onChange={(e) => setExemptCap(e.target.value)}
        />
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          {!eligibleHint && (
            <Notice tone="info">
              Many Act-covered cases require about 5 years of continuous service for gratuity on
              resignation/retirement (exceptions can apply for death or disablement). Your modeled
              service years are below 5 — treat the amount as a formula illustration only.
            </Notice>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Estimated gratuity" value={fmt(result.gratuity, 0)} />
            <Stat label="Service years used" value={fmt(result.serviceYears, roundHalf ? 0 : 2)} />
            <Stat label={`Daily wage (÷${result.divisor})`} value={fmt(result.dailyWage, 2)} />
            <Stat label="15 days × years" value={fmt(15 * result.serviceYears, roundHalf ? 0 : 2)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Exempt (vs your ceiling)" value={fmt(exemptIllustration, 0)} />
            <Stat label="Above ceiling (illustration)" value={fmt(taxableIllustration, 0)} />
            <Stat
              label="Model"
              value={`${fmt(salaryN, 0)} · ${yearsN}y ${monthsN}m · ÷${result.divisor}`}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ HRA calculator ------------------------------ */

export type HraCityType = "metro" | "non-metro";
export type HraPeriod = "monthly" | "yearly";

export function hraExemption(input: {
  basic: number;
  da: number;
  hraReceived: number;
  rentPaid: number;
  city: HraCityType;
}): {
  salaryForHra: number;
  limitActualHra: number;
  limitRentMinus10: number;
  limitCityPercent: number;
  cityPercent: number;
  exempt: number;
  taxable: number;
  bindingLimit: "actual-hra" | "rent-minus-10" | "city-percent";
} {
  const { basic, da, hraReceived, rentPaid, city } = input;
  const salaryForHra = basic + da;
  const cityPercent = city === "metro" ? 0.5 : 0.4;
  const limitActualHra = Math.max(0, hraReceived);
  const limitRentMinus10 = Math.max(0, rentPaid - 0.1 * salaryForHra);
  const limitCityPercent = Math.max(0, cityPercent * salaryForHra);
  const exempt = Math.min(limitActualHra, limitRentMinus10, limitCityPercent);
  const taxable = Math.max(0, hraReceived - exempt);

  let bindingLimit: "actual-hra" | "rent-minus-10" | "city-percent" = "actual-hra";
  if (exempt === limitRentMinus10 && limitRentMinus10 <= limitActualHra && limitRentMinus10 <= limitCityPercent) {
    bindingLimit = "rent-minus-10";
  } else if (
    exempt === limitCityPercent &&
    limitCityPercent <= limitActualHra &&
    limitCityPercent <= limitRentMinus10
  ) {
    bindingLimit = "city-percent";
  } else {
    bindingLimit = "actual-hra";
  }

  return {
    salaryForHra,
    limitActualHra,
    limitRentMinus10,
    limitCityPercent,
    cityPercent,
    exempt,
    taxable,
    bindingLimit,
  };
}

export function HraCalculator() {
  const [period, setPeriod] = React.useState<HraPeriod>("monthly");
  const [basic, setBasic] = React.useState("50000");
  const [da, setDa] = React.useState("5000");
  const [hraReceived, setHraReceived] = React.useState("20000");
  const [rentPaid, setRentPaid] = React.useState("25000");
  const [city, setCity] = React.useState<HraCityType>("metro");

  const basicN = n(basic);
  const daN = n(da);
  const hraN = n(hraReceived);
  const rentN = n(rentPaid);

  const valid =
    Number.isFinite(basicN) &&
    basicN >= 0 &&
    Number.isFinite(daN) &&
    daN >= 0 &&
    Number.isFinite(hraN) &&
    hraN >= 0 &&
    Number.isFinite(rentN) &&
    rentN >= 0 &&
    (basicN > 0 || daN > 0);

  const result = valid
    ? hraExemption({
        basic: basicN,
        da: daN,
        hraReceived: hraN,
        rentPaid: rentN,
        city,
      })
    : null;

  let error = "";
  if (basic.trim() === "" || hraReceived.trim() === "" || rentPaid.trim() === "") {
    error = "Enter basic salary, HRA received, and rent paid.";
  } else if (!Number.isFinite(basicN) || basicN < 0) {
    error = "Basic salary must be zero or a positive number.";
  } else if (!Number.isFinite(daN) || daN < 0) {
    error = "Dearness allowance must be zero or a positive number.";
  } else if (!(basicN > 0 || daN > 0)) {
    error = "Enter at least some salary (basic and/or DA) used for the HRA rules.";
  } else if (!Number.isFinite(hraN) || hraN < 0) {
    error = "HRA received must be zero or a positive number.";
  } else if (!Number.isFinite(rentN) || rentN < 0) {
    error = "Rent paid must be zero or a positive number.";
  }

  const periodLabel = period === "monthly" ? "per month" : "per year";
  const bindingLabel =
    result?.bindingLimit === "rent-minus-10"
      ? "Rent − 10% of salary"
      : result?.bindingLimit === "city-percent"
        ? city === "metro"
          ? "50% of salary (metro)"
          : "40% of salary (non-metro)"
        : "Actual HRA received";

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Planning estimate only. HRA exemption under Section 10(13A) / Rule 2A depends on how your
        employer defines salary, metro classification, and current tax law. Confirm with payroll / a
        tax advisor — this is not tax filing advice.
      </Notice>
      <Row>
        <Field label="Input period" hint="Use the same period for all money fields">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value as HraPeriod)}
            aria-label="Input period"
          >
            <option value="monthly">Monthly amounts</option>
            <option value="yearly">Yearly amounts</option>
          </Select>
        </Field>
        <Field label="City type" hint="Metro = Delhi, Mumbai, Kolkata, Chennai (classic 50% rule)">
          <Select
            value={city}
            onChange={(e) => setCity(e.target.value as HraCityType)}
            aria-label="City type for HRA"
          >
            <option value="metro">Metro (50% of salary)</option>
            <option value="non-metro">Non-metro (40% of salary)</option>
          </Select>
        </Field>
      </Row>
      <Row>
        <Field label={`Basic salary (${periodLabel})`}>
          <Input
            type="number"
            min={0}
            value={basic}
            onChange={(e) => setBasic(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(basicN) || basicN < 0))}
          />
        </Field>
        <Field label={`Dearness allowance (${periodLabel})`} hint="Include DA that forms part of salary for HRA">
          <Input type="number" min={0} value={da} onChange={(e) => setDa(e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label={`HRA received (${periodLabel})`}>
          <Input
            type="number"
            min={0}
            value={hraReceived}
            onChange={(e) => setHraReceived(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(hraN) || hraN < 0))}
          />
        </Field>
        <Field label={`Rent paid (${periodLabel})`} hint="Actual rent for the same period">
          <Input
            type="number"
            min={0}
            value={rentPaid}
            onChange={(e) => setRentPaid(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(rentN) || rentN < 0))}
          />
        </Field>
      </Row>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label={`Exempt HRA (${periodLabel})`} value={fmt(result.exempt, 0)} />
            <Stat label={`Taxable HRA (${periodLabel})`} value={fmt(result.taxable, 0)} />
            <Stat label={`Salary for HRA (basic + DA)`} value={fmt(result.salaryForHra, 0)} />
            <Stat label="Binding limit" value={bindingLabel} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Limit 1 — actual HRA" value={fmt(result.limitActualHra, 0)} />
            <Stat label="Limit 2 — rent − 10% salary" value={fmt(result.limitRentMinus10, 0)} />
            <Stat
              label={`Limit 3 — ${Math.round(result.cityPercent * 100)}% of salary`}
              value={fmt(result.limitCityPercent, 0)}
            />
          </div>
          {result.limitRentMinus10 === 0 && rentN > 0 && (
            <Notice tone="info">
              Rent minus 10% of salary is zero or negative at these inputs — that often happens when
              rent is low relative to basic + DA. Exemption then cannot exceed that rent-based limit.
            </Notice>
          )}
          {hraN === 0 && (
            <Notice tone="info">
              HRA received is zero, so exempt and taxable HRA are both zero. Enter the HRA component
              from your payslip to model exemption.
            </Notice>
          )}
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------ SSY Calculator ----------------------------- */
/**
 * Sukanya Samriddhi Yojana maturity with yearly contributions for a deposit
 * window, then continued yearly compounding until account maturity.
 * Common planning model: deposits for up to 15 years; account often matures
 * at 21 years from opening (interest continues after deposits stop).
 */
export function ssyMaturity(
  yearlyContribution: number,
  annualRatePct: number,
  depositYears: number,
  maturityYears: number,
  openingBalance = 0,
): { invested: number; maturity: number; interest: number; depositYearsUsed: number } {
  if (
    !(yearlyContribution >= 0) ||
    !(annualRatePct >= 0) ||
    !(depositYears > 0) ||
    !(maturityYears > 0) ||
    !Number.isFinite(openingBalance) ||
    openingBalance < 0
  ) {
    return { invested: NaN, maturity: NaN, interest: NaN, depositYearsUsed: 0 };
  }
  const r = annualRatePct / 100;
  const nMaturity = Math.max(1, Math.round(maturityYears));
  const nDeposit = Math.min(Math.max(1, Math.round(depositYears)), nMaturity);
  let balance = openingBalance;
  let contributions = 0;
  for (let y = 0; y < nMaturity; y++) {
    if (y < nDeposit) {
      balance += yearlyContribution;
      contributions += yearlyContribution;
    }
    balance *= 1 + r;
  }
  const invested = openingBalance + contributions;
  return {
    invested,
    maturity: balance,
    interest: balance - invested,
    depositYearsUsed: nDeposit,
  };
}

export function SsyCalculator() {
  const [yearly, setYearly] = React.useState("150000");
  const [rate, setRate] = React.useState("8.2");
  const [depositYears, setDepositYears] = React.useState("15");
  const [maturityYears, setMaturityYears] = React.useState("21");
  const [opening, setOpening] = React.useState("0");

  const contribution = n(yearly);
  const annual = n(rate);
  const depositTenure = Math.round(n(depositYears) || 0);
  const maturityTenure = Math.round(n(maturityYears) || 0);
  const openBal = n(opening) || 0;

  const valid =
    Number.isFinite(contribution) &&
    contribution >= 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    depositTenure > 0 &&
    maturityTenure > 0 &&
    depositTenure <= maturityTenure &&
    Number.isFinite(openBal) &&
    openBal >= 0 &&
    (contribution > 0 || openBal > 0);

  const { invested, maturity, interest, depositYearsUsed } = valid
    ? ssyMaturity(contribution, annual, depositTenure, maturityTenure, openBal)
    : { invested: NaN, maturity: NaN, interest: NaN, depositYearsUsed: 0 };

  const growthYearsAfterDeposits = Math.max(0, maturityTenure - depositYearsUsed);

  let error = "";
  if (
    yearly.trim() === "" ||
    rate.trim() === "" ||
    depositYears.trim() === "" ||
    maturityYears.trim() === ""
  ) {
    error = "Enter yearly deposit, interest rate, deposit years, and maturity years.";
  } else if (!Number.isFinite(contribution) || contribution < 0) {
    error = "Yearly deposit cannot be negative.";
  } else if (!Number.isFinite(annual) || annual < 0) {
    error = "Interest rate cannot be negative.";
  } else if (!(depositTenure > 0)) {
    error = "Deposit years must be at least 1.";
  } else if (!(maturityTenure > 0)) {
    error = "Maturity years must be at least 1.";
  } else if (depositTenure > maturityTenure) {
    error = "Deposit years cannot exceed maturity years.";
  } else if (!Number.isFinite(openBal) || openBal < 0) {
    error = "Opening balance cannot be negative.";
  } else if (contribution === 0 && openBal === 0) {
    error = "Enter a yearly deposit or an opening balance greater than zero.";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        SSY rules (deposit limits, girl-child eligibility, premature closure, and the notified rate)
        can change. This tool uses yearly compounding for planning — confirm final maturity with your
        bank or post office. Not investment or tax advice.
      </Notice>
      <Row>
        <Field label="Yearly deposit" hint="Common planning max is ₹1,50,000 per financial year">
          <Input
            type="number"
            min={0}
            value={yearly}
            onChange={(e) => setYearly(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(contribution) || contribution < 0))}
          />
        </Field>
        <Field label="Annual interest rate (%)" hint="Enter the current notified SSY rate">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field
          label="Deposit years"
          hint="Deposits are commonly allowed for 15 years from account opening"
        >
          <Input
            type="number"
            min={1}
            step="1"
            value={depositYears}
            onChange={(e) => setDepositYears(e.target.value)}
            aria-invalid={Boolean(
              error && (!(depositTenure > 0) || depositTenure > maturityTenure),
            )}
          />
        </Field>
        <Field
          label="Maturity years"
          hint="Standard SSY tenure is often modeled as 21 years from opening"
        >
          <Input
            type="number"
            min={1}
            step="1"
            value={maturityYears}
            onChange={(e) => setMaturityYears(e.target.value)}
            aria-invalid={Boolean(error && (!(maturityTenure > 0) || depositTenure > maturityTenure))}
          />
        </Field>
      </Row>
      <Field label="Opening balance (optional)" hint="Existing SSY balance before new yearly deposits">
        <Input
          type="number"
          min={0}
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
        />
      </Field>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Total invested" value={fmt(invested, 0)} />
            <Stat label="Interest earned" value={fmt(interest, 0)} />
            <Stat label="Maturity value" value={fmt(maturity, 0)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Deposit window"
              value={`${depositYearsUsed} year${depositYearsUsed === 1 ? "" : "s"} of deposits`}
            />
            <Stat
              label="Account tenure"
              value={`${maturityTenure} year${maturityTenure === 1 ? "" : "s"} · ${fmt(annual, 2)}% p.a.`}
            />
          </div>
          {growthYearsAfterDeposits > 0 && (
            <Notice tone="info">
              After deposits stop, the balance keeps compounding for {growthYearsAfterDeposits} more
              year{growthYearsAfterDeposits === 1 ? "" : "s"} until the modeled maturity year — that
              is a common SSY planning pattern (15 years of deposits inside a longer account life).
            </Notice>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------ SCSS Calculator ---------------------------- */
/**
 * Senior Citizen Savings Scheme planning model: lump-sum deposit, interest paid
 * out quarterly (not compounded into principal), principal returned at maturity.
 * Tenure is commonly modeled as 5 years (optionally extended).
 */
export function scssInterest(
  principal: number,
  annualRatePct: number,
  tenureYears: number,
): {
  quarterlyInterest: number;
  annualInterest: number;
  totalInterest: number;
  maturityPrincipal: number;
  totalPayout: number;
  quarters: number;
} {
  if (!(principal > 0) || !(annualRatePct >= 0) || !(tenureYears > 0)) {
    return {
      quarterlyInterest: NaN,
      annualInterest: NaN,
      totalInterest: NaN,
      maturityPrincipal: NaN,
      totalPayout: NaN,
      quarters: 0,
    };
  }
  const years = tenureYears;
  const annualInterest = (principal * annualRatePct) / 100;
  const quarterlyInterest = annualInterest / 4;
  const totalInterest = annualInterest * years;
  const quarters = Math.round(years * 4);
  return {
    quarterlyInterest,
    annualInterest,
    totalInterest,
    maturityPrincipal: principal,
    totalPayout: principal + totalInterest,
    quarters,
  };
}

export function ScssCalculator() {
  const [principal, setPrincipal] = React.useState("1500000");
  const [rate, setRate] = React.useState("8.2");
  const [years, setYears] = React.useState("5");
  const [months, setMonths] = React.useState("0");

  const p = n(principal);
  const annual = n(rate);
  const yParts = Math.max(0, n(years) || 0);
  const mParts = Math.max(0, Math.min(11, Math.round(n(months) || 0)));
  const tenureYears = yParts + mParts / 12;

  const valid =
    Number.isFinite(p) &&
    p > 0 &&
    Number.isFinite(annual) &&
    annual >= 0 &&
    tenureYears > 0;

  const result = valid
    ? scssInterest(p, annual, tenureYears)
    : {
        quarterlyInterest: NaN,
        annualInterest: NaN,
        totalInterest: NaN,
        maturityPrincipal: NaN,
        totalPayout: NaN,
        quarters: 0,
      };

  let error = "";
  if (principal.trim() === "" || rate.trim() === "") {
    error = "Enter deposit amount and interest rate.";
  } else if (!Number.isFinite(p) || p <= 0) {
    error = "Deposit amount must be a positive number.";
  } else if (!Number.isFinite(annual) || annual < 0) {
    error = "Interest rate cannot be negative.";
  } else if (tenureYears <= 0) {
    error = "Set tenure to at least 1 month.";
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        SCSS interest is typically paid out quarterly (not compounded into the deposit). Eligibility,
        deposit limits, premature closure, extension rules, and the notified rate can change —
        confirm with your bank or post office. Not investment or tax advice.
      </Notice>
      <Row>
        <Field
          label="Deposit amount (lump sum)"
          hint="One-time SCSS deposit you want to model"
        >
          <Input
            type="number"
            min={0}
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            aria-invalid={Boolean(error && (!Number.isFinite(p) || p <= 0))}
          />
        </Field>
        <Field label="Annual interest rate (%)" hint="Enter the current notified SCSS rate">
          <Input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </Field>
      </Row>
      <Row>
        <Field label="Tenure — years" hint="Standard SCSS tenure is often modeled as 5 years">
          <Input
            type="number"
            min={0}
            step="1"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            aria-invalid={Boolean(error && tenureYears <= 0)}
          />
        </Field>
        <Field label="Extra months" hint="0–11 (added to years); useful for partial-year models">
          <Input
            type="number"
            min={0}
            max={11}
            step="1"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </Field>
      </Row>
      {error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Quarterly interest" value={fmt(result.quarterlyInterest, 0)} />
            <Stat label="Total interest" value={fmt(result.totalInterest, 0)} />
            <Stat label="Principal at maturity" value={fmt(result.maturityPrincipal, 0)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="Annual interest" value={fmt(result.annualInterest, 0)} />
            <Stat
              label="Total payout (principal + interest)"
              value={fmt(result.totalPayout, 0)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat
              label="Tenure"
              value={
                mParts > 0
                  ? `${yParts} yr ${mParts} mo (${fmt(tenureYears, 2)} years)`
                  : `${yParts} year${yParts === 1 ? "" : "s"}`
              }
            />
            <Stat
              label="Interest payouts"
              value={`${result.quarters} quarterly payment${result.quarters === 1 ? "" : "s"} · ${fmt(annual, 2)}% p.a.`}
            />
          </div>
          <Notice tone="info">
            In the standard SCSS payout model, interest leaves the account each quarter and the
            deposit principal is returned at maturity — so “principal at maturity” equals your
            original deposit, while “total payout” adds all interest received over the tenure.
          </Notice>
        </>
      )}
    </div>
  );
}
