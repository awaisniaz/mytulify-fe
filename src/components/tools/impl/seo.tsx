"use client";

import * as React from "react";
import { Input, Select, Textarea } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Notice, Stat } from "@/components/tools/shared";

/* ------------------------------ Meta tag gen ------------------------------- */
export function MetaTagGenerator() {
  const [d, setD] = React.useState({ title: "", description: "", keywords: "", author: "", robots: "index, follow" });
  const out = [
    d.title && `<title>${d.title}</title>`,
    d.description && `<meta name="description" content="${d.description}">`,
    d.keywords && `<meta name="keywords" content="${d.keywords}">`,
    d.author && `<meta name="author" content="${d.author}">`,
    `<meta name="robots" content="${d.robots}">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <Field label="Page title" hint={`${d.title.length}/60`}><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
      <Field label="Meta description" hint={`${d.description.length}/160`}><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} className="font-sans" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Keywords"><Input value={d.keywords} onChange={(e) => setD({ ...d, keywords: e.target.value })} /></Field>
        <Field label="Author"><Input value={d.author} onChange={(e) => setD({ ...d, author: e.target.value })} /></Field>
      </div>
      <Output value={out} rows={6} filename="meta-tags.html" />
    </div>
  );
}

/* ------------------------------ Open Graph --------------------------------- */
export function OpenGraphGenerator() {
  const [d, setD] = React.useState({ title: "", description: "", url: "", image: "", type: "website", site: "" });
  const out = [
    `<meta property="og:type" content="${d.type}">`,
    d.title && `<meta property="og:title" content="${d.title}">`,
    d.description && `<meta property="og:description" content="${d.description}">`,
    d.url && `<meta property="og:url" content="${d.url}">`,
    d.image && `<meta property="og:image" content="${d.image}">`,
    d.site && `<meta property="og:site_name" content="${d.site}">`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field label="Type"><Select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}><option>website</option><option>article</option><option>product</option><option>profile</option></Select></Field>
        <Field label="URL"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} /></Field>
        <Field label="Image URL"><Input value={d.image} onChange={(e) => setD({ ...d, image: e.target.value })} /></Field>
        <Field label="Site name"><Input value={d.site} onChange={(e) => setD({ ...d, site: e.target.value })} /></Field>
      </div>
      <Field label="Description"><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={2} className="font-sans" /></Field>
      <Output value={out} rows={6} filename="og-tags.html" />
    </div>
  );
}
export function TwitterCardGenerator() {
  const [d, setD] = React.useState({ card: "summary_large_image", title: "", description: "", image: "", site: "" });
  const out = [
    `<meta name="twitter:card" content="${d.card}">`,
    d.site && `<meta name="twitter:site" content="${d.site}">`,
    d.title && `<meta name="twitter:title" content="${d.title}">`,
    d.description && `<meta name="twitter:description" content="${d.description}">`,
    d.image && `<meta name="twitter:image" content="${d.image}">`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Card type"><Select value={d.card} onChange={(e) => setD({ ...d, card: e.target.value })}><option>summary</option><option>summary_large_image</option></Select></Field>
        <Field label="@username"><Input value={d.site} onChange={(e) => setD({ ...d, site: e.target.value })} placeholder="@handle" /></Field>
        <Field label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field label="Image URL"><Input value={d.image} onChange={(e) => setD({ ...d, image: e.target.value })} /></Field>
      </div>
      <Field label="Description"><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={2} className="font-sans" /></Field>
      <Output value={out} rows={5} filename="twitter-card.html" />
    </div>
  );
}

/* ------------------------------ Keyword density ---------------------------- */
export function KeywordDensity() {
  const [text, setText] = React.useState("");
  const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
  const total = words.length;
  const map = new Map<string, number>();
  for (const w of words) if (w.length > 2) map.set(w, (map.get(w) || 0) + 1);
  const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="font-sans" placeholder="Paste your content…" />
      <div className="grid grid-cols-2 gap-3"><Stat label="Total words" value={total} /><Stat label="Unique words" value={map.size} /></div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-4 py-2 text-left">Keyword</th><th className="px-4 py-2 text-right">Count</th><th className="px-4 py-2 text-right">Density</th></tr></thead>
          <tbody>{top.map(([w, c]) => (
            <tr key={w} className="border-t border-border"><td className="px-4 py-1.5">{w}</td><td className="px-4 py-1.5 text-right">{c}</td><td className="px-4 py-1.5 text-right">{((c / total) * 100).toFixed(1)}%</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------ Robots.txt --------------------------------- */
export function RobotsTxtGenerator() {
  const [d, setD] = React.useState({ agent: "*", disallow: "/admin\n/private", allow: "", sitemap: "" });
  const out = [
    `User-agent: ${d.agent}`,
    ...d.disallow.split("\n").filter(Boolean).map((p) => `Disallow: ${p}`),
    ...d.allow.split("\n").filter(Boolean).map((p) => `Allow: ${p}`),
    d.sitemap && `\nSitemap: ${d.sitemap}`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="User-agent"><Input value={d.agent} onChange={(e) => setD({ ...d, agent: e.target.value })} /></Field>
        <Field label="Sitemap URL"><Input value={d.sitemap} onChange={(e) => setD({ ...d, sitemap: e.target.value })} /></Field>
        <Field label="Disallow (one per line)"><Textarea value={d.disallow} onChange={(e) => setD({ ...d, disallow: e.target.value })} rows={4} /></Field>
        <Field label="Allow (one per line)"><Textarea value={d.allow} onChange={(e) => setD({ ...d, allow: e.target.value })} rows={4} /></Field>
      </div>
      <Output value={out} rows={6} filename="robots.txt" />
    </div>
  );
}

/* ------------------------------ Sitemap ------------------------------------ */
export function SitemapGenerator() {
  const [urls, setUrls] = React.useState("https://example.com/\nhttps://example.com/about");
  const [freq, setFreq] = React.useState("weekly");
  const out = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.split("\n").filter((u) => u.trim()).map((u) => `  <url>\n    <loc>${u.trim()}</loc>\n    <changefreq>${freq}</changefreq>\n  </url>`).join("\n") +
    "\n</urlset>";
  return (
    <div className="space-y-4">
      <Field label="URLs (one per line)"><Textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={6} /></Field>
      <Field label="Change frequency"><Select value={freq} onChange={(e) => setFreq(e.target.value)}>{["always", "hourly", "daily", "weekly", "monthly", "yearly"].map((f) => <option key={f}>{f}</option>)}</Select></Field>
      <Output value={out} rows={8} filename="sitemap.xml" />
    </div>
  );
}

/* ------------------------------ Schema markup ------------------------------ */
export function SchemaGenerator({ kind }: { kind: "auto" | "faq" | "breadcrumb" }) {
  const [type, setType] = React.useState(kind === "auto" ? "Article" : kind);
  const [json, setJson] = React.useState("");
  React.useEffect(() => {
    const samples: Record<string, object> = {
      Article: { "@context": "https://schema.org", "@type": "Article", headline: "Your headline", author: { "@type": "Person", name: "Author" }, datePublished: "2026-01-01" },
      Product: { "@context": "https://schema.org", "@type": "Product", name: "Product name", offers: { "@type": "Offer", price: "9.99", priceCurrency: "USD" } },
      Organization: { "@context": "https://schema.org", "@type": "Organization", name: "Company", url: "https://example.com", logo: "https://example.com/logo.png" },
      faq: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Question?", acceptedAnswer: { "@type": "Answer", text: "Answer." } }] },
      breadcrumb: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://example.com" }] },
    };
    setJson(JSON.stringify(samples[type] ?? samples.Article, null, 2));
  }, [type]);
  return (
    <div className="space-y-4">
      {kind === "auto" && (
        <Field label="Schema type"><Select value={type} onChange={(e) => setType(e.target.value)}><option>Article</option><option>Product</option><option>Organization</option></Select></Field>
      )}
      <Notice tone="info">Edit the sample below, then paste it inside a &lt;script type=&quot;application/ld+json&quot;&gt; tag.</Notice>
      <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} />
      <div className="flex gap-2"><CopyButton value={`<script type="application/ld+json">\n${json}\n</script>`} label="Copy with script tag" /></div>
    </div>
  );
}

/* ------------------------------ UTM builder -------------------------------- */
export function UtmBuilder() {
  const [d, setD] = React.useState({ url: "", source: "", medium: "", campaign: "", term: "", content: "" });
  const params = new URLSearchParams();
  if (d.source) params.set("utm_source", d.source);
  if (d.medium) params.set("utm_medium", d.medium);
  if (d.campaign) params.set("utm_campaign", d.campaign);
  if (d.term) params.set("utm_term", d.term);
  if (d.content) params.set("utm_content", d.content);
  const qs = params.toString();
  const out = d.url ? `${d.url}${d.url.includes("?") ? "&" : "?"}${qs}` : "";
  return (
    <div className="space-y-4">
      <Field label="Website URL"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="https://example.com/page" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Campaign source"><Input value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })} placeholder="google" /></Field>
        <Field label="Campaign medium"><Input value={d.medium} onChange={(e) => setD({ ...d, medium: e.target.value })} placeholder="cpc" /></Field>
        <Field label="Campaign name"><Input value={d.campaign} onChange={(e) => setD({ ...d, campaign: e.target.value })} placeholder="spring_sale" /></Field>
        <Field label="Term (optional)"><Input value={d.term} onChange={(e) => setD({ ...d, term: e.target.value })} /></Field>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all text-sm">{out || "Your tracking URL…"}</code>
        <CopyButton value={out} />
      </div>
    </div>
  );
}

/* ------------------------------ SERP preview ------------------------------- */
type LengthFocus = "both" | "title" | "description";

function lengthLabel(len: number, idealMin: number, idealMax: number, unit: string) {
  if (len === 0) return `Enter a ${unit}`;
  if (len < idealMin) return "Too short";
  if (len <= idealMax) return "Ideal length";
  return "Too long — will truncate";
}

export function SerpPreview({ focus = "both" }: { focus?: LengthFocus }) {
  const [d, setD] = React.useState({
    title: "Your page title goes here — Brand",
    url: "https://example.com/page",
    desc: "This is what your meta description will look like in Google search results. Keep it under 160 characters.",
  });
  const showTitle = focus !== "description";
  const showDesc = focus !== "title";

  return (
    <div className="space-y-4">
      {showTitle && (
        <Field label="Title" hint={`${d.title.length}/60 · ${lengthLabel(d.title.length, 50, 60, "title")}`}>
          <Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
        </Field>
      )}
      <Field label="URL"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} /></Field>
      {showDesc && (
        <Field label="Meta description" hint={`${d.desc.length}/160 · ${lengthLabel(d.desc.length, 150, 160, "description")}`}>
          <Textarea value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} rows={3} className="font-sans" />
        </Field>
      )}
      <div className="rounded-xl border border-border bg-white p-4">
        <p className="text-sm text-[#202124]">{d.url}</p>
        <p className="truncate text-xl text-[#1a0dab]">{d.title || "Page title preview"}</p>
        <p className="text-sm text-[#4d5156]">
          {(d.desc || "Meta description preview").slice(0, 160)}
          {d.desc.length > 160 && "…"}
        </p>
      </div>
      <div className={`grid gap-3 ${showTitle && showDesc ? "grid-cols-2" : "grid-cols-1"}`}>
        {showTitle && (
          <Stat
            label={`Title · ${lengthLabel(d.title.length, 50, 60, "title")}`}
            value={`${d.title.length}/60`}
          />
        )}
        {showDesc && (
          <Stat
            label={`Description · ${lengthLabel(d.desc.length, 150, 160, "description")}`}
            value={`${d.desc.length}/160`}
          />
        )}
      </div>
    </div>
  );
}

export const MetaDescriptionLengthChecker = () => <SerpPreview focus="description" />;
export const MetaTitleLengthChecker = () => <SerpPreview focus="title" />;

/* ------------------------------ Small helpers ------------------------------ */
export function TagPair({ make, label1 = "Field", label2 = "Field 2", placeholder1 = "", placeholder2 = "", build }: {
  make?: never; label1?: string; label2?: string; placeholder1?: string; placeholder2?: string;
  build: (a: string, b: string) => string;
}) {
  void make;
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={label1}><Input value={a} onChange={(e) => setA(e.target.value)} placeholder={placeholder1} /></Field>
        <Field label={label2}><Input value={b} onChange={(e) => setB(e.target.value)} placeholder={placeholder2} /></Field>
      </div>
      <Output value={a ? build(a, b) : ""} rows={3} filename="tag.html" />
    </div>
  );
}
export const CanonicalTag = () => <TagPair label1="Canonical URL" label2="(unused)" placeholder1="https://example.com/page" build={(a) => `<link rel="canonical" href="${a}">`} />;
export const RobotsMetaTag = () => {
  const [v, setV] = React.useState("index, follow");
  return (
    <div className="space-y-4">
      <Field label="Directive"><Select value={v} onChange={(e) => setV(e.target.value)}>{["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow", "noarchive", "nosnippet"].map((o) => <option key={o}>{o}</option>)}</Select></Field>
      <Output value={`<meta name="robots" content="${v}">`} rows={2} />
    </div>
  );
};
export const HreflangTag = () => <TagPair label1="Language code" label2="URL" placeholder1="en-us" placeholder2="https://example.com/en" build={(a, b) => `<link rel="alternate" hreflang="${a}" href="${b}">`} />;

export function HtmlTagStripper() {
  const [text, setText] = React.useState("");
  const out = text.replace(/<[^>]+>/g, "").replace(/\s{2,}/g, " ").trim();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label="HTML"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Paste HTML…" /></Field>
      <Field label="Plain text"><Output value={out} rows={10} mono={false} filename="text.txt" /></Field>
    </div>
  );
}

export function EmailExtractor() {
  const [text, setText] = React.useState("");
  const emails = [...new Set(text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])];
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Paste text or HTML containing emails…" />
      <Notice tone="info">{emails.length} unique email{emails.length !== 1 ? "s" : ""} found</Notice>
      <Output value={emails.join("\n")} rows={Math.min(8, Math.max(2, emails.length))} filename="emails.txt" />
    </div>
  );
}

export function CodeTextRatio() {
  const [html, setHtml] = React.useState("");
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const ratio = html.length ? ((text.length / html.length) * 100).toFixed(1) : "0";
  return (
    <div className="space-y-4">
      <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={8} placeholder="Paste full page HTML…" />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="HTML size" value={html.length} />
        <Stat label="Text size" value={text.length} />
        <Stat label="Text ratio" value={`${ratio}%`} />
      </div>
    </div>
  );
}

export function KeywordCombiner() {
  const [a, setA] = React.useState("buy\ncheap");
  const [b, setB] = React.useState("shoes\nbags");
  const listA = a.split("\n").filter(Boolean);
  const listB = b.split("\n").filter(Boolean);
  const combos = listA.flatMap((x) => listB.map((y) => `${x} ${y}`));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="List 1"><Textarea value={a} onChange={(e) => setA(e.target.value)} rows={5} /></Field>
        <Field label="List 2"><Textarea value={b} onChange={(e) => setB(e.target.value)} rows={5} /></Field>
      </div>
      <Output value={combos.join("\n")} rows={Math.min(10, combos.length)} filename="keywords.txt" mono={false} />
    </div>
  );
}

export function ReadabilityChecker() {
  const [text, setText] = React.useState("");
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;
  const words = (text.match(/\b\w+\b/g) || []).length || 1;
  const syllables = (text.toLowerCase().match(/[aeiouy]+/g) || []).length || 1;
  const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  const level = flesch > 90 ? "Very easy" : flesch > 70 ? "Easy" : flesch > 50 ? "Fairly hard" : flesch > 30 ? "Difficult" : "Very confusing";
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="font-sans" placeholder="Paste your text…" />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Reading ease" value={Math.max(0, Math.round(flesch))} />
        <Stat label="Grade level" value={Math.max(0, Math.round(grade))} />
        <Stat label="Verdict" value={level} />
      </div>
    </div>
  );
}

export function MetaTagsAnalyzer() {
  const [html, setHtml] = React.useState("");
  const rows: [string, string][] = [];
  if (html.trim() && typeof window !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    rows.push(["Title", doc.querySelector("title")?.textContent ?? "— missing —"]);
    rows.push(["Description", doc.querySelector('meta[name="description"]')?.getAttribute("content") ?? "— missing —"]);
    rows.push(["Keywords", doc.querySelector('meta[name="keywords"]')?.getAttribute("content") ?? "—"]);
    rows.push(["Canonical", doc.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "—"]);
    rows.push(["OG title", doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "—"]);
    rows.push(["OG image", doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "—"]);
    rows.push(["Viewport", doc.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "— missing —"]);
    rows.push(["H1 count", String(doc.querySelectorAll("h1").length)]);
  }
  return (
    <div className="space-y-4">
      <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={6} placeholder="Paste a page's HTML source…" />
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <tbody>{rows.map(([k, v]) => (
              <tr key={k} className="border-b border-border last:border-0">
                <td className="w-32 bg-surface-2 px-4 py-2 font-medium">{k}</td>
                <td className={`px-4 py-2 ${v.includes("missing") ? "text-rose-500" : ""}`}>{v}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function RobotsValidator() {
  const [txt, setTxt] = React.useState("User-agent: *\nDisallow: /admin\nSitemap: https://example.com/sitemap.xml");
  const issues: string[] = [];
  const lines = txt.split("\n");
  if (!/user-agent:/i.test(txt)) issues.push("Missing a User-agent directive.");
  lines.forEach((l, i) => {
    const t = l.trim();
    if (t && !t.startsWith("#") && !/^(user-agent|disallow|allow|sitemap|crawl-delay|host)\s*:/i.test(t))
      issues.push(`Line ${i + 1}: unrecognised directive "${t.slice(0, 30)}"`);
  });
  return (
    <div className="space-y-4">
      <Textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={8} />
      {issues.length === 0
        ? <Notice tone="success">✓ robots.txt looks valid.</Notice>
        : <div className="space-y-1">{issues.map((x, i) => <Notice key={i} tone="error">{x}</Notice>)}</div>}
    </div>
  );
}

export function HtaccessGenerator() {
  const [opt, setOpt] = React.useState("https");
  const snippets: Record<string, string> = {
    https: "RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]",
    www: "RewriteEngine On\nRewriteCond %{HTTP_HOST} !^www\\. [NC]\nRewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]",
    nowww: "RewriteEngine On\nRewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]\nRewriteRule ^(.*)$ https://%1/$1 [L,R=301]",
    cache: '<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType image/jpg "access plus 1 year"\n  ExpiresByType text/css "access plus 1 month"\n</IfModule>',
    gzip: "<IfModule mod_deflate.c>\n  AddOutputFilterByType DEFLATE text/html text/css application/javascript\n</IfModule>",
  };
  return (
    <div className="space-y-4">
      <Field label="Rule"><Select value={opt} onChange={(e) => setOpt(e.target.value)}>
        <option value="https">Force HTTPS</option><option value="www">Redirect to www</option><option value="nowww">Redirect to non-www</option><option value="cache">Browser caching</option><option value="gzip">Gzip compression</option>
      </Select></Field>
      <Output value={snippets[opt]} rows={7} filename=".htaccess" />
    </div>
  );
}
