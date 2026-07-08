"use client";

import * as React from "react";
import { Input, Select } from "@/components/ui/primitives";
import { Field, Output, Notice, Stat, FileDrop } from "@/components/tools/shared";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/* ============================ Regex Explainer ============================= */
type Tok = { tok: string; desc: string };

const CLASS_DESC: Record<string, string> = {
  "\\d": "Any digit (0–9)",
  "\\D": "Any non-digit",
  "\\w": "Any word character (letter, digit or underscore)",
  "\\W": "Any non-word character",
  "\\s": "Any whitespace (space, tab, newline)",
  "\\S": "Any non-whitespace",
  "\\b": "A word boundary",
  "\\B": "A non-word-boundary",
  "\\n": "A newline",
  "\\t": "A tab",
  "\\r": "A carriage return",
};

function explainRegex(src: string): { tokens: Tok[]; error?: string } {
  const tokens: Tok[] = [];
  let i = 0;
  let literal = "";
  const flushLiteral = () => {
    if (literal) {
      tokens.push({ tok: literal, desc: `Literal text “${literal}”` });
      literal = "";
    }
  };
  const lazy = () => {
    if (src[i + 1] === "?") {
      i++;
      return " (lazy — as few as possible)";
    }
    return "";
  };

  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const pair = src.slice(i, i + 2);
      flushLiteral();
      if (CLASS_DESC[pair]) tokens.push({ tok: pair, desc: CLASS_DESC[pair] });
      else tokens.push({ tok: pair, desc: `Literal “${src[i + 1] ?? ""}”` });
      i += 2;
      continue;
    }
    if (c === "[") {
      flushLiteral();
      const end = src.indexOf("]", src[i + 1] === "^" ? i + 2 : i + 1);
      if (end === -1) return { tokens, error: "Unclosed character class “[”." };
      const body = src.slice(i + 1, end);
      const neg = body.startsWith("^");
      tokens.push({
        tok: src.slice(i, end + 1),
        desc: `Any ${neg ? "character NOT" : "single character"} in the set: ${(neg ? body.slice(1) : body) || "(empty)"}`,
      });
      i = end + 1;
      continue;
    }
    if (c === "(") {
      flushLiteral();
      let desc = "Start of a capturing group";
      let len = 1;
      if (src.startsWith("(?:", i)) {
        desc = "Start of a non-capturing group";
        len = 3;
      } else if (src.startsWith("(?=", i)) {
        desc = "Start of a positive lookahead (followed by…)";
        len = 3;
      } else if (src.startsWith("(?!", i)) {
        desc = "Start of a negative lookahead (NOT followed by…)";
        len = 3;
      } else if (src.startsWith("(?<=", i)) {
        desc = "Start of a positive lookbehind (preceded by…)";
        len = 4;
      } else if (src.startsWith("(?<!", i)) {
        desc = "Start of a negative lookbehind (NOT preceded by…)";
        len = 4;
      } else if (src.startsWith("(?<", i)) {
        const gt = src.indexOf(">", i);
        if (gt !== -1) {
          desc = `Start of a named capturing group “${src.slice(i + 3, gt)}”`;
          len = gt - i + 1;
        }
      }
      tokens.push({ tok: src.slice(i, i + len), desc });
      i += len;
      continue;
    }
    flushLiteral();
    if (c === ")") tokens.push({ tok: ")", desc: "End of the group" });
    else if (c === "|") tokens.push({ tok: "|", desc: "OR — either the left side or the right side" });
    else if (c === "^") tokens.push({ tok: "^", desc: "Start of the string (or line)" });
    else if (c === "$") tokens.push({ tok: "$", desc: "End of the string (or line)" });
    else if (c === ".") tokens.push({ tok: ".", desc: "Any single character except a newline" });
    else if (c === "*") tokens.push({ tok: "*", desc: "Repeat the previous item zero or more times" + lazy() });
    else if (c === "+") tokens.push({ tok: "+", desc: "Repeat the previous item one or more times" + lazy() });
    else if (c === "?") tokens.push({ tok: "?", desc: "Make the previous item optional (zero or one)" + lazy() });
    else if (c === "{") {
      const end = src.indexOf("}", i);
      if (end === -1) {
        literal += c;
        i++;
        continue;
      }
      const spec = src.slice(i + 1, end);
      const m = spec.match(/^(\d+)(,(\d*)?)?$/);
      let desc = `Repeat “{${spec}}” times`;
      if (m) {
        if (!m[2]) desc = `Repeat the previous item exactly ${m[1]} times`;
        else if (m[3] === "" || m[3] === undefined) desc = `Repeat the previous item at least ${m[1]} times`;
        else desc = `Repeat the previous item between ${m[1]} and ${m[3]} times`;
      }
      tokens.push({ tok: src.slice(i, end + 1), desc: desc + lazy() });
      i = end + 1;
      continue;
    } else {
      literal += c;
    }
    i++;
  }
  flushLiteral();
  return { tokens };
}

export function RegexExplainer() {
  const [pattern, setPattern] = React.useState("^(\\d{3})-(\\d{4})$");
  const [valid, setValid] = React.useState(true);

  React.useEffect(() => {
    try {
      new RegExp(pattern);
      setValid(true);
    } catch {
      setValid(false);
    }
  }, [pattern]);

  const { tokens, error } = React.useMemo(() => explainRegex(pattern), [pattern]);

  return (
    <div className="space-y-5">
      <Field label="Regular expression" hint="Paste a pattern — no need for the surrounding slashes.">
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} className="font-mono" />
      </Field>
      {!valid && <Notice tone="error">This isn&apos;t a valid JavaScript regular expression.</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Plain-English breakdown">
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {tokens.length === 0 ? (
            <p className="p-4 text-sm text-muted">Enter a pattern to see it explained.</p>
          ) : (
            tokens.map((t, i) => (
              <div key={i} className="flex items-start gap-3 bg-surface px-4 py-2.5">
                <code className="shrink-0 rounded bg-surface-2 px-2 py-0.5 font-mono text-sm text-brand">
                  {t.tok}
                </code>
                <span className="text-sm text-muted">{t.desc}</span>
              </div>
            ))
          )}
        </div>
      </Field>
    </div>
  );
}

/* ============================ Data File Merger =========================== */
type Rec = Record<string, string | number | boolean | null>;

function parseCsv(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function detectDelim(line: string): string {
  const counts: Record<string, number> = {
    ",": (line.match(/,/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
    ";": (line.match(/;/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function toRecords(text: string): { records: Rec[]; kind: string } | { error: string } {
  const t = text.trim();
  if (!t) return { records: [], kind: "empty" };
  if (t[0] === "[" || t[0] === "{") {
    try {
      const data = JSON.parse(t);
      const arr = Array.isArray(data) ? data : [data];
      return { records: arr as Rec[], kind: "JSON" };
    } catch {
      return { error: "Invalid JSON." };
    }
  }
  if (t[0] === "<") {
    try {
      const doc = new DOMParser().parseFromString(t, "application/xml");
      if (doc.querySelector("parsererror")) return { error: "Invalid XML." };
      const root = doc.documentElement;
      const items = Array.from(root.children);
      const records = items.map((el) => {
        const rec: Rec = {};
        for (const a of Array.from(el.attributes)) rec[a.name] = a.value;
        for (const child of Array.from(el.children)) rec[child.tagName] = child.textContent ?? "";
        if (!el.children.length && !el.attributes.length) rec[el.tagName] = el.textContent ?? "";
        return rec;
      });
      return { records, kind: "XML" };
    } catch {
      return { error: "Could not parse XML." };
    }
  }
  // CSV / TSV
  const delim = detectDelim(t.split("\n")[0]);
  const rows = parseCsv(t, delim);
  if (rows.length < 1) return { records: [], kind: "CSV" };
  const header = rows[0];
  const records = rows.slice(1).map((r) => {
    const rec: Rec = {};
    header.forEach((h, i) => (rec[h] = r[i] ?? ""));
    return rec;
  });
  return { records, kind: delim === "\t" ? "TSV" : "CSV" };
}

function recordsToCsv(records: Rec[]): string {
  const keys = Array.from(new Set(records.flatMap((r) => Object.keys(r))));
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...records.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

type Source = { name: string; records: Rec[]; kind: string; error?: string };

export function DataFileMerger() {
  const [sources, setSources] = React.useState<Source[]>([]);
  const [format, setFormat] = React.useState("json");

  const onFiles = async (files: File[]) => {
    const loaded: Source[] = [];
    for (const f of files) {
      const text = await f.text();
      const res = toRecords(text);
      if ("error" in res) loaded.push({ name: f.name, records: [], kind: "?", error: res.error });
      else loaded.push({ name: f.name, records: res.records, kind: res.kind });
    }
    setSources((s) => [...s, ...loaded]);
  };

  const merged = React.useMemo(() => sources.flatMap((s) => s.records), [sources]);
  const output = React.useMemo(
    () => (format === "csv" ? recordsToCsv(merged) : JSON.stringify(merged, null, 2)),
    [merged, format],
  );

  return (
    <div className="space-y-5">
      <FileDrop accept=".json,.csv,.tsv,.xml" multiple onFiles={onFiles} label="Drop JSON, CSV, TSV or XML files to merge" />
      {sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2">
              <span className="flex items-center gap-2 text-sm">
                <Icon name="FileText" className="h-4 w-4 text-muted" />
                {s.name}
              </span>
              {s.error ? (
                <span className="text-xs text-rose-500">{s.error}</span>
              ) : (
                <span className="text-xs text-muted">
                  {s.kind} · {s.records.length} record{s.records.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSources([])}
            className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
      {merged.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Files merged" value={sources.filter((s) => !s.error).length} />
            <Stat label="Total records" value={merged.length} />
          </div>
          <Field label="Output format">
            <Select value={format} onChange={(e) => setFormat(e.target.value)} className="max-w-48">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </Select>
          </Field>
          <Output value={output} rows={14} filename={`merged.${format}`} />
        </>
      )}
    </div>
  );
}

/* ========================== Duplicate File Finder ======================== */
type FileInfo = { name: string; size: number; modified: number; hash: string };

async function sha256(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export function DuplicateFileFinder() {
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [busy, setBusy] = React.useState(false);

  const onFiles = async (dropped: File[]) => {
    setBusy(true);
    const infos: FileInfo[] = [];
    for (const f of dropped) {
      const hash = await sha256(await f.arrayBuffer());
      infos.push({ name: f.name, size: f.size, modified: f.lastModified, hash });
    }
    setFiles((s) => [...s, ...infos]);
    setBusy(false);
  };

  const { groups, wasted } = React.useMemo(() => {
    const byHash = new Map<string, FileInfo[]>();
    for (const f of files) {
      const arr = byHash.get(f.hash) ?? [];
      arr.push(f);
      byHash.set(f.hash, arr);
    }
    const groups = [...byHash.values()]
      .filter((g) => g.length > 1)
      .map((g) => [...g].sort((a, b) => b.modified - a.modified)); // newest first = keep
    const wasted = groups.reduce((sum, g) => sum + g.slice(1).reduce((s, f) => s + f.size, 0), 0);
    return { groups, wasted };
  }, [files]);

  return (
    <div className="space-y-5">
      <FileDrop multiple onFiles={onFiles} label="Drop files to scan for exact duplicates (they never leave your device)" />
      {busy && <Notice tone="info">Hashing files…</Notice>}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Files scanned" value={files.length} />
          <Stat label="Duplicate sets" value={groups.length} />
          <Stat label="Reclaimable" value={fmtBytes(wasted)} />
        </div>
      )}
      {files.length > 0 && groups.length === 0 && !busy && (
        <Notice tone="success">No duplicates found — every file is unique.</Notice>
      )}
      {groups.map((g, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-border p-3">
          <p className="text-xs font-medium text-muted">
            {g.length} identical files · {fmtBytes(g[0].size)} each
          </p>
          {g.map((f, j) => (
            <div
              key={j}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-sm"
            >
              <span className="truncate font-mono">{f.name}</span>
              {j === 0 ? (
                <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                  Keep (newest)
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500">
                  Safe to delete
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
      {files.length > 0 && (
        <button
          type="button"
          onClick={() => setFiles([])}
          className="text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      )}
      <p className={cn("flex items-start gap-2 text-xs text-muted")}>
        <Icon name="Lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>Files are hashed locally in your browser and never uploaded. &ldquo;Safe to delete&rdquo; marks the older copies in each identical set.</span>
      </p>
    </div>
  );
}
