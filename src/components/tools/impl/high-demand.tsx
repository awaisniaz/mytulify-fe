"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Notice, Output, CopyButton } from "@/components/tools/shared";
import { validateIban, formatIban } from "@/lib/iban";
import { exportBrandedPdf } from "@/lib/pdf-doc";
import { download } from "@/lib/utils";

/* --------------------------- LLMs.txt Generator ---------------------------- */
export function LlmsTxtGenerator() {
  const [title, setTitle] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [urls, setUrls] = React.useState("");
  const [sitemap, setSitemap] = React.useState("");

  const pages = React.useMemo(() => {
    const fromUrls = urls
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.startsWith("http"));
    if (fromUrls.length) return fromUrls;

    if (!sitemap.trim()) return [];
    try {
      const doc = new DOMParser().parseFromString(sitemap, "text/xml");
      return [...doc.querySelectorAll("url loc, loc")].map((n) => n.textContent?.trim() ?? "").filter(Boolean);
    } catch {
      return [];
    }
  }, [urls, sitemap]);

  const out = React.useMemo(() => {
    if (!title.trim()) return "";
    const lines = [`# ${title.trim()}`, desc.trim() ? `> ${desc.trim()}` : "", "", "## Key pages", ""];
    for (const u of pages.slice(0, 80)) {
      try {
        const p = new URL(u);
        const label = p.pathname === "/" ? "Home" : p.pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ?? u;
        lines.push(`- [${label}](${u})`);
      } catch {
        lines.push(`- ${u}`);
      }
    }
    if (pages.length === 0) lines.push("- Add URLs above or paste a sitemap.xml");
    lines.push("", "## Optional", "- Upload this file to `yoursite.com/llms.txt` for AI crawlers.");
    return lines.filter((l, i) => l !== "" || i < 3).join("\n");
  }, [title, desc, pages]);

  return (
    <div className="space-y-4">
      <Notice tone="info">Trending for AI SEO in 2026 — helps ChatGPT, Claude & Google AI find your best pages.</Notice>
      <Field label="Site / project name"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Mytulify" /></Field>
      <Field label="Short description"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="font-sans" placeholder="Online tools for PDF, SEO, developers…" /></Field>
      <Field label="Important URLs" hint="One per line (or use sitemap below)">
        <Textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={5} className="font-mono text-sm" placeholder={"https://yoursite.com/\nhttps://yoursite.com/pricing"} />
      </Field>
      <Field label="Or paste sitemap.xml"><Textarea value={sitemap} onChange={(e) => setSitemap(e.target.value)} rows={4} className="font-mono text-xs" placeholder="<urlset>…</urlset>" /></Field>
      <Output value={out} rows={14} filename="llms.txt" />
    </div>
  );
}

/* ---------------------- HTTP Security Headers Generator ---------------------- */
export function SecurityHeadersGenerator() {
  const [hsts, setHsts] = React.useState(true);
  const [csp, setCsp] = React.useState("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:");
  const [frame, setFrame] = React.useState("SAMEORIGIN");
  const [referrer, setReferrer] = React.useState("strict-origin-when-cross-origin");
  const [server, setServer] = React.useState("nginx");

  const headers = [
    hsts && "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload",
    csp.trim() && `Content-Security-Policy: ${csp.trim()}`,
    frame && `X-Frame-Options: ${frame}`,
    "X-Content-Type-Options: nosniff",
    `Referrer-Policy: ${referrer}`,
    "Permissions-Policy: camera=(), microphone=(), geolocation=()",
  ].filter(Boolean).join("\n");

  const nginx = headers.split("\n").map((h) => `    add_header ${h.replace(": ", " $")};`).join("\n");
  const apache = headers.split("\n").map((h) => `    Header always set ${h.replace(": ", " ")}`).join("\n");

  const snippet = server === "nginx"
    ? `# Nginx\nserver {\n${nginx}\n}`
    : server === "apache"
      ? `# Apache\n<IfModule mod_headers.c>\n${apache}\n</IfModule>`
      : `# Cloudflare _headers or next.config headers\n${headers}`;

  return (
    <div className="space-y-4">
      <Notice tone="info">Generate OWASP-recommended security headers — fix the #1 gap on most small sites.</Notice>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={hsts} onChange={(e) => setHsts(e.target.checked)} /> HSTS (HTTPS only)</label>
      <Field label="Content-Security-Policy"><Textarea value={csp} onChange={(e) => setCsp(e.target.value)} rows={3} className="font-mono text-xs" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="X-Frame-Options">
          <Select value={frame} onChange={(e) => setFrame(e.target.value)}><option>SAMEORIGIN</option><option>DENY</option></Select>
        </Field>
        <Field label="Referrer-Policy">
          <Select value={referrer} onChange={(e) => setReferrer(e.target.value)}>
            <option>strict-origin-when-cross-origin</option>
            <option>no-referrer</option>
            <option>same-origin</option>
          </Select>
        </Field>
        <Field label="Export for">
          <Select value={server} onChange={(e) => setServer(e.target.value)}><option value="nginx">Nginx</option><option value="apache">Apache</option><option value="other">Raw headers</option></Select>
        </Field>
      </div>
      <Output value={snippet} rows={12} filename="security-headers.conf" />
    </div>
  );
}

/* ----------------------------- ads.txt Generator --------------------------- */
export function AdsTxtGenerator() {
  const [domain, setDomain] = React.useState("");
  const [google, setGoogle] = React.useState("");
  const [manager, setManager] = React.useState("");
  const [direct, setDirect] = React.useState("");

  const lines = [
    google.trim() && `google.com, ${google.trim()}, DIRECT, f08c47fec0942fa0`,
    manager.trim() && `# Manager domain\n${manager.trim()}, ${domain.trim() || "YOUR-PUB-ID"}, DIRECT`,
    direct.trim(),
    domain.trim() && !google.trim() && `# Add your AdSense line:\n# google.com, pub-XXXXXXXX, DIRECT, f08c47fec0942fa0`,
  ].filter(Boolean);

  const out = lines.join("\n") || "# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0";

  return (
    <div className="space-y-4">
      <Field label="Your domain"><Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mytulify.com" /></Field>
      <Field label="Google AdSense publisher ID" hint="pub-XXXXXXXXXX"><Input value={google} onChange={(e) => setGoogle(e.target.value)} placeholder="pub-1234567890123456" /></Field>
      <Field label="Extra lines" hint="Optional SSP / reseller entries"><Textarea value={direct} onChange={(e) => setDirect(e.target.value)} rows={3} className="font-mono text-sm" /></Field>
      <Output value={out} rows={6} filename="ads.txt" />
      <p className="text-xs text-muted">Upload to <code className="rounded bg-surface-2 px-1">yoursite.com/ads.txt</code></p>
    </div>
  );
}

/* ----------------------------- Mock Data Generator ------------------------- */
const FIRST = ["Alex", "Sam", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Avery", "Quinn", "Jamie"];
const LAST = ["Khan", "Ali", "Ahmed", "Shah", "Malik", "Hassan", "Reed", "Brooks", "Hayes", "Wells"];
const DOMAINS = ["example.com", "mail.test", "demo.io"];

function mockUsers(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]}`,
    email: `user${i + 1}@${DOMAINS[i % DOMAINS.length]}`,
    age: 22 + (i % 35),
    active: i % 3 !== 0,
  }));
}

function mockProducts(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `SKU-${1000 + i}`,
    name: `Product ${i + 1}`,
    price: Math.round((9.99 + i * 4.5) * 100) / 100,
    stock: 10 + (i * 7) % 200,
    category: ["Tools", "Books", "Electronics", "Home"][i % 4],
  }));
}

export function MockDataGenerator() {
  const [type, setType] = React.useState("users");
  const [count, setCount] = React.useState(10);
  const [format, setFormat] = React.useState("json");

  const data = type === "users" ? mockUsers(count) : mockProducts(count);
  const json = JSON.stringify(data, null, 2);
  const csv =
    type === "users"
      ? ["id,name,email,age,active", ...mockUsers(count).map((r) => `${r.id},${r.name},${r.email},${r.age},${r.active}`)].join("\n")
      : ["id,name,price,stock,category", ...mockProducts(count).map((r) => `${r.id},${r.name},${r.price},${r.stock},${r.category}`)].join("\n");

  const out = format === "json" ? json : csv;

  return (
    <div className="space-y-4">
      <Notice tone="info">High-demand dev tool — fake users & products for API testing. Runs locally.</Notice>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Dataset"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="users">Users</option><option value="products">Products</option></Select></Field>
        <Field label="Rows"><Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} /></Field>
        <Field label="Format"><Select value={format} onChange={(e) => setFormat(e.target.value)}><option value="json">JSON</option><option value="csv">CSV</option></Select></Field>
      </div>
      <div className="flex gap-2">
        <CopyButton value={out} />
        <Button variant="secondary" size="sm" onClick={() => download(out, `mock-${type}.${format === "json" ? "json" : "csv"}`, format === "json" ? "application/json" : "text/csv")}>Download</Button>
      </div>
      <Output value={out} rows={14} />
    </div>
  );
}

/* ------------------------------ IBAN Validator ----------------------------- */
export function IbanValidator() {
  const [raw, setRaw] = React.useState("");
  const result = raw.trim() ? validateIban(raw) : null;

  return (
    <div className="space-y-4">
      <Field label="IBAN" hint="Pakistan, EU, UK & 80+ countries"><Input value={raw} onChange={(e) => setRaw(e.target.value)} className="font-mono" placeholder="PK36 SCBL 0000 0011 2345 6702" /></Field>
      {result && (
        <Notice tone={result.valid ? "success" : "error"}>
          {result.valid ? (
            <>Valid IBAN — {result.country} · {formatIban(result.iban)}</>
          ) : (
            <>{result.error}</>
          )}
        </Notice>
      )}
    </div>
  );
}

/* --------------------------- PWA Manifest Generator -------------------------- */
export function PwaManifestGenerator() {
  const [name, setName] = React.useState("My App");
  const [short, setShort] = React.useState("App");
  const [start, setStart] = React.useState("/");
  const [theme, setTheme] = React.useState("#6366f1");
  const [bg, setBg] = React.useState("#ffffff");
  const [display, setDisplay] = React.useState("standalone");

  const manifest = JSON.stringify({
    name,
    short_name: short,
    start_url: start,
    display,
    background_color: bg,
    theme_color: theme,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }, null, 2);

  const html = `<link rel="manifest" href="/manifest.json" />\n<meta name="theme-color" content="${theme}" />`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="App name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Short name"><Input value={short} onChange={(e) => setShort(e.target.value)} maxLength={12} /></Field>
        <Field label="Start URL"><Input value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="Display mode"><Select value={display} onChange={(e) => setDisplay(e.target.value)}><option>standalone</option><option>fullscreen</option><option>minimal-ui</option><option>browser</option></Select></Field>
        <Field label="Theme color"><input type="color" value={theme} onChange={(e) => setTheme(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
        <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
      </div>
      <Field label="manifest.json"><Output value={manifest} rows={12} filename="manifest.json" mime="application/json" /></Field>
      <Field label="HTML tags"><Output value={html} rows={3} filename="pwa-tags.html" /></Field>
    </div>
  );
}

/* ----------------------------- Invoice Generator --------------------------- */
type LineItem = { desc: string; qty: number; price: number };

export function InvoiceGenerator() {
  const [from, setFrom] = React.useState({ name: "", email: "", address: "" });
  const [to, setTo] = React.useState({ name: "", email: "", address: "" });
  const [items, setItems] = React.useState<LineItem[]>([{ desc: "Service", qty: 1, price: 100 }]);
  const [tax, setTax] = React.useState(0);
  const [invNo, setInvNo] = React.useState("INV-001");
  const [loading, setLoading] = React.useState(false);

  const sub = items.reduce((s, i) => s + i.qty * i.price, 0);
  const taxAmt = sub * (tax / 100);
  const total = sub + taxAmt;

  async function pdf() {
    setLoading(true);
    try {
      const lines = items
        .filter((it) => it.desc.trim() || it.qty || it.price)
        .map((it) => {
          const lineTotal = (it.qty * it.price).toFixed(2);
          return `${it.desc || "Item"}  ·  qty ${it.qty}  ·  $${it.price.toFixed(2)}  ·  $${lineTotal}`;
        })
        .join("\n");

      const fromBlock = [from.name, from.email, from.address].filter(Boolean).join("\n") || "—";
      const toBlock = [to.name, to.email, to.address].filter(Boolean).join("\n") || "—";
      const totals = [
        `Subtotal: $${sub.toFixed(2)}`,
        tax ? `Tax (${tax}%): $${taxAmt.toFixed(2)}` : "",
        `Total due: $${total.toFixed(2)}`,
      ]
        .filter(Boolean)
        .join("\n");

      await exportBrandedPdf({
        title: "Invoice",
        subtitle: `Professional invoice generated with Mytulify`,
        meta: [
          { label: "Invoice #", value: invNo || "INV-001" },
          { label: "Date", value: new Date().toLocaleDateString() },
          { label: "Amount due", value: `$${total.toFixed(2)}` },
        ],
        sections: [
          { heading: "From", body: fromBlock },
          { heading: "Bill to", body: toBlock },
          { heading: "Line items", body: lines || "No items" },
          { heading: "Totals", body: totals },
        ],
        signatures: ["Authorized signature"],
        footerLeft: "Mytulify · Invoice Generator",
        filename: `invoice-${(invNo || "INV-001").replace(/[^\w.-]+/g, "-")}.pdf`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">High-volume business tool — create & download PDF invoices. No watermark.</Notice>
      <Field label="Invoice #"><Input value={invNo} onChange={(e) => setInvNo(e.target.value)} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-bold">Your business</p>
          <Input placeholder="Name" value={from.name} onChange={(e) => setFrom({ ...from, name: e.target.value })} />
          <Input placeholder="Email" value={from.email} onChange={(e) => setFrom({ ...from, email: e.target.value })} />
          <Textarea placeholder="Address" value={from.address} onChange={(e) => setFrom({ ...from, address: e.target.value })} rows={2} className="font-sans" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold">Client</p>
          <Input placeholder="Name" value={to.name} onChange={(e) => setTo({ ...to, name: e.target.value })} />
          <Input placeholder="Email" value={to.email} onChange={(e) => setTo({ ...to, email: e.target.value })} />
          <Textarea placeholder="Address" value={to.address} onChange={(e) => setTo({ ...to, address: e.target.value })} rows={2} className="font-sans" />
        </div>
      </div>
      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2">
          <Input className="col-span-6" placeholder="Description" value={it.desc} onChange={(e) => { const n = [...items]; n[idx] = { ...it, desc: e.target.value }; setItems(n); }} />
          <Input className="col-span-2" type="number" min={1} value={it.qty} onChange={(e) => { const n = [...items]; n[idx] = { ...it, qty: Number(e.target.value) || 1 }; setItems(n); }} />
          <Input className="col-span-2" type="number" min={0} step={0.01} value={it.price} onChange={(e) => { const n = [...items]; n[idx] = { ...it, price: Number(e.target.value) || 0 }; setItems(n); }} />
          <Button variant="secondary" size="sm" className="col-span-2" onClick={() => setItems(items.filter((_, i) => i !== idx))} disabled={items.length === 1}>Remove</Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={() => setItems([...items, { desc: "", qty: 1, price: 0 }])}>+ Line item</Button>
      <Field label="Tax %"><Input type="number" min={0} max={100} value={tax} onChange={(e) => setTax(Number(e.target.value) || 0)} /></Field>
      <p className="text-lg font-bold">Total: ${total.toFixed(2)}</p>
      <Button onClick={pdf} disabled={loading}>{loading ? "Generating…" : "Download PDF invoice"}</Button>
    </div>
  );
}
