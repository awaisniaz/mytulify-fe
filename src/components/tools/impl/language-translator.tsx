"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Button, Select, Textarea } from "@/components/ui/primitives";
import { Field, Notice, FileDrop, CopyButton } from "@/components/tools/shared";
import { download } from "@/lib/utils";
import {
  TRANSLATE_LANGUAGES,
  TRANSLATE_TARGET_LANGUAGES,
  TRANSLATE_LIMITS,
} from "@/lib/translate/languages";

type Mode = "text" | "file";
type SheetGrid = string[][];

function looksNumeric(s: string) {
  const t = s.trim();
  if (!t) return true;
  // skip pure numbers / dates / currency-ish
  if (/^[\d\s.,+\-/%$€£₹]+$/.test(t)) return true;
  if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}$/.test(t)) return true;
  return false;
}

function parseCsv(text: string): SheetGrid {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      if (ch === "\r") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.length) || rows.length === 0) rows.push(row);
  return rows;
}

function toCsv(grid: SheetGrid): string {
  return grid
    .map((row) =>
      row
        .map((cell) => {
          const s = cell ?? "";
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(","),
    )
    .join("\n");
}

function parseWorkbook(file: ArrayBuffer): { name: string; grid: SheetGrid } {
  const wb = XLSX.read(file, { type: "array", raw: false });
  const sheetName = wb.SheetNames[0] ?? "Sheet1";
  const sheet = wb.Sheets[sheetName]!;
  const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  }) as unknown as SheetGrid;
  return {
    name: sheetName,
    grid: aoa.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? "")) : [])),
  };
}

function collectTranslatable(grid: SheetGrid, skipHeader = true): { texts: string[]; coords: { r: number; c: number }[] } {
  const texts: string[] = [];
  const coords: { r: number; c: number }[] = [];
  const start = skipHeader && grid.length > 1 ? 1 : 0;
  for (let r = start; r < grid.length; r++) {
    const row = grid[r] ?? [];
    for (let c = 0; c < row.length; c++) {
      const raw = String(row[c] ?? "");
      const v = raw.trim();
      if (!v || looksNumeric(v)) continue;
      texts.push(raw);
      coords.push({ r, c });
    }
  }
  return { texts, coords };
}

/** Build side-by-side grid: each text column becomes Original | Translated. */
function buildSideBySide(grid: SheetGrid, coords: { r: number; c: number }[], translations: string[]): SheetGrid {
  const colSet = new Set(coords.map((x) => x.c));
  // Also include columns from header that look like text headers
  const width = Math.max(0, ...grid.map((r) => r.length));
  for (let c = 0; c < width; c++) {
    const h = String(grid[0]?.[c] ?? "").trim();
    if (h && !looksNumeric(h)) colSet.add(c);
  }
  const cols = [...colSet].sort((a, b) => a - b);
  const colIndex = new Map(cols.map((c, i) => [c, i]));
  void colIndex;

  const map = new Map<string, string>();
  coords.forEach((pos, i) => {
    map.set(`${pos.r},${pos.c}`, translations[i] ?? "");
  });

  const out: SheetGrid = [];
  for (let r = 0; r < grid.length; r++) {
    const src = grid[r] ?? [];
    const row: string[] = [];
    for (let c = 0; c < width; c++) {
      const original = String(src[c] ?? "");
      row.push(original);
      if (colSet.has(c)) {
        if (r === 0) {
          const base = original.trim() || `Column ${c + 1}`;
          row.push(`${base} (Translated)`);
        } else {
          row.push(map.get(`${r},${c}`) ?? "");
        }
      }
    }
    out.push(row);
  }
  return out;
}

async function translateBatch(
  texts: string[],
  from: string,
  to: string,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const out = new Array<string>(texts.length).fill("");
  const chunkSize = 40;
  let done = 0;
  for (let i = 0; i < texts.length; i += chunkSize) {
    const slice = texts.slice(i, i + chunkSize);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: slice, from, to }),
    });
    const data = (await res.json()) as { translations?: string[]; error?: string };
    if (!res.ok) throw new Error(data.error || "Translation failed");
    const parts = data.translations ?? [];
    for (let j = 0; j < slice.length; j++) {
      out[i + j] = parts[j] ?? "";
    }
    done = Math.min(texts.length, i + slice.length);
    onProgress?.(done, texts.length);
  }
  return out;
}

export function LanguageTranslator() {
  const [mode, setMode] = React.useState<Mode>("text");
  const [from, setFrom] = React.useState("auto");
  const [to, setTo] = React.useState("ur");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [progress, setProgress] = React.useState("");
  const [fileName, setFileName] = React.useState("");
  const [grid, setGrid] = React.useState<SheetGrid | null>(null);
  const [preview, setPreview] = React.useState<SheetGrid | null>(null);
  const [downloadCsv, setDownloadCsv] = React.useState("");

  async function onFiles(files: File[]) {
    const file = files[0];
    if (!file) return;
    setError("");
    setPreview(null);
    setDownloadCsv("");
    setFileName(file.name);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".csv") || lower.endsWith(".txt") || file.type.includes("csv")) {
        const text = await file.text();
        setGrid(parseCsv(text));
      } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".ods")) {
        const buf = await file.arrayBuffer();
        const parsed = parseWorkbook(buf);
        setGrid(parsed.grid);
      } else {
        setError("Please upload a .csv or .xlsx file.");
        setGrid(null);
        setFileName("");
      }
    } catch {
      setError("Could not read that file. Try exporting as CSV or XLSX.");
      setGrid(null);
    }
  }

  async function runText() {
    setError("");
    setOutput("");
    const text = input.trim();
    if (!text) {
      setError("Enter some text to translate.");
      return;
    }
    if (from !== "auto" && from === to) {
      setError("Source and target language must be different.");
      return;
    }
    setLoading(true);
    setProgress("Translating…");
    try {
      // Keep paragraphs: translate line-by-line for long docs, or whole if short
      const chunks = text.length > 3500 ? text.split(/\n/).map((l) => l) : [text];
      const nonEmptyIdx: number[] = [];
      const toSend: string[] = [];
      chunks.forEach((c, i) => {
        if (c.trim()) {
          nonEmptyIdx.push(i);
          toSend.push(c);
        }
      });
      const translated = await translateBatch(toSend, from, to, (d, t) => setProgress(`Translating ${d}/${t}…`));
      const rebuilt = chunks.slice();
      nonEmptyIdx.forEach((idx, j) => {
        rebuilt[idx] = translated[j] ?? "";
      });
      setOutput(rebuilt.join("\n"));
      setProgress("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  async function runFile() {
    setError("");
    setPreview(null);
    setDownloadCsv("");
    if (!grid?.length) {
      setError("Upload a CSV or Excel file first.");
      return;
    }
    if (from !== "auto" && from === to) {
      setError("Source and target language must be different.");
      return;
    }

    const { texts, coords } = collectTranslatable(grid);
    if (!texts.length) {
      setError("No translatable text found in the file (numbers/empty cells are skipped).");
      return;
    }
    if (texts.length > TRANSLATE_LIMITS.maxFileCells) {
      setError(`Too many text cells (${texts.length}). Max ${TRANSLATE_LIMITS.maxFileCells} — split the file.`);
      return;
    }

    setLoading(true);
    setProgress(`Preparing ${texts.length} cells…`);
    try {
      const translations = await translateBatch(texts, from, to, (d, t) =>
        setProgress(`Translating cells ${d}/${t}…`),
      );
      const outGrid = buildSideBySide(grid, coords, translations);
      setPreview(outGrid.slice(0, 12));
      const csv = toCsv(outGrid);
      setDownloadCsv(csv);
      setProgress(`Done — ${texts.length} cells translated.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  function downloadResult(format: "csv" | "xlsx") {
    if (!downloadCsv) return;
    const base = (fileName || "translated").replace(/\.(csv|xlsx|xls|ods)$/i, "");
    if (format === "csv") {
      download(downloadCsv, `${base}-translated.csv`, "text/csv;charset=utf-8");
      return;
    }
    const rows = parseCsv(downloadCsv);
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Translated");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${base}-translated.xlsx`);
  }

  function swapLangs() {
    if (from === "auto") return;
    setFrom(to);
    setTo(from);
    if (output) {
      setInput(output);
      setOutput(input);
    }
  }

  const cellCount = grid ? collectTranslatable(grid).texts.length : 0;

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Translate text between 35+ languages. Paste text, or upload a CSV / Excel file — every text cell is
        translated and returned next to the original.
      </Notice>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={mode === "text" ? "primary" : "secondary"} onClick={() => setMode("text")}>
          Text
        </Button>
        <Button type="button" size="sm" variant={mode === "file" ? "primary" : "secondary"} onClick={() => setMode("file")}>
          CSV / Excel file
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Field label="From">
          <Select value={from} onChange={(e) => setFrom(e.target.value)}>
            {TRANSLATE_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="button" variant="secondary" size="sm" className="mb-0.5 hidden sm:inline-flex" onClick={swapLangs} disabled={from === "auto"}>
          Swap
        </Button>
        <Field label="To">
          <Select value={to} onChange={(e) => setTo(e.target.value)}>
            {TRANSLATE_TARGET_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {mode === "text" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Original text">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={10}
              className="font-sans"
              placeholder="Type or paste text here…"
            />
          </Field>
          <Field label="Translation">
            <Textarea value={output} readOnly rows={10} className="font-sans bg-surface-2/60" placeholder="Translation appears here…" />
            {output && (
              <div className="mt-2">
                <CopyButton value={output} />
              </div>
            )}
          </Field>
        </div>
      ) : (
        <div className="space-y-3">
          <FileDrop
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onFiles={onFiles}
            label="Drop CSV or Excel (.xlsx) here"
          />
          {fileName && (
            <p className="text-sm text-muted">
              Loaded <span className="font-medium text-foreground">{fileName}</span>
              {grid ? ` · ${grid.length} rows · ${cellCount} text cells` : null}
            </p>
          )}
          {preview && preview.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
                <tbody>
                  {preview.map((row, ri) => (
                    <tr key={ri} className="border-b border-border last:border-0">
                      {row.slice(0, 8).map((cell, ci) => (
                        <td key={ci} className={`max-w-[10rem] truncate px-2.5 py-1.5 ${ri === 0 ? "bg-surface-2 font-semibold" : ""}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-border px-3 py-2 text-xs text-muted">Preview (first rows / columns)</p>
            </div>
          )}
          {downloadCsv && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" onClick={() => downloadResult("csv")}>
                Download CSV
              </Button>
              <Button type="button" variant="secondary" onClick={() => downloadResult("xlsx")}>
                Download Excel
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <Notice tone="error">
          {error}
        </Notice>
      )}
      {progress && !error && <p className="text-sm text-muted">{progress}</p>}

      <Button
        type="button"
        disabled={loading}
        onClick={() => (mode === "text" ? runText() : runFile())}
        className="w-full sm:w-auto"
      >
        {loading ? "Translating…" : "Translate"}
      </Button>
    </div>
  );
}
