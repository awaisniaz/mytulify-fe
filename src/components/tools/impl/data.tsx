"use client";

import * as React from "react";
import yaml from "js-yaml";
import { marked } from "marked";
import { Input, Select, Button, Textarea } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Notice, Stat } from "@/components/tools/shared";

/* ----------------------------- helpers ------------------------------------- */
function TwoPane({
  input, setInput, output, error, action, inPlaceholder = "Paste here…", outFilename,
}: {
  input: string; setInput: (s: string) => void; output: string; error?: string;
  action?: React.ReactNode; inPlaceholder?: string; outFilename?: string;
}) {
  return (
    <div className="space-y-4">
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Input">
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={12} placeholder={inPlaceholder} />
        </Field>
        <Field label="Output">
          <Output value={error ? "" : output} rows={12} filename={outFilename} />
          {error && <Notice tone="error">{error}</Notice>}
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------ Base64 ------------------------------------- */
export function Base64Tool() {
  const [mode, setMode] = React.useState<"enc" | "dec">("enc");
  const [input, setInput] = React.useState("");
  let output = "", error = "";
  try {
    if (input) {
      output = mode === "enc"
        ? btoa(unescape(encodeURIComponent(input)))
        : decodeURIComponent(escape(atob(input.trim())));
    }
  } catch {
    error = "Invalid Base64 input.";
  }
  return (
    <TwoPane
      input={input} setInput={setInput} output={output} error={error}
      outFilename="base64.txt"
      action={
        <Select value={mode} onChange={(e) => setMode(e.target.value as "enc")} className="max-w-56">
          <option value="enc">Encode to Base64</option>
          <option value="dec">Decode from Base64</option>
        </Select>
      }
    />
  );
}

/* ------------------------------ URL encode --------------------------------- */
export function UrlTool() {
  const [mode, setMode] = React.useState<"enc" | "dec">("enc");
  const [input, setInput] = React.useState("");
  let output = "", error = "";
  try {
    if (input) output = mode === "enc" ? encodeURIComponent(input) : decodeURIComponent(input);
  } catch {
    error = "Invalid input for decoding.";
  }
  return (
    <TwoPane input={input} setInput={setInput} output={output} error={error}
      action={
        <Select value={mode} onChange={(e) => setMode(e.target.value as "enc")} className="max-w-56">
          <option value="enc">Encode URL</option>
          <option value="dec">Decode URL</option>
        </Select>
      } />
  );
}

/* ------------------------------ HTML entities ------------------------------ */
export function HtmlEntitiesTool() {
  const [mode, setMode] = React.useState<"enc" | "dec">("enc");
  const [input, setInput] = React.useState("");
  let output = "";
  if (input) {
    if (mode === "enc") {
      output = input.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    } else {
      const ta = typeof document !== "undefined" ? document.createElement("textarea") : null;
      if (ta) { ta.innerHTML = input; output = ta.value; }
    }
  }
  return (
    <TwoPane input={input} setInput={setInput} output={output}
      action={
        <Select value={mode} onChange={(e) => setMode(e.target.value as "enc")} className="max-w-56">
          <option value="enc">Encode entities</option>
          <option value="dec">Decode entities</option>
        </Select>
      } />
  );
}

export const Rot13Tool = () => {
  const [input, setInput] = React.useState("Hello");
  const out = input.replace(/[a-z]/gi, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
  return <TwoPane input={input} setInput={setInput} output={out} />;
};

/* ------------------------------ JSON tools --------------------------------- */
export function JsonFormatter() {
  const [input, setInput] = React.useState('{"hello":"world","items":[1,2,3]}');
  const [indent, setIndent] = React.useState("2");
  let output = "", error = "";
  try {
    if (input.trim()) {
      const obj = JSON.parse(input);
      output = indent === "min" ? JSON.stringify(obj) : JSON.stringify(obj, null, parseInt(indent, 10));
    }
  } catch (e) {
    error = (e as Error).message;
  }
  return (
    <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="formatted.json"
      action={
        <Select value={indent} onChange={(e) => setIndent(e.target.value)} className="max-w-44">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="min">Minify</option>
        </Select>
      } />
  );
}

export function JsonValidator() {
  const [input, setInput] = React.useState("");
  let ok = false, msg = "Paste JSON to validate.";
  if (input.trim()) {
    try { JSON.parse(input); ok = true; msg = "✓ Valid JSON"; }
    catch (e) { msg = (e as Error).message; }
  }
  return (
    <div className="space-y-4">
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={12} placeholder="Paste JSON…" />
      <Notice tone={ok ? "success" : input.trim() ? "error" : "info"}>{msg}</Notice>
    </div>
  );
}

export function JsonToCsv() {
  const [input, setInput] = React.useState('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
  let output = "", error = "";
  try {
    if (input.trim()) {
      const data = JSON.parse(input);
      const arr = Array.isArray(data) ? data : [data];
      const keys = [...new Set(arr.flatMap((o) => Object.keys(o)))];
      const esc = (v: unknown) => {
        const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      output = [keys.join(","), ...arr.map((o) => keys.map((k) => esc(o[k])).join(","))].join("\n");
    }
  } catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="data.csv" />;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

export function CsvToJson() {
  const [input, setInput] = React.useState("name,age\nAlice,30\nBob,25");
  let output = "", error = "";
  try {
    if (input.trim()) {
      const rows = parseCsv(input).filter((r) => r.some((c) => c !== ""));
      const headers = rows[0];
      const out = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
      output = JSON.stringify(out, null, 2);
    }
  } catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="data.json" />;
}

export function CsvToTsv() {
  const [input, setInput] = React.useState("name,age\nAlice,30");
  const out = parseCsv(input).map((r) => r.join("\t")).join("\n");
  return <TwoPane input={input} setInput={setInput} output={out} outFilename="data.tsv" />;
}

export function JsonYaml({ dir }: { dir: "j2y" | "y2j" }) {
  const [input, setInput] = React.useState(dir === "j2y" ? '{"name":"app","ports":[80,443]}' : "name: app\nports:\n  - 80\n  - 443");
  let output = "", error = "";
  try {
    if (input.trim()) {
      output = dir === "j2y"
        ? yaml.dump(JSON.parse(input))
        : JSON.stringify(yaml.load(input), null, 2);
    }
  } catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename={dir === "j2y" ? "out.yaml" : "out.json"} />;
}

function toXml(obj: unknown, root = "root", indent = ""): string {
  if (obj === null || typeof obj !== "object") return `${indent}<${root}>${String(obj)}</${root}>`;
  if (Array.isArray(obj)) return obj.map((v) => toXml(v, root, indent)).join("\n");
  const inner = Object.entries(obj as Record<string, unknown>)
    .map(([k, v]) => toXml(v, k, indent + "  ")).join("\n");
  return `${indent}<${root}>\n${inner}\n${indent}</${root}>`;
}
export function JsonToXml() {
  const [input, setInput] = React.useState('{"name":"app","version":1}');
  let output = "", error = "";
  try { if (input.trim()) output = '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(JSON.parse(input)); }
  catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="data.xml" />;
}

export function XmlToJson() {
  const [input, setInput] = React.useState("<root><name>app</name><version>1</version></root>");
  let output = "", error = "";
  try {
    if (input.trim() && typeof window !== "undefined") {
      const doc = new DOMParser().parseFromString(input, "text/xml");
      if (doc.querySelector("parsererror")) throw new Error("Invalid XML");
      const walk = (node: Element): unknown => {
        const children = Array.from(node.children);
        if (!children.length) return node.textContent;
        const obj: Record<string, unknown> = {};
        for (const c of children) {
          const val = walk(c);
          if (obj[c.tagName] !== undefined) {
            if (!Array.isArray(obj[c.tagName])) obj[c.tagName] = [obj[c.tagName]];
            (obj[c.tagName] as unknown[]).push(val);
          } else obj[c.tagName] = val;
        }
        return obj;
      };
      output = JSON.stringify({ [doc.documentElement.tagName]: walk(doc.documentElement) }, null, 2);
    }
  } catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="data.json" />;
}

export function JsonToTs() {
  const [input, setInput] = React.useState('{"id":1,"name":"Ann","active":true,"tags":["a"]}');
  let output = "", error = "";
  const tsType = (v: unknown): string => {
    if (v === null) return "null";
    if (Array.isArray(v)) return v.length ? `${tsType(v[0])}[]` : "unknown[]";
    if (typeof v === "object") return "{\n" + Object.entries(v as object).map(([k, val]) => `  ${k}: ${tsType(val)};`).join("\n") + "\n}";
    return typeof v;
  };
  try { if (input.trim()) output = `interface Root ${tsType(JSON.parse(input))}`; }
  catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="types.ts" />;
}

export function SqlToJson() {
  const [input, setInput] = React.useState("INSERT INTO users (id, name) VALUES (1, 'Alice'), (2, 'Bob');");
  let output = "", error = "";
  try {
    const m = input.match(/\(([^)]+)\)\s*VALUES\s*([\s\S]+);?/i);
    if (m) {
      const cols = m[1].split(",").map((c) => c.trim().replace(/[`"']/g, ""));
      const rows = [...m[2].matchAll(/\(([^)]+)\)/g)].map((r) =>
        r[1].split(",").map((v) => v.trim().replace(/^'|'$/g, "")),
      );
      output = JSON.stringify(rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]]))), null, 2);
    }
  } catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={output} error={error} outFilename="data.json" />;
}

/* ------------------------------ JWT decoder -------------------------------- */
export function JwtDecoder() {
  const [input, setInput] = React.useState("");
  let header = "", payload = "", error = "";
  if (input.trim()) {
    try {
      const [h, p] = input.split(".");
      const dec = (s: string) => JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))))), null, 2);
      header = dec(h); payload = dec(p);
    } catch { error = "Invalid JWT token."; }
  }
  return (
    <div className="space-y-4">
      <Field label="JWT token">
        <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4} placeholder="eyJhbGciOi..." />
      </Field>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Header"><Output value={header} rows={6} /></Field>
        <Field label="Payload"><Output value={payload} rows={6} /></Field>
      </div>
    </div>
  );
}

/* ------------------------------ Regex tester ------------------------------- */
export function RegexTester() {
  const [pattern, setPattern] = React.useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = React.useState("g");
  const [text, setText] = React.useState("Contact us at hi@test.com or sales@shop.io");
  let matches: string[] = [], error = "";
  try {
    if (pattern) {
      const re = new RegExp(pattern, flags);
      matches = [...text.matchAll(new RegExp(pattern, flags.includes("g") ? flags : flags + "g"))].map((m) => m[0]);
      void re;
    }
  } catch (e) { error = (e as Error).message; }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" placeholder="pattern" />
        <Input value={flags} onChange={(e) => setFlags(e.target.value)} className="w-24 font-mono" placeholder="flags" />
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-sans" />
      {error ? <Notice tone="error">{error}</Notice> : <Notice tone="success">{matches.length} match{matches.length !== 1 ? "es" : ""} found</Notice>}
      <div className="flex flex-wrap gap-2">
        {matches.map((m, i) => (
          <span key={i} className="rounded-lg bg-brand/10 px-2.5 py-1 font-mono text-sm text-brand">{m}</span>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Timestamp converter --------------------------- */
export function TimestampConverter() {
  const [ts, setTs] = React.useState(String(1700000000));
  const [dt, setDt] = React.useState("");
  const n = parseInt(ts, 10);
  const date = !isNaN(n) ? new Date(n * (ts.length > 10 ? 1 : 1000)) : null;
  return (
    <div className="space-y-5">
      <Field label="Unix timestamp → date">
        <Input value={ts} onChange={(e) => setTs(e.target.value)} className="font-mono" />
      </Field>
      {date && !isNaN(date.getTime()) && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[["UTC", date.toUTCString()], ["Local", date.toString()], ["ISO 8601", date.toISOString()], ["Date only", date.toLocaleDateString()]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3 text-sm">
              <span className="w-20 text-muted">{k}</span>
              <span className="min-w-0 flex-1 break-all font-mono">{v}</span>
              <CopyButton value={v} label="" />
            </div>
          ))}
        </div>
      )}
      <Field label="Date → timestamp">
        <Input type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
      </Field>
      {dt && (
        <Notice tone="info">
          Unix seconds: <strong>{Math.floor(new Date(dt).getTime() / 1000)}</strong> · ms: <strong>{new Date(dt).getTime()}</strong>
        </Notice>
      )}
    </div>
  );
}

/* ------------------------------ UUID generator ----------------------------- */
export function UuidGenerator() {
  const [count, setCount] = React.useState(5);
  const [list, setList] = React.useState<string[]>([]);
  const gen = React.useCallback(() => {
    setList(Array.from({ length: Math.max(1, Math.min(100, count)) }, () => crypto.randomUUID()));
  }, [count]);
  React.useEffect(() => { gen(); }, [gen]);
  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <Field label="How many?"><Input type="number" value={count} onChange={(e) => setCount(+e.target.value)} className="w-28" /></Field>
        <Button onClick={gen}>Generate</Button>
      </div>
      <Output value={list.join("\n")} rows={Math.min(10, list.length)} filename="uuids.txt" />
    </div>
  );
}

/* ------------------------------ Minifiers ---------------------------------- */
function minifyCss(s: string) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*([{}:;,>])\s*/g, "$1").replace(/;}/g, "}").replace(/\s+/g, " ").trim();
}
function minifyHtml(s: string) {
  return s.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").trim();
}
function minifyJs(s: string) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1").replace(/\n\s*/g, "\n").replace(/\s{2,}/g, " ").trim();
}
export function Minifier({ kind }: { kind: "html" | "css" | "js" | "auto" }) {
  const [input, setInput] = React.useState("");
  const fn = kind === "css" ? minifyCss : kind === "html" ? minifyHtml : minifyJs;
  const out = input ? fn(input) : "";
  const saved = input ? Math.max(0, Math.round((1 - out.length / input.length) * 100)) : 0;
  return (
    <div className="space-y-3">
      <TwoPane input={input} setInput={setInput} output={out} outFilename={`min.${kind === "auto" ? "txt" : kind}`} inPlaceholder={`Paste ${kind.toUpperCase()} code…`} />
      {input && <Notice tone="success">Reduced by {saved}% · {input.length} → {out.length} chars</Notice>}
    </div>
  );
}

/* ------------------------------ SQL / XML format --------------------------- */
export function SqlFormatter() {
  const [input, setInput] = React.useState("select id,name from users where age>18 order by name");
  const kw = ["SELECT", "FROM", "WHERE", "ORDER BY", "GROUP BY", "HAVING", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "JOIN", "ON", "AND", "OR", "LIMIT", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE"];
  let out = input;
  for (const k of kw) out = out.replace(new RegExp(`\\b${k.replace(/ /g, "\\s+")}\\b`, "gi"), "\n" + k);
  out = out.replace(/,/g, ",\n  ").replace(/\n{2,}/g, "\n").trim();
  return <TwoPane input={input} setInput={setInput} output={out} outFilename="query.sql" />;
}
export function XmlFormatter() {
  const [input, setInput] = React.useState("<root><a>1</a><b><c>2</c></b></root>");
  let out = "", error = "";
  try {
    let depth = 0;
    out = input.replace(/>\s*</g, "><").replace(/</g, "\n<").split("\n").filter(Boolean).map((line) => {
      if (/^<\//.test(line)) depth--;
      const pad = "  ".repeat(Math.max(0, depth));
      if (/^<[^/!?][^>]*[^/]>$/.test(line) && !/<\/.+>/.test(line)) depth++;
      return pad + line;
    }).join("\n");
  } catch (e) { error = (e as Error).message; }
  return <TwoPane input={input} setInput={setInput} output={out} error={error} outFilename="formatted.xml" />;
}

/* ------------------------------ Markdown ----------------------------------- */
export function MarkdownPreview() {
  const [input, setInput] = React.useState("# Hello\n\nThis is **markdown** with a [link](https://example.com).\n\n- one\n- two");
  const html = React.useMemo(() => marked.parse(input) as string, [input]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label="Markdown"><Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={14} /></Field>
      <Field label="Preview">
        <div className="prose-md min-h-80 rounded-xl border border-border bg-surface-2 p-4 text-sm [&_a]:text-brand [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-2" dangerouslySetInnerHTML={{ __html: html }} />
      </Field>
    </div>
  );
}
export function MarkdownToHtml() {
  const [input, setInput] = React.useState("# Title\n\nSome **bold** text.");
  const out = React.useMemo(() => marked.parse(input) as string, [input]);
  return <TwoPane input={input} setInput={setInput} output={out} outFilename="output.html" />;
}
export function HtmlToMarkdown() {
  const [input, setInput] = React.useState("<h1>Title</h1><p>Some <strong>bold</strong> text and a <a href='https://x.com'>link</a>.</p>");
  const out = input
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<a[^>]*href=['"]([^'"]*)['"][^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<\/?(p|div|ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n").trim();
  return <TwoPane input={input} setInput={setInput} output={out} outFilename="output.md" />;
}

/* ------------------------------ Random tools ------------------------------- */
export function RandomNumber() {
  const [min, setMin] = React.useState(1);
  const [max, setMax] = React.useState(100);
  const [count, setCount] = React.useState(1);
  const [out, setOut] = React.useState<number[]>([]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Min"><Input type="number" value={min} onChange={(e) => setMin(+e.target.value)} /></Field>
        <Field label="Max"><Input type="number" value={max} onChange={(e) => setMax(+e.target.value)} /></Field>
        <Field label="How many"><Input type="number" value={count} onChange={(e) => setCount(+e.target.value)} /></Field>
      </div>
      <Button onClick={() => setOut(Array.from({ length: Math.max(1, Math.min(1000, count)) }, () => Math.floor(Math.random() * (max - min + 1)) + min))}>
        Generate
      </Button>
      {out.length > 0 && (
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <p className="break-words font-mono text-lg">{out.join(", ")}</p>
        </div>
      )}
    </div>
  );
}
export function RandomString() {
  const [len, setLen] = React.useState(24);
  const [count, setCount] = React.useState(5);
  const [sets, setSets] = React.useState({ upper: true, lower: true, digits: true, symbols: false });
  const [out, setOut] = React.useState<string[]>([]);
  const gen = React.useCallback(() => {
    let chars = "";
    if (sets.upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (sets.lower) chars += "abcdefghijklmnopqrstuvwxyz";
    if (sets.digits) chars += "0123456789";
    if (sets.symbols) chars += "!@#$%^&*-_=+";
    if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";
    const rnd = (n: number) => {
      const a = new Uint32Array(n); crypto.getRandomValues(a);
      return [...a].map((x) => chars[x % chars.length]).join("");
    };
    setOut(Array.from({ length: Math.max(1, Math.min(100, count)) }, () => rnd(len)));
  }, [len, count, sets]);
  React.useEffect(() => { gen(); }, [gen]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Length: ${len}`}><input type="range" min={4} max={128} value={len} onChange={(e) => setLen(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
        <Field label="How many"><Input type="number" value={count} onChange={(e) => setCount(+e.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        {(["upper", "lower", "digits", "symbols"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2 capitalize">
            <input type="checkbox" checked={sets[k]} onChange={(e) => setSets({ ...sets, [k]: e.target.checked })} /> {k}
          </label>
        ))}
      </div>
      <Button onClick={gen}>Generate</Button>
      <Output value={out.join("\n")} rows={Math.min(8, out.length)} filename="strings.txt" />
    </div>
  );
}
export function ListRandomizer() {
  const [input, setInput] = React.useState("Alice\nBob\nCharlie\nDiana");
  const [out, setOut] = React.useState("");
  const shuffle = () => {
    const arr = input.split("\n").filter((l) => l.trim());
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOut(arr.join("\n"));
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Your list (one per line)"><Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={10} className="font-sans" /></Field>
        <Field label="Shuffled"><Output value={out} rows={10} mono={false} /></Field>
      </div>
      <Button onClick={shuffle}>🔀 Shuffle list</Button>
    </div>
  );
}

/* ------------------------------ Chmod calc --------------------------------- */
export function ChmodCalculator() {
  const [perms, setPerms] = React.useState({ ur: true, uw: true, ux: true, gr: true, gw: false, gx: true, or: true, ow: false, ox: true });
  const groups = [["u", "Owner"], ["g", "Group"], ["o", "Others"]] as const;
  const oct = [["u"], ["g"], ["o"]].map(([g]) =>
    (perms[`${g}r` as keyof typeof perms] ? 4 : 0) + (perms[`${g}w` as keyof typeof perms] ? 2 : 0) + (perms[`${g}x` as keyof typeof perms] ? 1 : 0),
  ).join("");
  const sym = [["u"], ["g"], ["o"]].map(([g]) =>
    (perms[`${g}r` as keyof typeof perms] ? "r" : "-") + (perms[`${g}w` as keyof typeof perms] ? "w" : "-") + (perms[`${g}x` as keyof typeof perms] ? "x" : "-"),
  ).join("");
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {groups.map(([g, label]) => (
          <div key={g} className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-2 font-medium">{label}</p>
            {[["r", "Read"], ["w", "Write"], ["x", "Execute"]].map(([p, pl]) => (
              <label key={p} className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" checked={perms[`${g}${p}` as keyof typeof perms]} onChange={(e) => setPerms({ ...perms, [`${g}${p}`]: e.target.checked })} /> {pl}
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Octal" value={oct} />
        <Stat label="Symbolic" value={sym} />
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="flex-1 font-mono">chmod {oct} file</code>
        <CopyButton value={`chmod ${oct} file`} />
      </div>
    </div>
  );
}

/* ------------------------------ User agent --------------------------------- */
export function UserAgentParser() {
  const [ua, setUa] = React.useState("");
  React.useEffect(() => { setUa(navigator.userAgent); }, []);
  const detect = (re: RegExp) => re.exec(ua)?.[1] ?? "—";
  const browser = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "Unknown";
  const os = /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /Linux/.test(ua) ? "Linux" : /iPhone|iPad/.test(ua) ? "iOS" : "Unknown";
  const mobile = /Mobile|Android|iPhone/.test(ua) ? "Mobile" : "Desktop";
  return (
    <div className="space-y-4">
      <Field label="User agent string"><Textarea value={ua} onChange={(e) => setUa(e.target.value)} rows={3} /></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Browser" value={browser} />
        <Stat label="OS" value={os} />
        <Stat label="Device" value={mobile} />
        <Stat label="Engine" value={/WebKit/.test(ua) ? "WebKit" : /Gecko/.test(ua) ? "Gecko" : "—"} />
      </div>
      <p className="text-xs text-muted">Chrome version: {detect(/Chrome\/([\d.]+)/)}</p>
    </div>
  );
}

/* ------------------------------ Cron explainer ----------------------------- */
export function CronGenerator() {
  const [expr, setExpr] = React.useState("0 9 * * 1-5");
  const parts = expr.trim().split(/\s+/);
  const labels = ["minute", "hour", "day of month", "month", "day of week"];
  const explain = parts.length === 5
    ? parts.map((p, i) => `${labels[i]}: ${p === "*" ? "every" : p}`).join(" · ")
    : "A cron expression has 5 fields: minute hour day month weekday";
  const presets: [string, string][] = [
    ["Every minute", "* * * * *"], ["Every hour", "0 * * * *"], ["Every day at midnight", "0 0 * * *"],
    ["Weekdays 9am", "0 9 * * 1-5"], ["Every Sunday", "0 0 * * 0"], ["First of month", "0 0 1 * *"],
  ];
  return (
    <div className="space-y-4">
      <Field label="Cron expression"><Input value={expr} onChange={(e) => setExpr(e.target.value)} className="font-mono text-lg" /></Field>
      <Notice tone="info">{explain}</Notice>
      <div className="flex flex-wrap gap-2">
        {presets.map(([l, v]) => (
          <button key={v} onClick={() => setExpr(v)} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-2">{l}</button>
        ))}
      </div>
    </div>
  );
}
