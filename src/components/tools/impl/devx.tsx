"use client";

import * as React from "react";
import { Button, Input, Select } from "@/components/ui/primitives";
import { CopyButton, DownloadButton, Field, Notice, Output, Stat, FileDrop } from "@/components/tools/shared";
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
type HashAlgo = "md5" | "sha1" | "sha256";
type CompareMode = "content" | "name-size";
type KeepStrategy = "newest" | "oldest" | "shortest-path" | "longest-path" | "alphabetical";

type FileInfo = {
  path: string;
  name: string;
  size: number;
  modified: number;
  hash: string;
  ext: string;
};

type ScanProgress = {
  phase: "hashing" | "done";
  total: number;
  done: number;
  current: string;
  skippedBySize: number;
};

const HASH_CHUNK = 256 * 1024;

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

const fmtDate = (ms: number) => new Date(ms).toLocaleString();

function parseExtList(raw: string) {
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);
}

function fileExt(path: string) {
  const base = path.split("/").pop() ?? path;
  const i = base.lastIndexOf(".");
  return i > 0 ? base.slice(i + 1).toLowerCase() : "";
}

function shouldInclude(path: string, size: number, opts: {
  minBytes: number;
  skipHidden: boolean;
  includeExts: string[];
  excludeExts: string[];
}) {
  if (opts.skipHidden && /(^|\/)\./.test(path)) return false;
  if (size < opts.minBytes) return false;
  const ext = fileExt(path);
  if (opts.includeExts.length && !opts.includeExts.includes(ext)) return false;
  if (opts.excludeExts.length && opts.excludeExts.includes(ext)) return false;
  return true;
}

async function createHasher(algo: HashAlgo) {
  if (algo === "md5") {
    const { createMD5 } = await import("hash-wasm");
    return createMD5();
  }
  if (algo === "sha1") {
    const { createSHA1 } = await import("hash-wasm");
    return createSHA1();
  }
  const { createSHA256 } = await import("hash-wasm");
  return createSHA256();
}

async function hashFileChunked(
  file: File,
  algo: HashAlgo,
  cancelled: () => boolean,
): Promise<string> {
  const hasher = await createHasher(algo);
  for (let offset = 0; offset < file.size; offset += HASH_CHUNK) {
    if (cancelled()) throw new DOMException("Scan cancelled", "AbortError");
    const chunk = file.slice(offset, Math.min(offset + HASH_CHUNK, file.size));
    hasher.update(new Uint8Array(await chunk.arrayBuffer()));
  }
  return hasher.digest("hex");
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  cancelled: () => boolean,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      if (cancelled()) throw new DOMException("Scan cancelled", "AbortError");
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

function sortGroup(g: FileInfo[], strategy: KeepStrategy) {
  const sorted = [...g];
  switch (strategy) {
    case "oldest":
      return sorted.sort((a, b) => a.modified - b.modified || a.path.localeCompare(b.path));
    case "shortest-path":
      return sorted.sort((a, b) => a.path.length - b.path.length || a.path.localeCompare(b.path));
    case "longest-path":
      return sorted.sort((a, b) => b.path.length - a.path.length || a.path.localeCompare(b.path));
    case "alphabetical":
      return sorted.sort((a, b) => a.path.localeCompare(b.path));
    default:
      return sorted.sort((a, b) => b.modified - a.modified || a.path.localeCompare(b.path));
  }
}

function keepLabel(strategy: KeepStrategy) {
  switch (strategy) {
    case "oldest": return "Keep (oldest)";
    case "shortest-path": return "Keep (shortest path)";
    case "longest-path": return "Keep (longest path)";
    case "alphabetical": return "Keep (A→Z)";
    default: return "Keep (newest)";
  }
}

function DupCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-[var(--brand,#6366f1)]"
      />
      {label}
    </label>
  );
}

export function DuplicateFileFinder() {
  const [files, setFiles] = React.useState<FileInfo[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState<ScanProgress | null>(null);
  const [hashAlgo, setHashAlgo] = React.useState<HashAlgo>("md5");
  const [compareMode, setCompareMode] = React.useState<CompareMode>("content");
  const [keepStrategy, setKeepStrategy] = React.useState<KeepStrategy>("newest");
  const [minSizeKb, setMinSizeKb] = React.useState("0");
  const [includeExts, setIncludeExts] = React.useState("");
  const [excludeExts, setExcludeExts] = React.useState("");
  const [skipHidden, setSkipHidden] = React.useState(true);
  const [workers, setWorkers] = React.useState("4");
  const [exportFmt, setExportFmt] = React.useState<"txt" | "json" | "csv">("txt");
  const [collapsed, setCollapsed] = React.useState<Set<number>>(new Set());
  const cancelRef = React.useRef(false);
  const folderRef = React.useRef<HTMLInputElement>(null);

  const scanFiles = async (incoming: File[]) => {
    if (!incoming.length) return;
    cancelRef.current = false;
    setBusy(true);
    setProgress({ phase: "hashing", total: 0, done: 0, current: "", skippedBySize: 0 });

    const filterOpts = {
      minBytes: Math.max(0, Number(minSizeKb) || 0) * 1024,
      skipHidden,
      includeExts: parseExtList(includeExts),
      excludeExts: parseExtList(excludeExts),
    };
    const concurrency = Math.min(8, Math.max(1, Number(workers) || 4));

    const filtered = incoming.filter((f) =>
      shouldInclude(f.webkitRelativePath || f.name, f.size, filterOpts),
    );

    if (!filtered.length) {
      setBusy(false);
      setProgress(null);
      return;
    }

    try {
      let infos: FileInfo[] = [];

      if (compareMode === "name-size") {
        infos = filtered.map((f) => {
          const path = f.webkitRelativePath || f.name;
          return {
            path,
            name: f.name,
            size: f.size,
            modified: f.lastModified,
            ext: fileExt(path),
            hash: `${f.name.toLowerCase()}|${f.size}`,
          };
        });
        setProgress({ phase: "done", total: filtered.length, done: filtered.length, current: "", skippedBySize: 0 });
      } else {
        const bySize = new Map<number, File[]>();
        for (const f of filtered) {
          const arr = bySize.get(f.size) ?? [];
          arr.push(f);
          bySize.set(f.size, arr);
        }

        const toHash: File[] = [];
        let skippedBySize = 0;
        for (const group of bySize.values()) {
          if (group.length === 1) skippedBySize++;
          else toHash.push(...group);
        }

        const uniqueInfos: FileInfo[] = [];
        for (const [size, group] of bySize) {
          if (group.length === 1) {
            const f = group[0];
            const path = f.webkitRelativePath || f.name;
            uniqueInfos.push({
              path,
              name: f.name,
              size,
              modified: f.lastModified,
              ext: fileExt(path),
              hash: `__unique__:${size}:${path}`,
            });
          }
        }

        setProgress({
          phase: "hashing",
          total: toHash.length,
          done: 0,
          current: "",
          skippedBySize,
        });

        let done = 0;
        const hashed = await mapPool(
          toHash,
          concurrency,
          async (f) => {
            const path = f.webkitRelativePath || f.name;
            setProgress((p) =>
              p ? { ...p, current: path, done } : p,
            );
            const hash = await hashFileChunked(f, hashAlgo, () => cancelRef.current);
            done += 1;
            setProgress((p) =>
              p ? { ...p, done, current: path } : p,
            );
            return {
              path,
              name: f.name,
              size: f.size,
              modified: f.lastModified,
              ext: fileExt(path),
              hash,
            } satisfies FileInfo;
          },
          () => cancelRef.current,
        );

        infos = [...uniqueInfos, ...hashed];
        setProgress((p) =>
          p ? { ...p, phase: "done", done: toHash.length, skippedBySize } : p,
        );
      }

      setFiles((s) => [...s, ...infos]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setProgress(null);
      } else {
        console.error(err);
      }
    } finally {
      setBusy(false);
    }
  };

  const cancelScan = () => {
    cancelRef.current = true;
  };

  const { groups, wasted, deleteList, uniqueCount } = React.useMemo(() => {
    const byKey = new Map<string, FileInfo[]>();
    for (const f of files) {
      const arr = byKey.get(f.hash) ?? [];
      arr.push(f);
      byKey.set(f.hash, arr);
    }
    const groups = [...byKey.values()]
      .filter((g) => g.length > 1)
      .map((g) => sortGroup(g, keepStrategy))
      .sort((a, b) => b.slice(1).reduce((s, f) => s + f.size, 0) - a.slice(1).reduce((s, f) => s + f.size, 0));
    const deleteList = groups.flatMap((g) => g.slice(1));
    const wasted = deleteList.reduce((s, f) => s + f.size, 0);
    const uniqueCount = files.length - deleteList.length;
    return { groups, wasted, deleteList, uniqueCount };
  }, [files, keepStrategy]);

  const exportPayload = React.useMemo(() => {
    if (!deleteList.length) return "";
    if (exportFmt === "json") {
      return JSON.stringify(
        deleteList.map((f) => ({
          path: f.path,
          size: f.size,
          modified: f.modified,
          hash: f.hash,
        })),
        null,
        2,
      );
    }
    if (exportFmt === "csv") {
      const rows = [
        "path,size_bytes,modified_iso,hash",
        ...deleteList.map(
          (f) =>
            `"${f.path.replace(/"/g, '""')}",${f.size},${new Date(f.modified).toISOString()},${f.hash}`,
        ),
      ];
      return rows.join("\n");
    }
    return deleteList.map((f) => f.path).join("\n");
  }, [deleteList, exportFmt]);

  const exportMime =
    exportFmt === "json" ? "application/json" : exportFmt === "csv" ? "text/csv" : "text/plain";

  const toggleGroup = (i: number) => {
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const keepTag = keepLabel(keepStrategy);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <FileDrop
          multiple
          onFiles={scanFiles}
          label="Drop files to scan (never uploaded — 100% local)"
        />
        <div
          onClick={() => folderRef.current?.click()}
          className="glass flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border/80 p-10 text-center transition-all duration-300 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/10"
        >
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
            <Icon name="Archive" className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium">Select a folder to scan recursively</p>
          <p className="text-xs text-muted">Uses relative paths inside the folder</p>
          <input
            ref={folderRef}
            type="file"
            multiple
            className="hidden"
            {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
            onChange={(e) => {
              if (e.target.files) void scanFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Compare by">
          <Select value={compareMode} onChange={(e) => setCompareMode(e.target.value as CompareMode)}>
            <option value="content">Exact content (hash)</option>
            <option value="name-size">Same name + size (fast, no hash)</option>
          </Select>
        </Field>
        {compareMode === "content" && (
          <Field label="Hash algorithm">
            <Select value={hashAlgo} onChange={(e) => setHashAlgo(e.target.value as HashAlgo)}>
              <option value="md5">MD5 — fastest</option>
              <option value="sha1">SHA-1 — balanced</option>
              <option value="sha256">SHA-256 — strongest</option>
            </Select>
          </Field>
        )}
        <Field label="File to keep in each set">
          <Select value={keepStrategy} onChange={(e) => setKeepStrategy(e.target.value as KeepStrategy)}>
            <option value="newest">Newest modified</option>
            <option value="oldest">Oldest modified</option>
            <option value="shortest-path">Shortest path</option>
            <option value="longest-path">Longest path</option>
            <option value="alphabetical">First alphabetically</option>
          </Select>
        </Field>
        <Field label="Min file size (KB)">
          <Input
            type="number"
            min={0}
            value={minSizeKb}
            onChange={(e) => setMinSizeKb(e.target.value)}
            placeholder="0 = no minimum"
          />
        </Field>
        <Field label="Include extensions">
          <Input
            value={includeExts}
            onChange={(e) => setIncludeExts(e.target.value)}
            placeholder="jpg, png, mp4 (empty = all)"
          />
        </Field>
        <Field label="Exclude extensions">
          <Input
            value={excludeExts}
            onChange={(e) => setExcludeExts(e.target.value)}
            placeholder="tmp, ds_store"
          />
        </Field>
        {compareMode === "content" && (
          <Field label="Parallel hash workers">
            <Select value={workers} onChange={(e) => setWorkers(e.target.value)}>
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <option key={n} value={String(n)}>
                  {n} worker{n === 1 ? "" : "s"}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className="flex flex-col justify-end gap-2 sm:col-span-2 lg:col-span-3">
          <DupCheck label="Skip hidden files & folders (names starting with .)" checked={skipHidden} onChange={setSkipHidden} />
        </div>
      </div>

      {busy && progress && (
        <div className="space-y-2 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>
              {compareMode === "name-size"
                ? "Scanning…"
                : progress.total
                  ? `Hashing ${progress.done}/${progress.total}`
                  : "Preparing…"}
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={cancelScan}>
              Cancel
            </Button>
          </div>
          {progress.total > 0 && (
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-brand transition-all duration-200"
                style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
              />
            </div>
          )}
          {progress.current && (
            <p className="truncate font-mono text-xs text-muted">{progress.current}</p>
          )}
          {progress.skippedBySize > 0 && (
            <p className="text-xs text-muted">
              Skipped hashing {progress.skippedBySize} unique-size file
              {progress.skippedBySize === 1 ? "" : "s"} (no same-size peers)
            </p>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Files scanned" value={files.length} />
          <Stat label="Unique files" value={uniqueCount} />
          <Stat label="Duplicate sets" value={groups.length} />
          <Stat label="Reclaimable" value={fmtBytes(wasted)} />
        </div>
      )}

      {files.length > 0 && groups.length === 0 && !busy && (
        <Notice tone="success">No duplicates found — every scanned file is unique.</Notice>
      )}

      {deleteList.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-4">
          <Field label="Export delete list" className="min-w-[10rem] flex-1">
            <Select value={exportFmt} onChange={(e) => setExportFmt(e.target.value as typeof exportFmt)}>
              <option value="txt">Plain text (paths)</option>
              <option value="json">JSON (full metadata)</option>
              <option value="csv">CSV</option>
            </Select>
          </Field>
          <CopyButton value={exportPayload} label="Copy list" />
          <DownloadButton
            value={exportPayload}
            filename={`duplicates-to-delete.${exportFmt}`}
            mime={exportMime}
          />
          <p className="w-full text-xs text-muted">
            {deleteList.length} file{deleteList.length === 1 ? "" : "s"} marked safe to delete ·{" "}
            {fmtBytes(wasted)} total
          </p>
        </div>
      )}

      {groups.map((g, i) => {
        const groupWaste = g.slice(1).reduce((s, f) => s + f.size, 0);
        const isCollapsed = collapsed.has(i);
        return (
          <div key={`${g[0].hash}-${i}`} className="space-y-2 rounded-xl border border-border p-3">
            <button
              type="button"
              onClick={() => toggleGroup(i)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <p className="text-xs font-medium text-muted">
                {g.length} duplicates · {fmtBytes(g[0].size)} each · waste {fmtBytes(groupWaste)}
              </p>
              <Icon
                name="ChevronDown"
                className={cn("h-4 w-4 shrink-0 text-muted transition-transform", !isCollapsed && "rotate-180")}
              />
            </button>
            {!isCollapsed &&
              g.map((f, j) => (
                <div
                  key={`${f.path}-${j}`}
                  className="flex flex-col gap-1 rounded-lg bg-surface-2 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono">{f.path}</p>
                    <p className="text-xs text-muted">
                      {fmtBytes(f.size)}
                      {f.ext ? ` · .${f.ext}` : ""} · {fmtDate(f.modified)}
                    </p>
                  </div>
                  {j === 0 ? (
                    <span className="shrink-0 self-start rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 sm:self-center">
                      {keepTag}
                    </span>
                  ) : (
                    <span className="shrink-0 self-start rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-500 sm:self-center">
                      Safe to delete
                    </span>
                  )}
                </div>
              ))}
          </div>
        );
      })}

      {files.length > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={() => { setFiles([]); setProgress(null); setCollapsed(new Set()); }}>
          Clear all results
        </Button>
      )}

      <p className={cn("flex items-start gap-2 text-xs text-muted")}>
        <Icon name="Lock" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Files are hashed locally in your browser and never uploaded. Size-first grouping skips
          hashing when no other file shares the same size. Use MD5 for speed on large folders; SHA-256
          when you need stronger guarantees.
        </span>
      </p>
    </div>
  );
}
