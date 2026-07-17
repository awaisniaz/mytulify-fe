"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Notice, Stat } from "@/components/tools/shared";

/* ----------------------------- shared helpers ------------------------------ */
function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) ?? []).filter((w) => w.length > 1);
}

function parseLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function parseCsv(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
        continue;
      }
      if (ch === "," && !q) {
        cells.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

const STOP = new Set(
  "a an the and or but if in on at to for of with from by as is are was were be been being it this that these those you your we our they their i me my".split(
    " ",
  ),
);

/* ===================== Keyword research ===================== */
const MODIFIERS = {
  questions: ["how to", "what is", "why", "when", "where", "which", "can you", "best way to"],
  commercial: ["best", "top", "vs", "review", "alternative", "pricing", "cost", "buy", "cheap"],
  informational: ["guide", "tutorial", "examples", "tips", "checklist", "template", "meaning"],
  local: ["near me", "in", "for", "online"],
  longTail: ["for beginners", "step by step", "in 2026", "without", "with examples", "free"],
};

export function RelatedKeywordsGenerator() {
  const [seed, setSeed] = React.useState("");
  const [secondary, setSecondary] = React.useState("");
  const seeds = parseLines(seed);
  const extras = parseLines(secondary);

  const groups = React.useMemo(() => {
    if (!seeds.length) return null;
    const out: Record<string, string[]> = {
      Questions: [],
      Commercial: [],
      Informational: [],
      "Long-tail": [],
      Combinations: [],
    };
    for (const s of seeds) {
      for (const m of MODIFIERS.questions) out.Questions.push(`${m} ${s}`);
      for (const m of MODIFIERS.commercial) out.Commercial.push(`${m} ${s}`);
      for (const m of MODIFIERS.informational) out.Informational.push(`${s} ${m}`);
      for (const m of MODIFIERS.longTail) out["Long-tail"].push(`${s} ${m}`);
      for (const e of extras) {
        out.Combinations.push(`${s} ${e}`);
        out.Combinations.push(`${e} ${s}`);
      }
    }
    for (const k of Object.keys(out)) out[k] = [...new Set(out[k])].slice(0, 40);
    return out;
  }, [seeds, extras]);

  const flat = groups ? Object.values(groups).flat().join("\n") : "";

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Build a comprehensive keyword universe from seed terms — questions, commercial modifiers, long-tail, and
        combinations. Export and paste into your rank tracker or content calendar.
      </Notice>
      <Field label="Seed keywords" hint="One per line">
        <Textarea
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          rows={4}
          className="font-sans"
          placeholder={"meta description length\nxml sitemap\nlocal seo"}
        />
      </Field>
      <Field label="Secondary modifiers (optional)" hint="Industries, audiences, products — one per line">
        <Textarea
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          rows={3}
          className="font-sans"
          placeholder={"for saas\nfor agencies\nwordpress"}
        />
      </Field>
      {groups && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(groups).map(([title, list]) => (
              <div key={title} className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">
                  {title} ({list.length})
                </p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                  {list.map((k) => (
                    <li key={k}>{k}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Output value={flat} rows={8} filename="related-keywords.txt" />
        </>
      )}
    </div>
  );
}

export function KeywordDifficultyEstimator() {
  const [keyword, setKeyword] = React.useState("");
  const [serpNotes, setSerpNotes] = React.useState("");
  const [hasBrand, setHasBrand] = React.useState(false);
  const [hasGovEdu, setHasGovEdu] = React.useState(false);
  const [avgWords, setAvgWords] = React.useState("1200");
  const [drGuess, setDrGuess] = React.useState("40");

  const result = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return null;
    const words = kw.split(/\s+/).length;
    let score = 35;
    // shorter = harder usually
    if (words === 1) score += 28;
    else if (words === 2) score += 18;
    else if (words === 3) score += 8;
    else score -= 6;
    if (hasBrand) score += 12;
    if (hasGovEdu) score += 15;
    const dr = Number(drGuess) || 0;
    score += Math.min(25, dr / 4);
    const len = Number(avgWords) || 0;
    if (len > 2500) score += 8;
    else if (len < 600) score -= 5;
    const notes = serpNotes.toLowerCase();
    if (/amazon|wikipedia|youtube|reddit|forbes|hubspot|moz|ahrefs|semrush/.test(notes)) score += 10;
    if (/forum|quora|pinterest/.test(notes)) score -= 4;
    score = Math.max(1, Math.min(100, Math.round(score)));
    const band = score >= 70 ? "Hard" : score >= 45 ? "Medium" : "Easy / opportunistic";
    const advice =
      score >= 70
        ? "Target long-tail variants first, build topical authority, and aim for supporting content before the head term."
        : score >= 45
          ? "Compete with a differentiated angle, strong on-page SEO, and a few quality referring domains."
          : "Good candidate for a focused page or supporting blog post — ship content quickly and internal-link to it.";
    return { score, band, advice, words };
  }, [keyword, serpNotes, hasBrand, hasGovEdu, avgWords, drGuess]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Heuristic difficulty score (not a live Ahrefs/Moz metric). Use SERP observations — brand SERPs, .gov/.edu,
        and average content length — to estimate competitiveness.
      </Notice>
      <Field label="Keyword">
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="best project management software" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Avg top-10 word count (estimate)">
          <Input type="number" value={avgWords} onChange={(e) => setAvgWords(e.target.value)} />
        </Field>
        <Field label="Typical referring domain strength (0–100)">
          <Input type="number" min={0} max={100} value={drGuess} onChange={(e) => setDrGuess(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hasBrand} onChange={(e) => setHasBrand(e.target.checked)} />
        Top results are mostly big brands
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hasGovEdu} onChange={(e) => setHasGovEdu(e.target.checked)} />
        .gov / .edu or major publishers dominate
      </label>
      <Field label="SERP notes (optional)" hint="Domains you see in the top 10">
        <Textarea
          value={serpNotes}
          onChange={(e) => setSerpNotes(e.target.value)}
          rows={3}
          className="font-sans"
          placeholder="wikipedia, forbes, hubspot, niche blogs…"
        />
      </Field>
      {result && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Difficulty (0–100)" value={result.score} />
          <Stat label="Band" value={result.band} />
          <Stat label="Word count in KW" value={result.words} />
          <p className="sm:col-span-3 rounded-xl border border-border bg-surface-2/50 p-3 text-sm text-muted">
            {result.advice}
          </p>
        </div>
      )}
    </div>
  );
}

export function SearchIntentClassifier() {
  const [raw, setRaw] = React.useState("");
  const rows = React.useMemo(() => {
    return parseLines(raw).map((kw) => {
      const k = kw.toLowerCase();
      let intent = "Informational";
      let signals: string[] = [];
      if (/^(buy|order|purchase|pricing|price|cost|cheap|deal|coupon|discount)/.test(k) || /\b(buy|pricing|near me)\b/.test(k)) {
        intent = "Transactional";
        signals.push("purchase language");
      } else if (/\b(best|top|vs|versus|review|alternative|compare|comparison)\b/.test(k)) {
        intent = "Commercial investigation";
        signals.push("comparison / review modifiers");
      } else if (/^(login|sign in|download|official|homepage)\b/.test(k) || /\b(login|sign in)\b/.test(k)) {
        intent = "Navigational";
        signals.push("brand/destination intent");
      } else if (/^(how|what|why|when|where|who|which|guide|tutorial|examples|meaning)\b/.test(k) || /\?$/.test(k)) {
        intent = "Informational";
        signals.push("question / how-to pattern");
      } else {
        signals.push("default informational");
      }
      const pageType =
        intent === "Transactional"
          ? "Product / pricing / landing page"
          : intent === "Commercial investigation"
            ? "Comparison, listicle, or review hub"
            : intent === "Navigational"
              ? "Homepage or product login page"
              : "Blog post, guide, or FAQ";
      return { kw, intent, signals: signals.join(", "), pageType };
    });
  }, [raw]);

  const csv =
    "keyword,intent,signals,suggested_page_type\n" +
    rows.map((r) => `"${r.kw}","${r.intent}","${r.signals}","${r.pageType}"`).join("\n");

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Classify search intent for a keyword list so content briefs match what Google (and users) expect —
        informational, commercial, transactional, or navigational.
      </Notice>
      <Field label="Keywords" hint="One per line">
        <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={8} className="font-sans" placeholder={"how to write meta descriptions\nbest crm for startups\nbuy airpods pro\nfacebook login"} />
      </Field>
      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Keyword</th>
                  <th className="px-3 py-2 text-left">Intent</th>
                  <th className="px-3 py-2 text-left">Page type</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.kw} className="border-t border-border">
                    <td className="px-3 py-1.5">{r.kw}</td>
                    <td className="px-3 py-1.5 font-medium">{r.intent}</td>
                    <td className="px-3 py-1.5 text-muted">{r.pageType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Output value={csv} rows={6} filename="search-intent.csv" mime="text/csv" />
        </>
      )}
    </div>
  );
}

/* ===================== Technical SEO ===================== */
export function XmlSitemapValidator() {
  const [xml, setXml] = React.useState("");
  const report = React.useMemo(() => {
    if (!xml.trim()) return null;
    const issues: string[] = [];
    const urls: string[] = [];
    try {
      const doc = new DOMParser().parseFromString(xml, "application/xml");
      if (doc.querySelector("parsererror")) issues.push("XML parse error — file is not well-formed.");
      const urlset = doc.querySelector("urlset");
      const sitemapindex = doc.querySelector("sitemapindex");
      if (!urlset && !sitemapindex) issues.push("Missing <urlset> or <sitemapindex> root element.");
      doc.querySelectorAll("url > loc, sitemap > loc").forEach((n) => {
        const u = n.textContent?.trim() ?? "";
        if (u) urls.push(u);
      });
      if (!urls.length) issues.push("No <loc> URLs found.");
      const bad = urls.filter((u) => !/^https?:\/\//i.test(u));
      if (bad.length) issues.push(`${bad.length} URL(s) missing http/https scheme.`);
      const dupes = urls.length - new Set(urls).size;
      if (dupes > 0) issues.push(`${dupes} duplicate <loc> values.`);
      if (urls.length > 50000) issues.push("More than 50,000 URLs — split into a sitemap index.");
      doc.querySelectorAll("lastmod").forEach((n) => {
        const v = n.textContent?.trim() ?? "";
        if (v && Number.isNaN(Date.parse(v))) issues.push(`Invalid lastmod date: ${v}`);
      });
      if (!issues.length) issues.push("No critical issues detected.");
      return { urls: urls.length, issues, sample: urls.slice(0, 15) };
    } catch {
      return { urls: 0, issues: ["Could not parse XML."], sample: [] as string[] };
    }
  }, [xml]);

  return (
    <div className="space-y-4">
      <Notice tone="info">Validate sitemap XML structure, loc schemes, duplicates, lastmod dates, and the 50k URL limit.</Notice>
      <Field label="Paste sitemap XML">
        <Textarea value={xml} onChange={(e) => setXml(e.target.value)} rows={10} className="font-mono text-xs" placeholder="<?xml version=&quot;1.0&quot;?>…" />
      </Field>
      {report && (
        <>
          <Stat label="URLs found" value={report.urls} />
          <ul className="list-inside list-disc space-y-1 text-sm text-muted">
            {report.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          {report.sample.length > 0 && <Output value={report.sample.join("\n")} rows={6} filename="sitemap-urls.txt" />}
        </>
      )}
    </div>
  );
}

export function HeadingStructureAnalyzer() {
  const [html, setHtml] = React.useState("");
  const analysis = React.useMemo(() => {
    if (!html.trim()) return null;
    const doc = new DOMParser().parseFromString(html, "text/html");
    const headings = [...doc.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((el) => ({
      tag: el.tagName.toLowerCase(),
      level: Number(el.tagName.slice(1)),
      text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
    }));
    const issues: string[] = [];
    const h1s = headings.filter((h) => h.level === 1);
    if (h1s.length === 0) issues.push("No H1 found — add one primary H1.");
    if (h1s.length > 1) issues.push(`${h1s.length} H1 tags — prefer a single H1 per page.`);
    let prev = 0;
    for (const h of headings) {
      if (prev && h.level > prev + 1) {
        issues.push(`Skipped heading level: ${h.tag} after H${prev} (“${h.text.slice(0, 40)}…”)`);
        break;
      }
      prev = h.level;
    }
    if (!issues.length) issues.push("Heading outline looks structurally healthy.");
    return { headings, issues, counts: [1, 2, 3, 4, 5, 6].map((l) => headings.filter((h) => h.level === l).length) };
  }, [html]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Paste page HTML to audit H1–H6 outline — multiple H1s, skipped levels, and thin heading text for content SEO.
      </Notice>
      <Field label="HTML">
        <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} className="font-mono text-xs" placeholder="<html>…" />
      </Field>
      {analysis && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {analysis.counts.map((c, i) => (
              <Stat key={i} label={`H${i + 1}`} value={c} />
            ))}
          </div>
          <ul className="list-inside list-disc text-sm text-muted">
            {analysis.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <tbody>
                {analysis.headings.map((h, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="w-14 px-3 py-1.5 font-mono text-xs text-brand">{h.tag}</td>
                    <td className="px-3 py-1.5" style={{ paddingLeft: 8 + (h.level - 1) * 12 }}>
                      {h.text || "(empty)"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const AUDIT_SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Crawl & indexation",
    items: [
      "robots.txt allows important sections and blocks only private paths",
      "XML sitemap submitted and only includes canonical, indexable URLs",
      "No accidental noindex on money pages",
      "Canonical tags point to preferred URLs",
      "Pagination / faceted URLs handled (canonical or noindex)",
    ],
  },
  {
    title: "On-page SEO",
    items: [
      "Unique title tag (~50–60 characters) with primary keyword near the front",
      "Unique meta description (~150–160 characters) with a clear CTA",
      "Single H1 matching search intent",
      "Logical H2/H3 outline covering subtopics",
      "Primary keyword in first 100 words and in at least one H2",
      "Image alt text descriptive (not stuffed)",
      "Internal links to related money / pillar pages",
    ],
  },
  {
    title: "Technical",
    items: [
      "HTTPS everywhere; no mixed content",
      "Mobile-friendly / responsive layout",
      "Core Web Vitals in acceptable range (LCP, INP, CLS)",
      "Clean URL structure (readable slugs)",
      "404s return proper status; soft-404s avoided",
      "hreflang correct if multilingual",
      "Structured data validates (FAQ, Product, HowTo, LocalBusiness as relevant)",
    ],
  },
  {
    title: "Content & E-E-A-T",
    items: [
      "Content matches search intent (not just keyword)",
      "Clear author / about / contact signals where YMYL",
      "Outdated stats and screenshots refreshed",
      "Thin or duplicate pages consolidated or improved",
      "llms.txt / AI-crawler policy considered for GEO",
    ],
  },
  {
    title: "Links",
    items: [
      "No critical orphan pages in the sitemap",
      "Anchor text descriptive (not “click here” only)",
      "Toxic / spammy backlinks reviewed; disavow if needed",
      "External links to authoritative sources where helpful",
    ],
  },
];

export function SeoAuditChecklist() {
  const storageKey = "mytulify-seo-audit-v1";
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setChecked(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const total = AUDIT_SECTIONS.reduce((n, s) => n + s.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  const report = AUDIT_SECTIONS.map((sec) => {
    const lines = sec.items.map((item, i) => {
      const id = `${sec.title}:${i}`;
      return `${checked[id] ? "[x]" : "[ ]"} ${item}`;
    });
    return `## ${sec.title}\n${lines.join("\n")}`;
  }).join("\n\n");

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Comprehensive SEO audit checklist covering crawlability, on-page, technical, E-E-A-T, and links. Progress is
        saved in this browser.
      </Notice>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Checks complete" value={`${done} / ${total}`} />
        <Stat label="Progress" value={`${total ? Math.round((done / total) * 100) : 0}%`} />
      </div>
      {AUDIT_SECTIONS.map((sec) => (
        <div key={sec.title} className="rounded-xl border border-border p-4">
          <p className="text-sm font-bold">{sec.title}</p>
          <ul className="mt-3 space-y-2">
            {sec.items.map((item, i) => {
              const id = `${sec.title}:${i}`;
              return (
                <li key={id}>
                  <label className="flex cursor-pointer gap-2 text-sm">
                    <input type="checkbox" checked={!!checked[id]} onChange={() => toggle(id)} className="mt-0.5" />
                    <span>{item}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <Output value={`# SEO audit checklist\n\n${report}`} rows={12} filename="seo-audit-checklist.md" />
    </div>
  );
}

/* ===================== Content optimization ===================== */
export function SeoContentScore() {
  const [keyword, setKeyword] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody] = React.useState("");

  const result = React.useMemo(() => {
    if (!body.trim() && !title.trim()) return null;
    const kw = keyword.trim().toLowerCase();
    const checks: { label: string; pass: boolean; detail: string; weight: number }[] = [];
    const words = tokenize(body);
    const wordCount = words.length;
    const text = body.toLowerCase();
    const titleL = title.toLowerCase();
    const descL = description.toLowerCase();

    checks.push({
      label: "Content length",
      pass: wordCount >= 300,
      detail: `${wordCount} words (aim 300+ for supporting pages, 900+ for guides)`,
      weight: 15,
    });
    if (kw) {
      const inTitle = titleL.includes(kw);
      const inDesc = descL.includes(kw);
      const inFirst = text.slice(0, 400).includes(kw);
      const density = wordCount ? (text.split(kw).length - 1) / Math.max(1, wordCount / kw.split(/\s+/).length) : 0;
      // simpler density: occurrences / words
      const occ = (text.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length;
      const dens = wordCount ? (occ / wordCount) * 100 : 0;
      checks.push({ label: "Keyword in title", pass: inTitle, detail: inTitle ? "Found" : "Missing", weight: 18 });
      checks.push({ label: "Keyword in meta description", pass: inDesc, detail: inDesc ? "Found" : "Missing", weight: 10 });
      checks.push({ label: "Keyword early in body", pass: inFirst, detail: inFirst ? "In first ~100 words" : "Not near the top", weight: 12 });
      checks.push({
        label: "Keyword density",
        pass: dens >= 0.5 && dens <= 2.5,
        detail: `${dens.toFixed(2)}% (sweet spot ~0.5–2.5%)`,
        weight: 12,
      });
    }
    checks.push({
      label: "Title length",
      pass: title.length >= 30 && title.length <= 60,
      detail: `${title.length} chars`,
      weight: 10,
    });
    checks.push({
      label: "Meta description length",
      pass: description.length >= 120 && description.length <= 160,
      detail: `${description.length} chars`,
      weight: 10,
    });
    const sentences = body.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const avgSentence = sentences.length ? wordCount / sentences.length : 0;
    checks.push({
      label: "Readable sentences",
      pass: avgSentence > 0 && avgSentence <= 22,
      detail: avgSentence ? `~${avgSentence.toFixed(1)} words/sentence` : "n/a",
      weight: 8,
    });
    const hasLists = /<li>|^[-*]\s/m.test(body);
    checks.push({ label: "Scannable structure", pass: hasLists || /#{2,3}\s|^## /m.test(body), detail: hasLists ? "Lists detected" : "Add H2s or bullets", weight: 5 });

    const earned = checks.reduce((s, c) => s + (c.pass ? c.weight : 0), 0);
    const max = checks.reduce((s, c) => s + c.weight, 0);
    const score = max ? Math.round((earned / max) * 100) : 0;
    return { checks, score, wordCount };
  }, [keyword, title, description, body]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        On-page SEO content score from title, meta description, body, and focus keyword — density, placement, length,
        and scannability.
      </Notice>
      <Field label="Focus keyword">
        <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="xml sitemap generator" />
      </Field>
      <Field label="Title tag">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Meta description">
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="font-sans" />
      </Field>
      <Field label="Page body (text or markdown/HTML)">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="font-sans" />
      </Field>
      {result && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="SEO content score" value={`${result.score}/100`} />
            <Stat label="Words" value={result.wordCount} />
          </div>
          <ul className="space-y-2 text-sm">
            {result.checks.map((c) => (
              <li key={c.label} className="flex gap-2 rounded-lg border border-border px-3 py-2">
                <span className={c.pass ? "text-emerald-600" : "text-amber-600"}>{c.pass ? "✓" : "!"}</span>
                <span>
                  <strong>{c.label}</strong> — {c.detail}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ===================== Rank tracking ===================== */
type RankRow = { id: string; keyword: string; url: string; rank: string; date: string; notes: string };

export function KeywordRankTracker() {
  const key = "mytulify-rank-tracker-v1";
  const [rows, setRows] = React.useState<RankRow[]>([]);
  const [form, setForm] = React.useState({ keyword: "", url: "", rank: "", notes: "" });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setRows(JSON.parse(raw) as RankRow[]);
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: RankRow[]) => {
    setRows(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  const add = () => {
    if (!form.keyword.trim()) return;
    const row: RankRow = {
      id: `${Date.now()}`,
      keyword: form.keyword.trim(),
      url: form.url.trim(),
      rank: form.rank.trim() || "—",
      date: new Date().toISOString().slice(0, 10),
      notes: form.notes.trim(),
    };
    persist([row, ...rows]);
    setForm({ keyword: "", url: "", rank: "", notes: "" });
  };

  const csv =
    "date,keyword,url,rank,notes\n" +
    rows
      .map((r) => `"${r.date}","${r.keyword}","${r.url}","${r.rank}","${r.notes.replace(/"/g, '""')}"`)
      .join("\n");

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Manual rank tracker stored in your browser — log keyword positions over time (from GSC, Ahrefs, or SERP
        checks) and export CSV for reporting. No third-party API required.
      </Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Keyword">
          <Input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} />
        </Field>
        <Field label="Rank (position)">
          <Input value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} placeholder="7" />
        </Field>
        <Field label="Target URL">
          <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://" />
        </Field>
        <Field label="Notes">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Mobile US / featured snippet" />
        </Field>
      </div>
      <Button type="button" onClick={add}>
        Add snapshot
      </Button>
      <Stat label="Logged snapshots" value={rows.length} />
      {rows.length > 0 && (
        <>
          <div className="max-h-72 overflow-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface-2 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Keyword</th>
                  <th className="px-3 py-2 text-left">Rank</th>
                  <th className="px-3 py-2 text-left">URL</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-1.5 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-1.5">{r.keyword}</td>
                    <td className="px-3 py-1.5 font-semibold">{r.rank}</td>
                    <td className="max-w-[180px] truncate px-3 py-1.5 text-muted">{r.url}</td>
                    <td className="px-3 py-1.5">
                      <button
                        type="button"
                        className="text-xs text-red-600 underline"
                        onClick={() => persist(rows.filter((x) => x.id !== r.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Output value={csv} rows={6} filename="rank-tracker.csv" mime="text/csv" />
        </>
      )}
    </div>
  );
}

/* ===================== Backlinks ===================== */
export function BacklinkProfileAnalyzer() {
  const [csv, setCsv] = React.useState("");
  const analysis = React.useMemo(() => {
    if (!csv.trim()) return null;
    const table = parseCsv(csv);
    if (table.length < 2) return { error: "Need a header row + data (export from Ahrefs, Semrush, or Moz)." };
    const header = table[0]!.map((h) => h.toLowerCase());
    const find = (...names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)));
    const iUrl = find("referring page", "source url", "from url", "url");
    const iAnchor = find("anchor", "anchor text");
    const iType = find("type", "link type", "dofollow", "nofollow");
    const iDr = find("domain rating", "dr", "authority", "as");
    if (iUrl < 0 && iAnchor < 0) return { error: "Could not detect URL or anchor columns." };

    const anchors = new Map<string, number>();
    const hosts = new Map<string, number>();
    let follow = 0;
    let nofollow = 0;
    let drSum = 0;
    let drN = 0;
    const rows = table.slice(1);
    for (const row of rows) {
      const anchor = (iAnchor >= 0 ? row[iAnchor] : "") || "(empty)";
      anchors.set(anchor, (anchors.get(anchor) || 0) + 1);
      const url = iUrl >= 0 ? row[iUrl] || "" : "";
      try {
        if (url) {
          const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
          hosts.set(host, (hosts.get(host) || 0) + 1);
        }
      } catch {
        /* ignore */
      }
      const typ = (iType >= 0 ? row[iType] : "").toLowerCase();
      if (/nofollow|ugc|sponsored/.test(typ)) nofollow++;
      else if (typ) follow++;
      if (iDr >= 0) {
        const n = parseFloat(row[iDr] || "");
        if (Number.isFinite(n)) {
          drSum += n;
          drN++;
        }
      }
    }
    const topAnchors = [...anchors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    const topHosts = [...hosts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
    const branded = topAnchors.filter(([a]) => a.length < 3 || /^https?:\/\//i.test(a) || a === "(empty)").length;
    return {
      error: null as string | null,
      total: rows.length,
      uniqueHosts: hosts.size,
      follow,
      nofollow,
      avgDr: drN ? (drSum / drN).toFixed(1) : "—",
      topAnchors,
      topHosts,
      tip:
        branded > topAnchors.length * 0.5
          ? "Many empty/URL anchors — diversify with branded and topical anchors on future links."
          : "Anchor mix looks varied — keep monitoring exact-match over-optimization.",
    };
  }, [csv]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Paste a backlink export CSV (Ahrefs / Semrush / Moz). We summarize referring domains, follow mix, average
        authority, and top anchor texts — no API key needed.
      </Notice>
      <Field label="Backlink CSV">
        <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} className="font-mono text-xs" placeholder="Referring page,Anchor text,Domain Rating,…" />
      </Field>
      {analysis?.error && <Notice tone="error">{analysis.error}</Notice>}
      {analysis && !analysis.error && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Links" value={analysis.total} />
            <Stat label="Referring hosts" value={analysis.uniqueHosts} />
            <Stat label="Follow / Nofollow" value={`${analysis.follow} / ${analysis.nofollow}`} />
            <Stat label="Avg DR/AS" value={analysis.avgDr} />
          </div>
          <p className="text-sm text-muted">{analysis.tip}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs font-bold uppercase text-muted">Top anchors</p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                {(analysis.topAnchors ?? []).map(([a, n]) => (
                  <li key={a} className="flex justify-between gap-2">
                    <span className="truncate">{a}</span>
                    <span className="text-muted">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs font-bold uppercase text-muted">Top referring hosts</p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                {(analysis.topHosts ?? []).map(([h, n]) => (
                  <li key={h} className="flex justify-between gap-2">
                    <span className="truncate">{h}</span>
                    <span className="text-muted">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function DisavowFileGenerator() {
  const [domains, setDomains] = React.useState("");
  const [urls, setUrls] = React.useState("");
  const out = [
    "# Disavow file generated with Mytulify",
    "# Only disavow links you are confident are harmful or the result of a penalty risk.",
    "",
    ...parseLines(domains).map((d) => `domain:${d.replace(/^domain:/i, "").replace(/^https?:\/\//, "").replace(/\/$/, "")}`),
    ...parseLines(urls).map((u) => u.trim()),
  ].join("\n");

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Build a Google Search Console disavow file. Prefer domain: entries for spam networks; use full URLs only for
        specific bad pages.
      </Notice>
      <Field label="Spam domains" hint="One per line (example.com)">
        <Textarea value={domains} onChange={(e) => setDomains(e.target.value)} rows={6} className="font-mono text-sm" />
      </Field>
      <Field label="Specific spam URLs (optional)">
        <Textarea value={urls} onChange={(e) => setUrls(e.target.value)} rows={4} className="font-mono text-sm" />
      </Field>
      <Output value={out} rows={10} filename="disavow.txt" />
    </div>
  );
}

/* ===================== Internal linking ===================== */
export function InternalLinkSuggester() {
  const [pages, setPages] = React.useState("");
  const [article, setArticle] = React.useState("");
  const suggestions = React.useMemo(() => {
    const list = parseLines(pages)
      .map((line) => {
        const [url, ...rest] = line.split(/[|\t]/);
        const title = rest.join(" ").trim() || url || "";
        return { url: (url || "").trim(), title };
      })
      .filter((p) => p.url);
    if (!list.length || !article.trim()) return [];
    const tokens = tokenize(article).filter((w) => !STOP.has(w) && w.length > 3);
    const freq = new Map<string, number>();
    for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
    return list
      .map((p) => {
        const hay = tokenize(`${p.title} ${p.url}`).filter((w) => !STOP.has(w));
        let score = 0;
        const hits: string[] = [];
        for (const w of hay) {
          if (freq.has(w)) {
            score += freq.get(w)!;
            hits.push(w);
          }
        }
        return { ...p, score, hits: [...new Set(hits)].slice(0, 6) };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 25);
  }, [pages, article]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Suggest internal links from your site map into a draft article using keyword overlap (TF-style). Format pages as{" "}
        <code className="text-xs">url | title</code> per line.
      </Notice>
      <Field label="Site pages" hint="url | title — one per line">
        <Textarea
          value={pages}
          onChange={(e) => setPages(e.target.value)}
          rows={7}
          className="font-mono text-xs"
          placeholder={"https://example.com/seo-guide | Complete SEO guide\nhttps://example.com/sitemap-tool | XML Sitemap Generator"}
        />
      </Field>
      <Field label="Article draft">
        <Textarea value={article} onChange={(e) => setArticle(e.target.value)} rows={8} className="font-sans" placeholder="Paste the article you want to interlink…" />
      </Field>
      {suggestions.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Suggested link</th>
                <th className="px-3 py-2 text-left">Overlap</th>
                <th className="px-3 py-2 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => (
                <tr key={s.url} className="border-t border-border">
                  <td className="px-3 py-2">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-muted">{s.url}</div>
                  </td>
                  <td className="px-3 py-2 text-muted">{s.hits.join(", ")}</td>
                  <td className="px-3 py-2 text-right">{s.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function OrphanPageFinder() {
  const [sitemap, setSitemap] = React.useState("");
  const [linked, setLinked] = React.useState("");

  const result = React.useMemo(() => {
    const normalize = (u: string) => {
      try {
        const url = new URL(u.startsWith("http") ? u : `https://${u}`);
        return (url.origin + url.pathname).replace(/\/$/, "").toLowerCase();
      } catch {
        return u.replace(/\/$/, "").toLowerCase();
      }
    };
    const fromSitemap = new Set(
      [...sitemap.matchAll(/https?:\/\/[^\s<>"']+/gi)].map((m) => normalize(m[0]!)),
    );
    // also accept plain URL lists
    for (const line of parseLines(sitemap)) {
      if (/^https?:\/\//i.test(line)) fromSitemap.add(normalize(line));
    }
    const fromLinks = new Set<string>();
    for (const m of linked.matchAll(/https?:\/\/[^\s<>"']+/gi)) fromLinks.add(normalize(m[0]!));
    for (const line of parseLines(linked)) {
      if (/^https?:\/\//i.test(line) || line.includes("/")) fromLinks.add(normalize(line));
    }
    if (!fromSitemap.size) return null;
    const orphans = [...fromSitemap].filter((u) => !fromLinks.has(u)).sort();
    const linkedOnly = [...fromLinks].filter((u) => !fromSitemap.has(u)).sort();
    return {
      sitemapCount: fromSitemap.size,
      linkedCount: fromLinks.size,
      orphans,
      linkedOnly: linkedOnly.slice(0, 50),
    };
  }, [sitemap, linked]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Find orphan URLs: pages in your sitemap that never appear in your internal link crawl (or nav export). Also
        surfaces linked URLs missing from the sitemap.
      </Notice>
      <Field label="Sitemap XML or URL list">
        <Textarea value={sitemap} onChange={(e) => setSitemap(e.target.value)} rows={7} className="font-mono text-xs" />
      </Field>
      <Field label="Internal links found" hint="Paste HTML, a crawl export, or URL list from Screaming Frog">
        <Textarea value={linked} onChange={(e) => setLinked(e.target.value)} rows={7} className="font-mono text-xs" />
      </Field>
      {result && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Sitemap URLs" value={result.sitemapCount} />
            <Stat label="Linked URLs" value={result.linkedCount} />
            <Stat label="Orphans" value={result.orphans.length} />
          </div>
          <Output value={result.orphans.join("\n") || "(none)"} rows={8} filename="orphan-pages.txt" />
          {result.linkedOnly.length > 0 && (
            <Field label="Linked but not in sitemap (sample)">
              <Output value={result.linkedOnly.join("\n")} rows={5} filename="linked-not-in-sitemap.txt" />
            </Field>
          )}
        </>
      )}
    </div>
  );
}

/* ===================== Schema / niche ===================== */
export function SchemaMarkupValidator() {
  const [json, setJson] = React.useState("");
  const report = React.useMemo(() => {
    if (!json.trim()) return null;
    const issues: string[] = [];
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch (e) {
      return { ok: false, issues: [`Invalid JSON: ${(e as Error).message}`], types: [] as string[] };
    }
    const nodes = Array.isArray(data) ? data : [data];
    const types: string[] = [];
    for (const node of nodes) {
      if (!node || typeof node !== "object") {
        issues.push("Array item is not an object.");
        continue;
      }
      const o = node as Record<string, unknown>;
      if (!o["@context"] && !o["@type"]) issues.push("Missing @context and @type on a node.");
      if (!o["@type"]) issues.push("Missing @type.");
      else types.push(String(o["@type"]));
      if (o["@type"] === "FAQPage") {
        const main = o.mainEntity;
        if (!Array.isArray(main) || !main.length) issues.push("FAQPage needs mainEntity Q&A array.");
      }
      if (o["@type"] === "HowTo" && !Array.isArray(o.step)) issues.push("HowTo should include step[].");
      if (o["@type"] === "Product" && !o.name) issues.push("Product missing name.");
      if (o["@type"] === "LocalBusiness" && !o.address && !o.name) issues.push("LocalBusiness needs name/address.");
    }
    if (!issues.length) issues.push("JSON parses cleanly. Also test in Google Rich Results Test when live.");
    return { ok: issues[0]?.startsWith("JSON parses") ?? false, issues, types };
  }, [json]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Validate JSON-LD structure before publishing — FAQPage, HowTo, Product, LocalBusiness common pitfalls included.
      </Notice>
      <Field label="JSON-LD">
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} className="font-mono text-xs" />
      </Field>
      {report && (
        <>
          {report.types.length > 0 && <Stat label="@type found" value={report.types.join(", ")} />}
          <ul className="list-inside list-disc text-sm text-muted">
            {report.issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function HowToSchemaGenerator() {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [steps, setSteps] = React.useState("Step one\nStep two\nStep three");
  const json = React.useMemo(() => {
    const stepList = parseLines(steps).map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text,
    }));
    return JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: name || "How to…",
        description: desc || undefined,
        step: stepList,
      },
      null,
      2,
    );
  }, [name, desc, steps]);

  return (
    <div className="space-y-4">
      <Field label="HowTo name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="How to submit an XML sitemap" /></Field>
      <Field label="Description"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="font-sans" /></Field>
      <Field label="Steps" hint="One step per line"><Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={6} className="font-sans" /></Field>
      <Output value={json} rows={14} filename="howto-schema.json" mime="application/json" />
      <div className="flex gap-2"><CopyButton value={`<script type="application/ld+json">\n${json}\n</script>`} label="Copy with script tag" /></div>
    </div>
  );
}

export function LocalBusinessSchemaGenerator() {
  const [d, setD] = React.useState({
    name: "",
    type: "LocalBusiness",
    phone: "",
    street: "",
    city: "",
    region: "",
    postal: "",
    country: "US",
    url: "",
    lat: "",
    lng: "",
  });
  const json = JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": d.type,
      name: d.name,
      url: d.url || undefined,
      telephone: d.phone || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: d.street,
        addressLocality: d.city,
        addressRegion: d.region,
        postalCode: d.postal,
        addressCountry: d.country,
      },
      geo:
        d.lat && d.lng
          ? { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng }
          : undefined,
    },
    null,
    2,
  );

  return (
    <div className="space-y-4">
      <Notice tone="info">Generate LocalBusiness JSON-LD for Google Business / local pack eligibility signals.</Notice>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Business name"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
        <Field label="@type">
          <Select value={d.type} onChange={(e) => setD({ ...d, type: e.target.value })}>
            <option>LocalBusiness</option>
            <option>Restaurant</option>
            <option>ProfessionalService</option>
            <option>Store</option>
            <option>MedicalBusiness</option>
          </Select>
        </Field>
        <Field label="Phone"><Input value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} /></Field>
        <Field label="Website"><Input value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} /></Field>
        <Field label="Street"><Input value={d.street} onChange={(e) => setD({ ...d, street: e.target.value })} /></Field>
        <Field label="City"><Input value={d.city} onChange={(e) => setD({ ...d, city: e.target.value })} /></Field>
        <Field label="Region/State"><Input value={d.region} onChange={(e) => setD({ ...d, region: e.target.value })} /></Field>
        <Field label="Postal code"><Input value={d.postal} onChange={(e) => setD({ ...d, postal: e.target.value })} /></Field>
        <Field label="Country"><Input value={d.country} onChange={(e) => setD({ ...d, country: e.target.value })} /></Field>
        <Field label="Latitude"><Input value={d.lat} onChange={(e) => setD({ ...d, lat: e.target.value })} /></Field>
        <Field label="Longitude"><Input value={d.lng} onChange={(e) => setD({ ...d, lng: e.target.value })} /></Field>
      </div>
      <Output value={json} rows={16} filename="local-business-schema.json" mime="application/json" />
    </div>
  );
}

export function NapConsistencyChecker() {
  const [entries, setEntries] = React.useState(
    "Google Business | Acme Plumbing | (555) 010-2000 | 100 Main St, Austin, TX 78701\nFacebook | ACME Plumbing LLC | 555-010-2000 | 100 Main Street, Austin TX 78701\nYelp | Acme Plumbing | +1 555 010 2000 | 100 Main St Austin Texas 78701",
  );

  const normPhone = (p: string) => p.replace(/\D/g, "").replace(/^1/, "");
  const normName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const normAddr = (a: string) =>
    a
      .toLowerCase()
      .replace(/\bstreet\b/g, "st")
      .replace(/\bavenue\b/g, "ave")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const rows = parseLines(entries).map((line) => {
    const [source, name, phone, address] = line.split("|").map((s) => s?.trim() ?? "");
    return { source, name, phone, address };
  });

  const phones = new Set(rows.map((r) => normPhone(r.phone)).filter(Boolean));
  const names = new Set(rows.map((r) => normName(r.name)).filter(Boolean));
  const addrs = new Set(rows.map((r) => normAddr(r.address)).filter(Boolean));

  return (
    <div className="space-y-4">
      <Notice tone="info">
        NAP consistency checker for local SEO — compare Name, Address, Phone across citations. Format:{" "}
        <code className="text-xs">Source | Name | Phone | Address</code>
      </Notice>
      <Field label="Citations">
        <Textarea value={entries} onChange={(e) => setEntries(e.target.value)} rows={8} className="font-mono text-xs" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Name variants" value={names.size} />
        <Stat label="Phone variants" value={phones.size} />
        <Stat label="Address variants" value={addrs.size} />
      </div>
      <p className="text-sm text-muted">
        {names.size <= 1 && phones.size <= 1 && addrs.size <= 1
          ? "NAP looks consistent across pasted citations."
          : "Inconsistencies detected — standardize to one canonical NAP everywhere (GBP, site footer, directories)."}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-muted">
            <tr>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Address</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-1.5">{r.source}</td>
                <td className="px-3 py-1.5">{r.name}</td>
                <td className="px-3 py-1.5">{r.phone}</td>
                <td className="px-3 py-1.5">{r.address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
