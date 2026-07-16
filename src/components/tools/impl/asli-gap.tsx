"use client";

import * as React from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { parseGIF, decompressFrames } from "gifuct-js";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { Input, Select, Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice, Output, Stat } from "@/components/tools/shared";
import { download, formatBytes } from "@/lib/utils";
import { extractPdfText, renderPdfPageToCanvas } from "@/lib/pdfjs";

/* ------------------------------ helpers ------------------------------------ */
async function loadPdf(file: File) {
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

async function savePdf(doc: PDFDocument, name: string) {
  download(new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" }), name);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), type, quality));
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new window.Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = rej;
    img.src = url;
  });
  URL.revokeObjectURL(url);
  return img;
}

type GifFrame = {
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
  delay: number;
};

async function decodeGifFile(file: File): Promise<{ width: number; height: number; frames: GifFrame[] }> {
  const gif = parseGIF(await file.arrayBuffer());
  const raw = decompressFrames(gif, true);
  const width = gif.lsd.width;
  const height = gif.lsd.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const frames: GifFrame[] = [];
  for (const f of raw) {
    const patch = document.createElement("canvas");
    patch.width = f.dims.width;
    patch.height = f.dims.height;
    patch.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(f.patch), f.dims.width, f.dims.height), 0, 0);
    if (f.disposalType === 2) ctx.clearRect(0, 0, width, height);
    ctx.drawImage(patch, f.dims.left, f.dims.top);
    frames.push({
      rgba: new Uint8ClampedArray(ctx.getImageData(0, 0, width, height).data),
      width,
      height,
      delay: f.delay ?? 10,
    });
  }
  return { width, height, frames };
}

function encodeGifFrames(frames: GifFrame[]) {
  const enc = GIFEncoder();
  for (const f of frames) {
    const palette = quantize(f.rgba, 256);
    const index = applyPalette(f.rgba, palette);
    enc.writeFrame(index, f.width, f.height, { palette, delay: Math.max(1, Math.round(f.delay)) });
  }
  enc.finish();
  return new Blob([new Uint8Array(enc.bytes())], { type: "image/gif" });
}

function putRgba(ctx: CanvasRenderingContext2D, rgba: Uint8ClampedArray, w: number, h: number) {
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
}

function frameToCanvas(f: GifFrame) {
  const c = document.createElement("canvas");
  c.width = f.width;
  c.height = f.height;
  putRgba(c.getContext("2d")!, f.rgba, f.width, f.height);
  return c;
}

async function zipBlobs(entries: { name: string; blob: Blob }[], zipName: string) {
  const zip = new JSZip();
  for (const e of entries) zip.file(e.name, e.blob);
  download(await zip.generateAsync({ type: "blob" }), zipName);
}

/* ------------------------------ PDF: text / csv ----------------------------- */
export function TxtToPdf() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const text = await f.text();
      const { exportBrandedPdf } = await import("@/lib/pdf-doc");
      await exportBrandedPdf({
        docType: "Text document",
        title: f.name.replace(/\.[^.]+$/i, "") || "Document",
        subtitle: "Converted from plain text · Designer layout",
        sections: [{ heading: "Content", body: text || "(empty file)" }],
        footerLeft: "Mytulify · TXT to PDF",
        filename: f.name.replace(/\.[^.]+$/i, ".pdf"),
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept=".txt,text/plain" onFiles={onFiles} label="Drop a .txt file" />
      {busy && <Notice tone="info">Creating PDF…</Notice>}
    </div>
  );
}

function parseDelimited(text: string): string[][] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length);
  if (!lines.length) return [["(empty)"]];
  const delim = lines[0]!.includes("\t") ? "\t" : ",";
  return lines.map((line) => {
    // Lightweight CSV split (handles simple quoted cells)
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]!;
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = !inQ;
        continue;
      }
      if (ch === delim && !inQ) {
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

async function tableToPdf(text: string, name: string) {
  const { exportTablePdf } = await import("@/lib/pdf-doc");
  const rows = parseDelimited(text);
  await exportTablePdf({
    title: name.replace(/\.[^.]+$/i, "") || "Spreadsheet",
    subtitle: `${rows.length} row${rows.length === 1 ? "" : "s"} · Designed table layout`,
    rows,
    hasHeader: true,
    footerLeft: "Mytulify · Spreadsheet to PDF",
    filename: name.replace(/\.[^.]+$/i, ".pdf"),
  });
}

export function CsvToPdf() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      await tableToPdf(await f.text(), f.name);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept=".csv,text/csv,text/plain" onFiles={onFiles} label="Drop a CSV file" />
      {busy && <Notice tone="info">Creating PDF…</Notice>}
      <Notice tone="info">Exports a designed multi-page table PDF. For native Excel (.xlsx), use Excel → PDF.</Notice>
    </div>
  );
}

export function ExcelToPdf() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const lower = f.name.toLowerCase();
      if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.endsWith(".txt")) {
        await tableToPdf(await f.text(), f.name);
        return;
      }
      alert("Browser conversion supports CSV/TSV exports. Save your spreadsheet as CSV and upload again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept=".csv,.tsv,.txt,text/csv" onFiles={onFiles} label="Drop CSV exported from Excel" />
      {busy && <Notice tone="info">Creating PDF…</Notice>}
      <Notice tone="info">Upload a CSV export from Excel. Direct .xlsx parsing is not supported in-browser.</Notice>
    </div>
  );
}

export function PdfToExcel() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const text = await extractPdfText(f);
      const rows = text.split(/\r?\n/).map((l) => l.split(/\s{2,}|\t|,/).map((c) => `"${c.replace(/"/g, '""')}"`).join(","));
      download(rows.join("\n"), f.name.replace(/\.pdf$/i, ".csv"), "text/csv");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF to export as CSV" />
      {busy && <Notice tone="info">Extracting…</Notice>}
      <Notice tone="info">Exports extracted text as CSV. Open in Excel or Google Sheets.</Notice>
    </div>
  );
}

export function EpubToPdf() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const htmlParts: string[] = [];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (!entry.dir && /\.(xhtml|html|htm)$/i.test(path)) {
          htmlParts.push(await entry.async("string"));
        }
      }
      const text = htmlParts
        .map((h) => new DOMParser().parseFromString(h, "text/html").body?.textContent ?? "")
        .join("\n\n")
        .replace(/\s+\n/g, "\n")
        .trim();
      const { exportBrandedPdf } = await import("@/lib/pdf-doc");
      await exportBrandedPdf({
        docType: "Ebook",
        title: f.name.replace(/\.epub$/i, "") || "Ebook",
        subtitle: "Converted from EPUB · Designer layout",
        sections: [{ heading: "Extracted text", body: text || "(No readable text found in EPUB)" }],
        footerLeft: "Mytulify · EPUB to PDF",
        filename: f.name.replace(/\.epub$/i, ".pdf"),
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept=".epub,application/epub+zip" onFiles={onFiles} label="Drop an EPUB ebook" />
      {busy && <Notice tone="info">Converting…</Notice>}
      <Notice tone="info">Text content is extracted and laid out as a branded PDF. Images and complex formatting may be omitted.</Notice>
    </div>
  );
}

export function CbzToPdf() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const images = Object.entries(zip.files)
        .filter(([p, e]) => !e.dir && /\.(jpe?g|png|webp|gif)$/i.test(p))
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
      if (!images.length) throw new Error("No images found in CBZ archive.");
      const doc = await PDFDocument.create();
      for (const [, entry] of images) {
        const buf = await entry.async("arraybuffer");
        const imgEl = await fileToImage(new File([buf], "page.jpg", { type: "image/jpeg" }));
        const c = document.createElement("canvas");
        c.width = imgEl.naturalWidth;
        c.height = imgEl.naturalHeight;
        c.getContext("2d")!.drawImage(imgEl, 0, 0);
        const png = await canvasToBlob(c, "image/png");
        const img = await doc.embedPng(await png.arrayBuffer());
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      await savePdf(doc, f.name.replace(/\.cbz$/i, ".pdf"));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept=".cbz,application/x-cbz,application/zip" onFiles={onFiles} label="Drop a CBZ comic archive" />
      {busy && <Notice tone="info">Building PDF…</Notice>}
    </div>
  );
}

export function PdfToCbz() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const doc = await loadPdf(f);
      const zip = new JSZip();
      for (let i = 1; i <= doc.getPageCount(); i++) {
        const canvas = await renderPdfPageToCanvas(f, i, 2);
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
        zip.file(`page-${String(i).padStart(3, "0")}.jpg`, blob);
      }
      download(await zip.generateAsync({ type: "blob" }), f.name.replace(/\.pdf$/i, ".cbz"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF to convert to CBZ" />
      {busy && <Notice tone="info">Rendering pages…</Notice>}
    </div>
  );
}

export function PdfToPdfA() {
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const src = await loadPdf(f);
      src.setTitle(f.name.replace(/\.pdf$/i, ""));
      src.setProducer("Mytulify PDF/A prep");
      src.setCreator("Mytulify");
      await savePdf(src, f.name.replace(/\.pdf$/i, "-pdfa.pdf"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF for archival export" />
      {busy && <Notice tone="info">Processing…</Notice>}
      <Notice tone="info">Re-saves with clean metadata for archiving. Full ISO PDF/A certification may still require desktop tools for complex files.</Notice>
    </div>
  );
}

export function BankStatementToExcel() {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      setText(await extractPdfText(f));
    } finally {
      setBusy(false);
    }
  };
  const exportCsv = () => {
    const rows = text.split(/\r?\n/).filter(Boolean).map((line) => {
      const m = line.match(/^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}|\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})\s+(.+?)\s+(-?\d[\d,]*\.?\d*)$/);
      if (m) return `"${m[1]}","${m[2].replace(/"/g, '""')}",${m[3].replace(/,/g, "")}`;
      return `"","","${line.replace(/"/g, '""')}"`;
    });
    download(["Date,Description,Amount", ...rows].join("\n"), "bank-statement.csv", "text/csv");
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a bank statement PDF" />
      {busy && <Notice tone="info">Extracting text…</Notice>}
      {text && (
        <>
          <Output value={text.slice(0, 8000)} rows={10} filename="statement.txt" mono={false} />
          <Button onClick={exportCsv}>Download as CSV for Excel</Button>
        </>
      )}
      <Notice tone="info">Works best on text-based PDF statements. Scanned PDFs may need OCR first.</Notice>
    </div>
  );
}

/* ------------------------------ GIF tools ---------------------------------- */
function useGifFile() {
  const [file, setFile] = React.useState<File | null>(null);
  const [meta, setMeta] = React.useState<{ width: number; height: number; frames: GifFrame[] } | null>(null);
  const [busy, setBusy] = React.useState(false);
  const load = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      setFile(f);
      setMeta(await decodeGifFile(f));
    } catch (e) {
      alert((e as Error).message);
      setFile(null);
      setMeta(null);
    } finally {
      setBusy(false);
    }
  };
  return { file, meta, busy, load, clear: () => { setFile(null); setMeta(null); } };
}

export function GifMaker() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [delay, setDelay] = React.useState(80);
  const [busy, setBusy] = React.useState(false);
  const make = async () => {
    if (!files.length) return;
    setBusy(true);
    try {
      const frames: GifFrame[] = [];
      let w = 0;
      let h = 0;
      for (const f of files) {
        const img = await fileToImage(f);
        w = Math.max(w, img.naturalWidth);
        h = Math.max(h, img.naturalHeight);
      }
      for (const f of files) {
        const img = await fileToImage(f);
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, (w - img.naturalWidth) / 2, (h - img.naturalHeight) / 2);
        frames.push({ rgba: new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data), width: w, height: h, delay });
      }
      download(encodeGifFrames(frames), "animation.gif");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="image/*" multiple onFiles={setFiles} label="Drop images in animation order" />
      <Field label="Frame delay (cs)"><Input type="number" value={delay} onChange={(e) => setDelay(+e.target.value)} /></Field>
      {files.length > 0 && <Notice tone="info">{files.length} image(s) selected</Notice>}
      <Button onClick={make} disabled={!files.length || busy}>{busy ? "Building…" : "Create GIF"}</Button>
    </div>
  );
}

export function GifResizer() {
  const { file, meta, busy, load } = useGifFile();
  const [w, setW] = React.useState(320);
  const resize = async () => {
    if (!meta || !file) return;
    const ratio = w / meta.width;
    const nh = Math.round(meta.height * ratio);
    const frames = meta.frames.map((f) => {
      const src = frameToCanvas(f);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = nh;
      c.getContext("2d")!.drawImage(src, 0, 0, w, nh);
      return { rgba: new Uint8ClampedArray(c.getContext("2d")!.getImageData(0, 0, w, nh).data), width: w, height: nh, delay: f.delay };
    });
    download(encodeGifFrames(frames), file.name.replace(/\.gif$/i, "-resized.gif"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop an animated GIF" />;
  return (
    <div className="space-y-4">
      {busy && <Notice tone="info">Loading…</Notice>}
      {meta && (
        <>
          <Notice tone="info">{file.name} · {meta.frames.length} frames · {meta.width}×{meta.height}</Notice>
          <Field label="New width (px)"><Input type="number" value={w} onChange={(e) => setW(+e.target.value)} /></Field>
          <Button onClick={resize}>Download resized GIF</Button>
        </>
      )}
    </div>
  );
}

export function GifRotator() {
  const { file, meta, busy, load } = useGifFile();
  const [deg, setDeg] = React.useState(90);
  const rotate = async () => {
    if (!meta || !file) return;
    const rad = (deg * Math.PI) / 180;
    const frames = meta.frames.map((f) => {
      const src = frameToCanvas(f);
      const c = document.createElement("canvas");
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      c.width = Math.round(f.width * cos + f.height * sin);
      c.height = Math.round(f.width * sin + f.height * cos);
      const ctx = c.getContext("2d")!;
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(src, -f.width / 2, -f.height / 2);
      return { rgba: new Uint8ClampedArray(ctx.getImageData(0, 0, c.width, c.height).data), width: c.width, height: c.height, delay: f.delay };
    });
    download(encodeGifFrames(frames), file.name.replace(/\.gif$/i, "-rotated.gif"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop an animated GIF" />;
  return (
    <div className="space-y-4">
      {busy && <Notice tone="info">Loading…</Notice>}
      {meta && (
        <>
          <Field label="Rotation (degrees)">
            <Select value={String(deg)} onChange={(e) => setDeg(+e.target.value)}>
              <option value="90">90°</option>
              <option value="180">180°</option>
              <option value="270">270°</option>
            </Select>
          </Field>
          <Button onClick={rotate}>Download rotated GIF</Button>
        </>
      )}
    </div>
  );
}

export function GifTrimmer() {
  const { file, meta, busy, load } = useGifFile();
  const [start, setStart] = React.useState(1);
  const [end, setEnd] = React.useState(1);
  React.useEffect(() => {
    if (meta) setEnd(meta.frames.length);
  }, [meta]);
  const trim = () => {
    if (!meta || !file) return;
    const s = Math.max(1, start) - 1;
    const e = Math.min(meta.frames.length, end);
    download(encodeGifFrames(meta.frames.slice(s, e)), file.name.replace(/\.gif$/i, "-trimmed.gif"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop an animated GIF" />;
  return (
    <div className="space-y-4">
      {meta && (
        <>
          <Notice tone="info">{meta.frames.length} frames total</Notice>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start frame"><Input type="number" min={1} max={meta.frames.length} value={start} onChange={(e) => setStart(+e.target.value)} /></Field>
            <Field label="End frame"><Input type="number" min={1} max={meta.frames.length} value={end} onChange={(e) => setEnd(+e.target.value)} /></Field>
          </div>
          <Button onClick={trim}>Download trimmed GIF</Button>
        </>
      )}
      {busy && <Notice tone="info">Loading…</Notice>}
    </div>
  );
}

export function GifOptimizer() {
  const { file, meta, busy, load } = useGifFile();
  const [scale, setScale] = React.useState(100);
  const [colors, setColors] = React.useState(128);
  const run = async () => {
    if (!meta || !file) return;
    const factor = scale / 100;
    const frames = meta.frames.map((f) => {
      const src = frameToCanvas(f);
      const w = Math.max(1, Math.round(f.width * factor));
      const h = Math.max(1, Math.round(f.height * factor));
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(src, 0, 0, w, h);
      const rgba = c.getContext("2d")!.getImageData(0, 0, w, h).data;
      const palette = quantize(rgba, colors);
      const indexed = applyPalette(rgba, palette);
      const out = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < indexed.length; i++) {
        const p = palette[indexed[i]];
        out[i * 4] = p[0];
        out[i * 4 + 1] = p[1];
        out[i * 4 + 2] = p[2];
        out[i * 4 + 3] = 255;
      }
      return { rgba: out, width: w, height: h, delay: f.delay };
    });
    download(encodeGifFrames(frames), file.name.replace(/\.gif$/i, "-optimized.gif"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop an animated GIF" />;
  return (
    <div className="space-y-4">
      {meta && (
        <>
          <Notice tone="info">Original size: {formatBytes(file.size)}</Notice>
          <Field label="Scale (%)"><Input type="number" value={scale} onChange={(e) => setScale(+e.target.value)} /></Field>
          <Field label="Max colors"><Input type="number" min={2} max={256} value={colors} onChange={(e) => setColors(+e.target.value)} /></Field>
          <Button onClick={run}>Download optimized GIF</Button>
        </>
      )}
      {busy && <Notice tone="info">Loading…</Notice>}
    </div>
  );
}

export function GifToPng() {
  const { file, meta, busy, load } = useGifFile();
  const run = async () => {
    if (!meta || !file) return;
    const entries = await Promise.all(
      meta.frames.map(async (f, i) => ({
        name: `frame-${String(i + 1).padStart(3, "0")}.png`,
        blob: await canvasToBlob(frameToCanvas(f), "image/png"),
      })),
    );
    await zipBlobs(entries, file.name.replace(/\.gif$/i, "-frames.zip"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop a GIF" />;
  return (
    <div className="space-y-4">
      {meta && <Button onClick={run}>Download {meta.frames.length} PNG frames (ZIP)</Button>}
      {busy && <Notice tone="info">Loading…</Notice>}
    </div>
  );
}

export function GifToJpg() {
  const { file, meta, busy, load } = useGifFile();
  const run = async () => {
    if (!meta || !file) return;
    const blobs = await Promise.all(
      meta.frames.map(async (f, i) => ({
        name: `frame-${String(i + 1).padStart(3, "0")}.jpg`,
        blob: await canvasToBlob(frameToCanvas(f), "image/jpeg", 0.92),
      })),
    );
    await zipBlobs(blobs, file.name.replace(/\.gif$/i, "-frames.zip"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop a GIF" />;
  return (
    <div className="space-y-4">
      {meta && <Button onClick={run}>Download {meta.frames.length} JPG frames (ZIP)</Button>}
      {busy && <Notice tone="info">Loading…</Notice>}
    </div>
  );
}

export function GifToWebp() {
  const { file, meta, busy, load } = useGifFile();
  const run = async () => {
    if (!meta || !file) return;
    const blobs = await Promise.all(
      meta.frames.map(async (f, i) => ({
        name: `frame-${String(i + 1).padStart(3, "0")}.webp`,
        blob: await canvasToBlob(frameToCanvas(f), "image/webp", 0.9),
      })),
    );
    await zipBlobs(blobs, file.name.replace(/\.gif$/i, "-frames.zip"));
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop a GIF" />;
  return (
    <div className="space-y-4">
      {meta && <Button onClick={run}>Download {meta.frames.length} WebP frames (ZIP)</Button>}
      {busy && <Notice tone="info">Loading…</Notice>}
      <Notice tone="info">Animated WebP export is not supported — each frame is saved separately.</Notice>
    </div>
  );
}

export function GifToVideo() {
  const { file, meta, busy, load } = useGifFile();
  const [msg, setMsg] = React.useState("");
  const run = async () => {
    if (!meta || !file) return;
    setMsg("Recording…");
    const canvas = document.createElement("canvas");
    canvas.width = meta.width;
    canvas.height = meta.height;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(10);
    const rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.start();
    for (const f of meta.frames) {
      ctx.putImageData(new ImageData(new Uint8ClampedArray(f.rgba), f.width, f.height), 0, 0);
      await new Promise((r) => setTimeout(r, Math.max(20, f.delay * 10)));
    }
    rec.stop();
    await new Promise<void>((r) => { rec.onstop = () => r(); });
    download(new Blob(chunks, { type: "video/webm" }), file.name.replace(/\.gif$/i, ".webm"));
    setMsg("");
  };
  if (!file) return <FileDrop accept="image/gif,.gif" onFiles={load} label="Drop a GIF" />;
  return (
    <div className="space-y-4">
      {meta && <Button onClick={run}>Download WebM video</Button>}
      {msg && <Notice tone="info">{msg}</Notice>}
      {busy && <Notice tone="info">Loading…</Notice>}
    </div>
  );
}

/* ------------------------------ Calculators -------------------------------- */
function jalaliToGregorian(jy: number, jm: number, jd: number) {
  const salA = jy > 979 ? 979 : 0;
  const gy = jy + 621 - salA;
  const days =
    365 * gy +
    Math.floor(gy / 4) -
    Math.floor(gy / 100) +
    Math.floor(gy / 400) -
    80 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  let gd = days + 79;
  const gy2 = 1600 + 400 * Math.floor(gd / 146097);
  gd %= 146097;
  const leap = gd >= 36525 ? 1 : 0;
  gd -= 36525 * leap + 365 * Math.floor(gd / 365);
  const gm = 1 + Math.floor(gd / 30.6001);
  const gDay = 1 + Math.floor(gd % 30.6001);
  return { gy: gy2 + leap, gm, gd: gDay };
}

function gregorianToJalali(gy: number, gm: number, gd: number) {
  const gDaysInMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy > 1600 ? 979 : 0;
  gy -= gy > 1600 ? 1600 : 621;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gDaysInMonth[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function AfghanDateConverter() {
  const [mode, setMode] = React.useState<"sh-to-g" | "g-to-sh">("sh-to-g");
  const [y, setY] = React.useState("1403");
  const [m, setM] = React.useState("1");
  const [d, setD] = React.useState("1");
  let result = "";
  if (mode === "sh-to-g") {
    const g = jalaliToGregorian(+y, +m, +d);
    result = `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
  } else {
    const j = gregorianToJalali(+y, +m, +d);
    result = `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")} (Shamsi)`;
  }
  return (
    <div className="space-y-4">
      <Select value={mode} onChange={(e) => setMode(e.target.value as "sh-to-g")} className="max-w-xs">
        <option value="sh-to-g">Shamsi (Solar Hijri) → Gregorian</option>
        <option value="g-to-sh">Gregorian → Shamsi</option>
      </Select>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Year"><Input value={y} onChange={(e) => setY(e.target.value)} /></Field>
        <Field label="Month"><Input value={m} onChange={(e) => setM(e.target.value)} /></Field>
        <Field label="Day"><Input value={d} onChange={(e) => setD(e.target.value)} /></Field>
      </div>
      <Stat label="Converted date" value={result} />
    </div>
  );
}

export function ZakatCalculator() {
  const [goldG, setGoldG] = React.useState("0");
  const [goldPrice, setGoldPrice] = React.useState("70");
  const [silverG, setSilverG] = React.useState("0");
  const [silverPrice, setSilverPrice] = React.useState("0.8");
  const [cash, setCash] = React.useState("0");
  const goldVal = +goldG * +goldPrice;
  const silverVal = +silverG * +silverPrice;
  const total = goldVal + silverVal + +cash;
  const nisabGold = 87.48 * +goldPrice;
  const nisabSilver = 612.36 * +silverPrice;
  const nisab = Math.min(nisabGold, nisabSilver);
  const due = total >= nisab ? total * 0.025 : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Gold (grams)"><Input type="number" value={goldG} onChange={(e) => setGoldG(e.target.value)} /></Field>
        <Field label="Gold price / gram"><Input type="number" value={goldPrice} onChange={(e) => setGoldPrice(e.target.value)} /></Field>
        <Field label="Silver (grams)"><Input type="number" value={silverG} onChange={(e) => setSilverG(e.target.value)} /></Field>
        <Field label="Silver price / gram"><Input type="number" value={silverPrice} onChange={(e) => setSilverPrice(e.target.value)} /></Field>
        <Field label="Cash & savings"><Input type="number" value={cash} onChange={(e) => setCash(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Total wealth" value={total.toFixed(2)} />
        <Stat label="Nisab threshold" value={nisab.toFixed(2)} />
        <Stat label="Zakat due (2.5%)" value={due.toFixed(2)} />
      </div>
      <Notice tone="info">Uses common nisab references (87.48g gold / 612.36g silver). Consult a scholar for your situation.</Notice>
    </div>
  );
}

export function TasbihCounter() {
  const [count, setCount] = React.useState(0);
  const [target, setTarget] = React.useState(33);
  return (
    <div className="space-y-4 text-center">
      <Field label="Target count"><Input type="number" className="mx-auto max-w-xs" value={target} onChange={(e) => setTarget(+e.target.value)} /></Field>
      <p className="text-5xl font-bold tabular-nums">{count}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => setCount((c) => c + 1)}>+1</Button>
        <Button variant="outline" onClick={() => setCount(0)}>Reset</Button>
      </div>
      {count >= target && target > 0 && <Notice tone="info">Target reached — Alhamdulillah</Notice>}
    </div>
  );
}

export function SalaryTaxCalculator() {
  const [salary, setSalary] = React.useState("50000");
  const [rate, setRate] = React.useState("15");
  const gross = +salary;
  const tax = gross * (+rate / 100);
  const net = gross - tax;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Annual gross salary"><Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} /></Field>
        <Field label="Effective tax rate (%)"><Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Gross" value={gross.toFixed(2)} />
        <Stat label="Estimated tax" value={tax.toFixed(2)} />
        <Stat label="Net (approx.)" value={net.toFixed(2)} />
      </div>
      <Notice tone="info">Simple flat-rate estimate. Enter your local effective rate for a closer approximation.</Notice>
    </div>
  );
}
