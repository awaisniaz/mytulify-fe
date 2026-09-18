"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Notice, Stat, ToolBar, TextStatBar } from "@/components/tools/shared";
import { FetchFromUrl, extractMeta } from "@/components/tools/fetch-from-url";

/* ------------------------------ Meta tag gen ------------------------------- */
export function MetaTagGenerator() {
  const [d, setD] = React.useState({
    title: "", description: "", keywords: "", author: "", robots: "index, follow",
    url: "", image: "", site: "", twitter: "", charset: "UTF-8", theme: "",
    og: true, tw: true,
  });
  const set = (k: string, v: string | boolean) => setD((prev) => ({ ...prev, [k]: v }));
  const out = [
    `<meta charset="${d.charset}">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    d.title && `<title>${d.title}</title>`,
    d.description && `<meta name="description" content="${d.description}">`,
    d.keywords && `<meta name="keywords" content="${d.keywords}">`,
    d.author && `<meta name="author" content="${d.author}">`,
    `<meta name="robots" content="${d.robots}">`,
    d.url && `<link rel="canonical" href="${d.url}">`,
    d.theme && `<meta name="theme-color" content="${d.theme}">`,
    d.og && d.title && `<meta property="og:title" content="${d.title}">`,
    d.og && d.description && `<meta property="og:description" content="${d.description}">`,
    d.og && d.url && `<meta property="og:url" content="${d.url}">`,
    d.og && d.image && `<meta property="og:image" content="${d.image}">`,
    d.og && d.site && `<meta property="og:site_name" content="${d.site}">`,
    d.og && `<meta property="og:type" content="website">`,
    d.tw && `<meta name="twitter:card" content="${d.image ? "summary_large_image" : "summary"}">`,
    d.tw && d.twitter && `<meta name="twitter:site" content="${d.twitter}">`,
    d.tw && d.title && `<meta name="twitter:title" content="${d.title}">`,
    d.tw && d.description && `<meta name="twitter:description" content="${d.description}">`,
    d.tw && d.image && `<meta name="twitter:image" content="${d.image}">`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <Field label="Page title" hint={`${d.title.length}/60`}><Input value={d.title} onChange={(e) => set("title", e.target.value)} /></Field>
      <Field label="Meta description" hint={`${d.description.length}/160`}><Textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={3} className="font-sans" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Keywords"><Input value={d.keywords} onChange={(e) => set("keywords", e.target.value)} /></Field>
        <Field label="Author"><Input value={d.author} onChange={(e) => set("author", e.target.value)} /></Field>
        <Field label="Canonical URL"><Input value={d.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" /></Field>
        <Field label="Image URL"><Input value={d.image} onChange={(e) => set("image", e.target.value)} /></Field>
        <Field label="Site name"><Input value={d.site} onChange={(e) => set("site", e.target.value)} /></Field>
        <Field label="Twitter handle"><Input value={d.twitter} onChange={(e) => set("twitter", e.target.value)} placeholder="@site" /></Field>
        <Field label="Robots">
          <Select value={d.robots} onChange={(e) => set("robots", e.target.value)}>
            {["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow", "noarchive", "nosnippet"].map((o) => <option key={o}>{o}</option>)}
          </Select>
        </Field>
        <Field label="Theme color"><Input value={d.theme} onChange={(e) => set("theme", e.target.value)} placeholder="#0ea5e9" /></Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={d.og} onChange={(e) => set("og", e.target.checked)} /> Open Graph</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={d.tw} onChange={(e) => set("tw", e.target.checked)} /> Twitter cards</label>
      </div>
      <Output value={out} rows={12} filename="meta-tags.html" />
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
  const [ngram, setNgram] = React.useState("1");
  const [stop, setStop] = React.useState(true);
  const [target, setTarget] = React.useState("");
  const STOP = new Set("a an the and or but is are was were to of in on for with at by from it this that as be".split(" "));
  const tokens = (text.toLowerCase().match(/\b[\w']+\b/g) || []).filter((w) => !(stop && STOP.has(w)));
  const n = Math.max(1, parseInt(ngram, 10) || 1);
  const map = new Map<string, number>();
  for (let i = 0; i <= tokens.length - n; i++) {
    const key = tokens.slice(i, i + n).join(" ");
    map.set(key, (map.get(key) || 0) + 1);
  }
  const total = tokens.length;
  const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  const tCount = target.trim() ? (map.get(target.trim().toLowerCase()) || 0) : 0;
  const csv = ["keyword,count,density", ...top.map(([w, c]) => `${w},${c},${total ? ((c / total) * 100).toFixed(2) : 0}%`)].join("\n");
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => setText("Search engine optimization helps pages rank. SEO content needs keyword density without stuffing keywords.")}
        onClear={() => setText("")}
        onFileText={(t) => setText(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="font-sans" placeholder="Paste your content…" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="N-gram">
          <Select value={ngram} onChange={(e) => setNgram(e.target.value)}>
            <option value="1">Unigrams</option>
            <option value="2">Bigrams</option>
            <option value="3">Trigrams</option>
          </Select>
        </Field>
        <Field label="Target keyword"><Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="optional" /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> Ignore stop words</label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total words" value={total} />
        <Stat label="Unique" value={map.size} />
        <Stat label="Target count" value={tCount} />
        <Stat label="Target density" value={total ? `${((tCount / total) * 100).toFixed(1)}%` : "—"} />
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted"><tr><th className="px-4 py-2 text-left">Keyword</th><th className="px-4 py-2 text-right">Count</th><th className="px-4 py-2 text-right">Density</th></tr></thead>
          <tbody>{top.map(([w, c]) => (
            <tr key={w} className="border-t border-border"><td className="px-4 py-1.5">{w}</td><td className="px-4 py-1.5 text-right">{c}</td><td className="px-4 py-1.5 text-right">{((c / total) * 100).toFixed(1)}%</td></tr>
          ))}</tbody>
        </table>
      </div>
      {top.length > 0 && <Output value={csv} rows={6} filename="keyword-density.csv" />}
    </div>
  );
}

/* ------------------------------ Robots.txt --------------------------------- */
export function RobotsTxtGenerator() {
  const [d, setD] = React.useState({ agent: "*", disallow: "/admin\n/private", allow: "", sitemap: "https://example.com/sitemap.xml", delay: "", extra: "" });
  const out = [
    `User-agent: ${d.agent}`,
    ...d.disallow.split("\n").filter(Boolean).map((p) => `Disallow: ${p}`),
    ...d.allow.split("\n").filter(Boolean).map((p) => `Allow: ${p}`),
    d.delay && `Crawl-delay: ${d.delay}`,
    d.sitemap && `\nSitemap: ${d.sitemap}`,
    d.extra && `\n${d.extra}`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["*", "Googlebot", "Bingbot", "GPTBot"].map((a) => (
          <Button key={a} type="button" size="sm" variant={d.agent === a ? "primary" : "secondary"} onClick={() => setD({ ...d, agent: a })}>{a}</Button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="User-agent"><Input value={d.agent} onChange={(e) => setD({ ...d, agent: e.target.value })} /></Field>
        <Field label="Sitemap URL"><Input value={d.sitemap} onChange={(e) => setD({ ...d, sitemap: e.target.value })} /></Field>
        <Field label="Disallow (one per line)"><Textarea value={d.disallow} onChange={(e) => setD({ ...d, disallow: e.target.value })} rows={4} /></Field>
        <Field label="Allow (one per line)"><Textarea value={d.allow} onChange={(e) => setD({ ...d, allow: e.target.value })} rows={4} /></Field>
        <Field label="Crawl-delay (optional)"><Input type="number" value={d.delay} onChange={(e) => setD({ ...d, delay: e.target.value })} /></Field>
        <Field label="Extra rules"><Textarea value={d.extra} onChange={(e) => setD({ ...d, extra: e.target.value })} rows={3} placeholder="User-agent: GPTBot&#10;Disallow: /" /></Field>
      </div>
      <Output value={out} rows={8} filename="robots.txt" />
    </div>
  );
}

/* ------------------------------ Sitemap ------------------------------------ */
export function SitemapGenerator() {
  const [urls, setUrls] = React.useState("https://example.com/\nhttps://example.com/about");
  const [freq, setFreq] = React.useState("weekly");
  const [prio, setPrio] = React.useState("0.8");
  const [lastmod, setLastmod] = React.useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const list = urls.split("\n").map((u) => u.trim()).filter(Boolean);
  const out = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    list.map((u) => `  <url>\n    <loc>${u}</loc>\n${lastmod ? `    <lastmod>${today}</lastmod>\n` : ""}    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`).join("\n") +
    "\n</urlset>";
  return (
    <div className="space-y-4">
      <ToolBar onSample={() => setUrls("https://example.com/\nhttps://example.com/about\nhttps://example.com/blog")} onClear={() => setUrls("")} onFileText={(t) => setUrls(t)} />
      <Field label="URLs (one per line)"><Textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={6} /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Change frequency"><Select value={freq} onChange={(e) => setFreq(e.target.value)}>{["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"].map((f) => <option key={f}>{f}</option>)}</Select></Field>
        <Field label="Priority"><Select value={prio} onChange={(e) => setPrio(e.target.value)}>{["1.0", "0.8", "0.6", "0.5", "0.3"].map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={lastmod} onChange={(e) => setLastmod(e.target.checked)} /> Include lastmod ({today})</label>
      </div>
      <Notice tone="info">{list.length} URL{list.length !== 1 ? "s" : ""}</Notice>
      <Output value={out} rows={10} filename="sitemap.xml" />
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
      Product: { "@context": "https://schema.org", "@type": "Product", name: "Product name", offers: { "@type": "Offer", price: "9.99", priceCurrency: "USD", availability: "https://schema.org/InStock" } },
      Organization: { "@context": "https://schema.org", "@type": "Organization", name: "Company", url: "https://example.com", logo: "https://example.com/logo.png" },
      Person: { "@context": "https://schema.org", "@type": "Person", name: "Jane Doe", jobTitle: "Engineer", url: "https://example.com" },
      Event: { "@context": "https://schema.org", "@type": "Event", name: "Event name", startDate: "2026-06-01T09:00", location: { "@type": "Place", name: "Venue", address: "City" } },
      Recipe: { "@context": "https://schema.org", "@type": "Recipe", name: "Recipe name", recipeIngredient: ["1 cup flour"], recipeInstructions: "Mix and bake." },
      VideoObject: { "@context": "https://schema.org", "@type": "VideoObject", name: "Video title", thumbnailUrl: "https://example.com/thumb.jpg", uploadDate: "2026-01-01" },
      faq: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "Question?", acceptedAnswer: { "@type": "Answer", text: "Answer." } }] },
      breadcrumb: { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: "https://example.com" }] },
    };
    setJson(JSON.stringify(samples[type] ?? samples.Article, null, 2));
  }, [type]);
  let valid = false, err = "";
  try { if (json.trim()) { JSON.parse(json); valid = true; } } catch (e) { err = (e as Error).message; }
  return (
    <div className="space-y-4">
      {kind === "auto" && (
        <Field label="Schema type"><Select value={type} onChange={(e) => setType(e.target.value)}>
          {["Article", "Product", "Organization", "Person", "Event", "Recipe", "VideoObject"].map((t) => <option key={t}>{t}</option>)}
        </Select></Field>
      )}
      <Notice tone="info">Edit the JSON-LD, then paste it inside a &lt;script type=&quot;application/ld+json&quot;&gt; tag.</Notice>
      {json.trim() && <Notice tone={valid ? "success" : "error"}>{valid ? "Valid JSON" : err}</Notice>}
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
      <div className="flex flex-wrap gap-2">
        {[
          { source: "google", medium: "cpc", campaign: "brand" },
          { source: "newsletter", medium: "email", campaign: "weekly" },
          { source: "facebook", medium: "social", campaign: "launch" },
        ].map((p) => (
          <Button key={p.source} type="button" size="sm" variant="secondary" onClick={() => setD({ ...d, ...p })}>
            {p.source}/{p.medium}
          </Button>
        ))}
      </div>
      <Field label="Website URL"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} placeholder="https://example.com/page" /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Campaign source"><Input value={d.source} onChange={(e) => setD({ ...d, source: e.target.value })} placeholder="google" /></Field>
        <Field label="Campaign medium"><Input value={d.medium} onChange={(e) => setD({ ...d, medium: e.target.value })} placeholder="cpc" /></Field>
        <Field label="Campaign name"><Input value={d.campaign} onChange={(e) => setD({ ...d, campaign: e.target.value })} placeholder="spring_sale" /></Field>
        <Field label="Term (optional)"><Input value={d.term} onChange={(e) => setD({ ...d, term: e.target.value })} /></Field>
        <Field label="Content (optional)"><Input value={d.content} onChange={(e) => setD({ ...d, content: e.target.value })} placeholder="banner_a" /></Field>
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
export function TagPair({ make, label1 = "Field", label2 = "Field 2", placeholder1 = "", placeholder2 = "", build, hideSecond }: {
  make?: never; label1?: string; label2?: string; placeholder1?: string; placeholder2?: string;
  build: (a: string, b: string) => string;
  hideSecond?: boolean;
}) {
  void make;
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const out = a ? build(a, b) : "";
  return (
    <div className="space-y-4">
      <div className={hideSecond ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        <Field label={label1}><Input value={a} onChange={(e) => setA(e.target.value)} placeholder={placeholder1} /></Field>
        {!hideSecond && <Field label={label2}><Input value={b} onChange={(e) => setB(e.target.value)} placeholder={placeholder2} /></Field>}
      </div>
      <Output value={out} rows={3} filename="tag.html" />
    </div>
  );
}
export function CanonicalTag() {
  const [url, setUrl] = React.useState("");
  const [https, setHttps] = React.useState(true);
  const [slash, setSlash] = React.useState(false);
  let href = url.trim();
  if (href) {
    if (https) href = href.replace(/^http:\/\//i, "https://");
    if (slash && !href.endsWith("/")) href += "/";
    if (!slash && href.endsWith("/") && !/^https?:\/\/[^/]+\/$/.test(href)) href = href.slice(0, -1);
  }
  return (
    <div className="space-y-4">
      <Field label="Canonical URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" /></Field>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={https} onChange={(e) => setHttps(e.target.checked)} /> Force HTTPS</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={slash} onChange={(e) => setSlash(e.target.checked)} /> Trailing slash</label>
      </div>
      <Output value={href ? `<link rel="canonical" href="${href}">` : ""} rows={2} filename="canonical.html" />
    </div>
  );
}
export function RobotsMetaTag() {
  const [index, setIndex] = React.useState(true);
  const [follow, setFollow] = React.useState(true);
  const [archive, setArchive] = React.useState(true);
  const [snippet, setSnippet] = React.useState(true);
  const [image, setImage] = React.useState(true);
  const [maxSnippet, setMaxSnippet] = React.useState("");
  const parts = [
    index ? "index" : "noindex",
    follow ? "follow" : "nofollow",
    !archive && "noarchive",
    !snippet && "nosnippet",
    !image && "noimageindex",
    maxSnippet && `max-snippet:${maxSnippet}`,
  ].filter(Boolean);
  const v = parts.join(", ");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={index} onChange={(e) => setIndex(e.target.checked)} /> Index</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={archive} onChange={(e) => setArchive(e.target.checked)} /> Archive</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={snippet} onChange={(e) => setSnippet(e.target.checked)} /> Snippet</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={image} onChange={(e) => setImage(e.target.checked)} /> Image index</label>
      </div>
      <Field label="Max snippet (chars, optional)"><Input type="number" value={maxSnippet} onChange={(e) => setMaxSnippet(e.target.value)} placeholder="e.g. 160" /></Field>
      <Output value={`<meta name="robots" content="${v}">`} rows={2} filename="robots.html" />
    </div>
  );
}
export function HreflangTag() {
  const [rows, setRows] = React.useState([{ lang: "en", url: "https://example.com/" }, { lang: "es", url: "https://example.com/es/" }]);
  const [xDefault, setXDefault] = React.useState("https://example.com/");
  const setRow = (i: number, k: "lang" | "url", v: string) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));
  const tags = [
    ...rows.filter((r) => r.lang && r.url).map((r) => `<link rel="alternate" hreflang="${r.lang}" href="${r.url}">`),
    xDefault && `<link rel="alternate" hreflang="x-default" href="${xDefault}">`,
  ].filter(Boolean).join("\n");
  return (
    <div className="space-y-4">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
          <Field label={i === 0 ? "Language" : undefined}><Input value={r.lang} onChange={(e) => setRow(i, "lang", e.target.value)} placeholder="en-us" /></Field>
          <Field label={i === 0 ? "URL" : undefined}><Input value={r.url} onChange={(e) => setRow(i, "url", e.target.value)} placeholder="https://" /></Field>
          <Button type="button" variant="ghost" size="sm" className="self-end" disabled={rows.length < 2} onClick={() => setRows((x) => x.filter((_, j) => j !== i))}>Remove</Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => setRows((r) => [...r, { lang: "", url: "" }])}>Add locale</Button>
      <Field label="x-default URL"><Input value={xDefault} onChange={(e) => setXDefault(e.target.value)} /></Field>
      <Output value={tags} rows={Math.min(8, rows.length + 2)} filename="hreflang.html" />
    </div>
  );
}

export function HtmlTagStripper() {
  const [text, setText] = React.useState("");
  const [hist, setHist] = React.useState<string[]>([]);
  const [keepBreaks, setKeepBreaks] = React.useState(true);
  const [decode, setDecode] = React.useState(true);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  let out = text.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  if (keepBreaks) out = out.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n");
  out = out.replace(/<[^>]+>/g, "");
  if (decode && typeof document !== "undefined") {
    const ta = document.createElement("textarea");
    ta.innerHTML = out;
    out = ta.value;
  }
  out = keepBreaks ? out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() : out.replace(/\s{2,}/g, " ").trim();
  return (
    <div className="space-y-3">
      <ToolBar
        onSample={() => snapshot("<h1>Hello</h1><p>World &amp; friends<br>line 2</p>")}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
      />
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={keepBreaks} onChange={(e) => setKeepBreaks(e.target.checked)} /> Keep line breaks</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={decode} onChange={(e) => setDecode(e.target.checked)} /> Decode entities</label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="HTML"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} placeholder="Paste HTML…" /></Field>
        <Field label="Plain text"><Output value={out} rows={10} mono={false} filename="text.txt" /></Field>
      </div>
      <TextStatBar input={text} output={out} />
    </div>
  );
}

export function EmailExtractor() {
  const [text, setText] = React.useState("");
  const [hist, setHist] = React.useState<string[]>([]);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  const all = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
  const emails = [...new Set(all.map((e) => e.toLowerCase()))];
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => snapshot("Contact hello@example.com or Support@Example.com — ignore not-an-email.")}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Paste text or HTML containing emails…" />
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Matches" value={all.length} />
        <Stat label="Unique" value={emails.length} />
      </div>
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
      <FetchFromUrl onFetched={(p) => setHtml(p.html)} />
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
  const [c, setC] = React.useState("");
  const [sep, setSep] = React.useState(" ");
  const listA = a.split("\n").map((s) => s.trim()).filter(Boolean);
  const listB = b.split("\n").map((s) => s.trim()).filter(Boolean);
  const listC = c.split("\n").map((s) => s.trim()).filter(Boolean);
  const combos = listC.length
    ? listA.flatMap((x) => listB.flatMap((y) => listC.map((z) => [x, y, z].join(sep))))
    : listA.flatMap((x) => listB.map((y) => [x, y].join(sep)));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="List 1"><Textarea value={a} onChange={(e) => setA(e.target.value)} rows={5} /></Field>
        <Field label="List 2"><Textarea value={b} onChange={(e) => setB(e.target.value)} rows={5} /></Field>
        <Field label="List 3 (optional)"><Textarea value={c} onChange={(e) => setC(e.target.value)} rows={5} /></Field>
      </div>
      <Field label="Separator"><Input value={sep} onChange={(e) => setSep(e.target.value)} className="max-w-40" /></Field>
      <Notice tone="info">{combos.length} combination{combos.length !== 1 ? "s" : ""}</Notice>
      <Output value={combos.join("\n")} rows={Math.min(10, Math.max(4, combos.length))} filename="keywords.txt" mono={false} />
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
  const gunning = 0.4 * ((words / sentences) + 100 * ((text.match(/\b\w{7,}\b/g) || []).length / words));
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => setText("The cat sat on the mat. It was a sunny day. Children played in the park.")}
        onClear={() => setText("")}
        onFileText={(t) => setText(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} className="font-sans" placeholder="Paste your text…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Reading ease" value={text.trim() ? Math.max(0, Math.round(flesch)) : "—"} />
        <Stat label="Grade level" value={text.trim() ? Math.max(0, Math.round(grade)) : "—"} />
        <Stat label="Gunning fog" value={text.trim() ? gunning.toFixed(1) : "—"} />
        <Stat label="Verdict" value={text.trim() ? level : "—"} />
      </div>
    </div>
  );
}

export function MetaTagsAnalyzer() {
  const [html, setHtml] = React.useState("");
  const rows: [string, string][] = [];
  if (html.trim() && typeof window !== "undefined") {
    const meta = extractMeta(html);
    rows.push(["Title", meta.title || "— missing —"]);
    rows.push(["Description", meta.description || "— missing —"]);
    const doc = new DOMParser().parseFromString(html, "text/html");
    rows.push(["Keywords", doc.querySelector('meta[name="keywords"]')?.getAttribute("content") ?? "—"]);
    rows.push(["Canonical", meta.canonical || "—"]);
    rows.push(["Robots", meta.robots || "—"]);
    rows.push(["OG title", meta.ogTitle || "—"]);
    rows.push(["OG image", meta.ogImage || "—"]);
    rows.push(["Viewport", doc.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "— missing —"]);
    rows.push(["H1 count", String(meta.h1.length)]);
  }
  return (
    <div className="space-y-4">
      <FetchFromUrl onFetched={(p) => setHtml(p.html)} />
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
      <FetchFromUrl
        label="robots.txt URL"
        placeholder="https://example.com/robots.txt"
        cta="Fetch robots.txt"
        hint="Fetch a public robots.txt, or paste contents below"
        onFetched={(p) => setTxt(p.html)}
      />
      <Textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={8} />
      {issues.length === 0
        ? <Notice tone="success">✓ robots.txt looks valid.</Notice>
        : <div className="space-y-1">{issues.map((x, i) => <Notice key={i} tone="error">{x}</Notice>)}</div>}
    </div>
  );
}

export function HtaccessGenerator() {
  const [opt, setOpt] = React.useState("https");
  const [from, setFrom] = React.useState("/old-page");
  const [to, setTo] = React.useState("/new-page");
  const snippets: Record<string, string> = {
    https: "RewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]",
    www: "RewriteEngine On\nRewriteCond %{HTTP_HOST} !^www\\. [NC]\nRewriteRule ^(.*)$ https://www.%{HTTP_HOST}/$1 [L,R=301]",
    nowww: "RewriteEngine On\nRewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]\nRewriteRule ^(.*)$ https://%1/$1 [L,R=301]",
    cache: '<IfModule mod_expires.c>\n  ExpiresActive On\n  ExpiresByType image/jpg "access plus 1 year"\n  ExpiresByType image/jpeg "access plus 1 year"\n  ExpiresByType image/png "access plus 1 year"\n  ExpiresByType image/webp "access plus 1 year"\n  ExpiresByType text/css "access plus 1 month"\n  ExpiresByType application/javascript "access plus 1 month"\n</IfModule>',
    gzip: "<IfModule mod_deflate.c>\n  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml\n</IfModule>",
    listing: "Options -Indexes",
    custom404: "ErrorDocument 404 /404.html",
    redirect: `Redirect 301 ${from || "/old"} ${to || "/new"}`,
    rewrite: `RewriteEngine On\nRewriteRule ^${(from || "/old").replace(/^\//, "")}/?$ ${to || "/new"} [L,R=301]`,
  };
  return (
    <div className="space-y-4">
      <Field label="Rule"><Select value={opt} onChange={(e) => setOpt(e.target.value)}>
        <option value="https">Force HTTPS</option>
        <option value="www">Redirect to www</option>
        <option value="nowww">Redirect to non-www</option>
        <option value="redirect">301 Redirect (simple)</option>
        <option value="rewrite">301 RewriteRule</option>
        <option value="cache">Browser caching</option>
        <option value="gzip">Gzip compression</option>
        <option value="listing">Disable directory listing</option>
        <option value="custom404">Custom 404</option>
      </Select></Field>
      {(opt === "redirect" || opt === "rewrite") && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="From"><Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="/old-page" /></Field>
          <Field label="To"><Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="/new-page" /></Field>
        </div>
      )}
      <Output value={snippets[opt]} rows={9} filename=".htaccess" />
    </div>
  );
}
