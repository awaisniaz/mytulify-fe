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
