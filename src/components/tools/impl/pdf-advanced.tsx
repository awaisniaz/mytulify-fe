"use client";

import * as React from "react";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import mammoth from "mammoth";
import { toPng } from "html-to-image";
import { Input, Button, Select } from "@/components/ui/primitives";
import { FileDrop, Field, Notice, Output } from "@/components/tools/shared";
import { download } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { extractPdfText, renderPdfPageToCanvas } from "@/lib/pdfjs";

function usePdfFile() {
  const [file, setFile] = React.useState<File | null>(null);
  const [pages, setPages] = React.useState(0);
  const [error, setError] = React.useState("");
  const onFiles = React.useCallback(async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setError("");
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      setFile(f);
      setPages(doc.getPageCount());
    } catch (e) {
      setFile(null);
      setPages(0);
      setError((e as Error).message || "Could not read this PDF.");
    }
  }, []);
  return { file, pages, error, onFiles, clear: () => { setFile(null); setPages(0); setError(""); } };
}

function PdfDrop({ label, onFiles, error }: { label: string; onFiles: (f: File[]) => void; error?: string }) {
  return (
    <div className="space-y-4">
      <FileDrop accept="application/pdf" onFiles={onFiles} label={label} />
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

async function savePdf(doc: PDFDocument, name: string) {
  download(new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" }), name);
}

async function loadDoc(file: File) {
  return PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
}

/* ------------------------------ Organize PDF ------------------------------- */
export function OrganizePdf() {
  const { file, pages, error, onFiles, clear } = usePdfFile();
  const [order, setOrder] = React.useState<number[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (pages > 0) setOrder(Array.from({ length: pages }, (_, i) => i));
  }, [pages]);

  const move = (idx: number, dir: -1 | 1) => {
    setOrder((o) => {
      const n = [...o];
      const j = idx + dir;
      if (j < 0 || j >= n.length) return n;
      [n[idx], n[j]] = [n[j], n[idx]];
      return n;
    });
  };

  const exportPdf = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await loadDoc(file);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, order);
      copied.forEach((p) => out.addPage(p));
      await savePdf(out, file.name.replace(/\.pdf$/i, "-organized.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to reorder pages" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">{file.name} · {pages} pages — use arrows to reorder</Notice>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setOrder((o) => [...o].reverse())}>Reverse</Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOrder(Array.from({ length: pages }, (_, i) => i))}>Reset order</Button>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {order.map((pg, i) => (
          <div key={`${pg}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
            <span className="flex-1">Page {pg + 1}</span>
            <button type="button" onClick={() => move(i, -1)} className="px-2 text-muted hover:text-foreground">↑</button>
            <button type="button" onClick={() => move(i, 1)} className="px-2 text-muted hover:text-foreground">↓</button>
            <button type="button" onClick={() => setOrder((o) => o.filter((_, j) => j !== i))} className="px-2 text-rose-500">✕</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={exportPdf} disabled={busy || order.length === 0}>{busy ? "Saving…" : "Download reordered PDF"}</Button>
        <Button variant="outline" onClick={clear}>Upload another</Button>
      </div>
    </div>
  );
}

/* ------------------------------ Split in half ------------------------------ */
export function SplitPdfInHalf() {
  const { file, pages, error, onFiles } = usePdfFile();
  const [busy, setBusy] = React.useState(false);
  const [at, setAt] = React.useState("");

  const split = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await loadDoc(file);
      const mid = Math.min(src.getPageCount() - 1, Math.max(1, parseInt(at, 10) || Math.ceil(src.getPageCount() / 2)));
      for (const [label, indices] of [["part1", src.getPageIndices().slice(0, mid)], ["part2", src.getPageIndices().slice(mid)]] as const) {
        if (!indices.length) continue;
        const out = await PDFDocument.create();
        const copied = await out.copyPages(src, [...indices]);
        copied.forEach((p) => out.addPage(p));
        await savePdf(out, file.name.replace(/\.pdf$/i, `-${label}.pdf`));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to split in half" onFiles={onFiles} error={error} />;
  const mid = parseInt(at, 10) || Math.ceil(pages / 2);
  return (
    <div className="space-y-4">
      <Notice tone="info">{file.name} · {pages} pages → first file pages 1–{mid}, second {mid + 1}–{pages}</Notice>
      <Field label="Split after page"><Input type="number" min={1} max={Math.max(1, pages - 1)} value={at || String(Math.ceil(pages / 2))} onChange={(e) => setAt(e.target.value)} className="max-w-40" /></Field>
      <Button onClick={split} disabled={busy}>{busy ? "Splitting…" : "Download both parts"}</Button>
    </div>
  );
}

/* ------------------------------ Resize PDF --------------------------------- */
export function ResizePdf() {
  const { file, onFiles, error } = usePdfFile();
  const [scale, setScale] = React.useState(100);
  const [paper, setPaper] = React.useState("scale");
  const [busy, setBusy] = React.useState(false);
  const papers: Record<string, [number, number]> = {
    A4: [595.28, 841.89],
    Letter: [612, 792],
    Legal: [612, 1008],
    A5: [419.53, 595.28],
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      if (paper !== "scale" && papers[paper]) {
        const [tw, th] = papers[paper];
        doc.getPages().forEach((p) => {
          const { width, height } = p.getSize();
          p.scale(tw / width, th / height);
          p.setSize(tw, th);
        });
      } else {
        const factor = scale / 100;
        doc.getPages().forEach((p) => {
          const { width, height } = p.getSize();
          p.scale(factor, factor);
          p.setSize(width * factor, height * factor);
        });
      }
      await savePdf(doc, file.name.replace(/\.pdf$/i, paper === "scale" ? `-resized-${scale}pct.pdf` : `-${paper.toLowerCase()}.pdf`));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to resize" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Field label="Target">
        <Select value={paper} onChange={(e) => setPaper(e.target.value)}>
          <option value="scale">Custom scale</option>
          <option value="A4">A4</option>
          <option value="Letter">US Letter</option>
          <option value="Legal">US Legal</option>
          <option value="A5">A5</option>
        </Select>
      </Field>
      {paper === "scale" && (
        <Field label={`Scale: ${scale}%`}>
          <input type="range" min={25} max={200} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      )}
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Resize & download"}</Button>
    </div>
  );
}

/* ------------------------------ Crop PDF ----------------------------------- */
export function CropPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [linked, setLinked] = React.useState(true);
  const [top, setTop] = React.useState(10);
  const [right, setRight] = React.useState(10);
  const [bottom, setBottom] = React.useState(10);
  const [left, setLeft] = React.useState(10);
  const [busy, setBusy] = React.useState(false);

  const setAll = (v: number) => { setTop(v); setRight(v); setBottom(v); setLeft(v); };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      doc.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        const t = height * (top / 100);
        const r = width * (right / 100);
        const b = height * (bottom / 100);
        const l = width * (left / 100);
        const w = Math.max(1, width - l - r);
        const h = Math.max(1, height - t - b);
        p.setCropBox(l, b, w, h);
        p.setMediaBox(l, b, w, h);
      });
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-cropped.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to crop margins" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} /> Same margin on all sides</label>
      {linked ? (
        <Field label={`Crop margin: ${top}% per side`}>
          <input type="range" min={0} max={40} value={top} onChange={(e) => setAll(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {([["Top", top, setTop], ["Right", right, setRight], ["Bottom", bottom, setBottom], ["Left", left, setLeft]] as const).map(([label, val, set]) => (
            <Field key={label} label={`${label}: ${val}%`}>
              <input type="range" min={0} max={40} value={val} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--brand)]" />
            </Field>
          ))}
        </div>
      )}
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Crop & download"}</Button>
    </div>
  );
}

/* ------------------------------ Sign PDF ----------------------------------- */
export { SignPdf } from "@/components/tools/impl/sign-pdf";

/* ------------------------------ Edit PDF (add text) ------------------------ */
export function EditPdf() {
  const { file, pages, onFiles, error } = usePdfFile();
  const [text, setText] = React.useState(`Edited with ${brand.name}`);
  const [page, setPage] = React.useState(1);
  const [pos, setPos] = React.useState("bl");
  const [size, setSize] = React.useState(14);
  const [color, setColor] = React.useState("#1e3a8a");
  const [all, setAll] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file || !text) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const hex = color.replace("#", "");
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const targets = all ? doc.getPages() : [doc.getPage(Math.min(page, doc.getPageCount()) - 1)];
      targets.forEach((p) => {
        const { width, height } = p.getSize();
        const pad = 36;
        const x = pos === "br" || pos === "tr" ? width - pad - text.length * size * 0.45 : pos === "c" ? width / 2 - text.length * size * 0.22 : pad;
        const y = pos === "tl" || pos === "tr" ? height - pad : pos === "c" ? height / 2 : pad;
        p.drawText(text, { x: Math.max(12, x), y, size, font, color: rgb(r, g, b) });
      });
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-edited.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to add text" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">{file.name} · {pages} pages</Notice>
      <Field label="Text to add"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Page"><Input type="number" min={1} max={pages} value={page} onChange={(e) => setPage(+e.target.value)} disabled={all} /></Field>
        <Field label="Position">
          <Select value={pos} onChange={(e) => setPos(e.target.value)}>
            <option value="bl">Bottom left</option>
            <option value="br">Bottom right</option>
            <option value="tl">Top left</option>
            <option value="tr">Top right</option>
            <option value="c">Center</option>
          </Select>
        </Field>
        <Field label={`Size ${size}`}><input type="range" min={8} max={48} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
        <Field label="Color"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} /> Add on every page</label>
      <Button onClick={run} disabled={busy}>{busy ? "Saving…" : "Add text & download"}</Button>
    </div>
  );
}

/* ------------------------------ Fill PDF form ------------------------------ */
export function FillPdfForm() {
  const { file, onFiles, clear, error } = usePdfFile();
  const [fields, setFields] = React.useState<{ name: string; value: string }[]>([]);
  const [flatten, setFlatten] = React.useState(true);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!file) return;
      try {
        const doc = await loadDoc(file);
        const form = doc.getForm();
        setFields(form.getFields().map((f) => ({ name: f.getName(), value: "" })));
      } catch {
        setFields([]);
      }
    })();
  }, [file]);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const form = doc.getForm();
      for (const { name, value } of fields) {
        try {
          form.getTextField(name).setText(value);
        } catch { /* skip non-text fields */ }
      }
      if (flatten) form.flatten();
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-filled.pdf"));
    } catch (e) {
      alert("Could not fill form: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF with form fields" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <Notice tone="info">No fillable text fields found in this PDF.</Notice>
      ) : (
        fields.map((f, i) => (
          <Field key={f.name} label={f.name}>
            <Input value={f.value} onChange={(e) => setFields((prev) => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
          </Field>
        ))
      )}
      {fields.length > 0 && (
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} /> Flatten fields (not editable after save)</label>
      )}
      <div className="flex gap-2">
        {fields.length > 0 && <Button onClick={run} disabled={busy}>{busy ? "Filling…" : "Fill & download"}</Button>}
        <Button variant="outline" onClick={clear}>Upload another</Button>
      </div>
    </div>
  );
}

/* ------------------------------ Protect / Unlock --------------------------- */
export function ProtectPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [password, setPassword] = React.useState("CONFIDENTIAL");
  const [opacity, setOpacity] = React.useState(15);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const label = password || "PROTECTED";
      doc.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        p.drawText(`LOCKED: ${label}`, {
          x: width / 2 - 60, y: height / 2, size: 24, font, color: rgb(0.8, 0.2, 0.2), opacity: opacity / 100, rotate: degrees(30),
        });
      });
      doc.setTitle("Protected document");
      doc.setSubject(label);
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-protected.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">Browsers cannot apply real PDF password encryption. This stamps a visible watermark and metadata. Use desktop software for true encryption.</Notice>
      <Field label="Protection label (watermark)"><Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="CONFIDENTIAL" /></Field>
      <Field label={`Watermark opacity ${opacity}%`}><input type="range" min={5} max={50} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Apply watermark & download"}</Button>
    </div>
  );
}

export function UnlockPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const [password, setPassword] = React.useState("");

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-unlocked.pdf"));
      setMsg("PDF re-saved without encryption metadata. If the original had a password, it may still be required.");
    } catch (e) {
      setMsg("Could not unlock: " + (e as Error).message + " — password-protected PDFs need the password in desktop software.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a password-protected PDF" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">Attempts to re-save PDFs without encryption. Works for some restriction-only PDFs; password-locked files may fail.</Notice>
      <Field label="Password (optional, if you know it)"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to try ignore-encryption" /></Field>
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Try unlock & download"}</Button>
      {msg && <Notice tone="info">{msg}</Notice>}
    </div>
  );
}

/* ------------------------------ PDF → images ------------------------------- */
function PdfToImages({ format }: { format: "jpeg" | "png" }) {
  const { file, pages, error, onFiles } = usePdfFile();
  const [busy, setBusy] = React.useState(false);
  const [scale, setScale] = React.useState(2);
  const [quality, setQuality] = React.useState(92);
  const [from, setFrom] = React.useState("1");
  const [to, setTo] = React.useState("");

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const start = Math.max(1, parseInt(from, 10) || 1);
      const end = Math.min(pages, parseInt(to, 10) || pages);
      for (let i = start; i <= end; i++) {
        const canvas = await renderPdfPageToCanvas(file, i, scale);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), `image/${format}`, format === "jpeg" ? quality / 100 : undefined));
        download(blob, `${file.name.replace(/\.pdf$/i, "")}-page-${i}.${format === "jpeg" ? "jpg" : "png"}`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label={`Drop a PDF to convert to ${format.toUpperCase()}`} onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">{file.name} · {pages} page(s)</Notice>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="From page"><Input type="number" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To page"><Input type="number" value={to || String(pages)} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label={`Scale ${scale}×`}><input type="range" min={1} max={3} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
        {format === "jpeg" && <Field label={`JPEG ${quality}%`}><input type="range" min={40} max={100} value={quality} onChange={(e) => setQuality(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>}
      </div>
      <Button onClick={run} disabled={busy}>{busy ? "Converting…" : `Download pages as ${format.toUpperCase()}`}</Button>
    </div>
  );
}

export const PdfToJpg = () => <PdfToImages format="jpeg" />;
export const PdfToPng = () => <PdfToImages format="png" />;

export function ExtractImagesFromPdf() {
  const { file, pages, error, onFiles } = usePdfFile();
  const [busy, setBusy] = React.useState(false);
  const [scale, setScale] = React.useState(2);
  const [from, setFrom] = React.useState("1");
  const [to, setTo] = React.useState("");

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const start = Math.max(1, parseInt(from, 10) || 1);
      const end = Math.min(pages, parseInt(to, 10) || pages);
      for (let i = start; i <= end; i++) {
        const canvas = await renderPdfPageToCanvas(file, i, scale);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        download(blob, `${file.name.replace(/\.pdf$/i, "")}-page-${i}.png`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to extract pages as images" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">{file.name} · {pages} page(s) — each page exported as PNG.</Notice>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="From page"><Input type="number" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To page"><Input type="number" value={to || String(pages)} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label={`Scale ${scale}×`}><input type="range" min={1} max={3} step={0.5} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      </div>
      <Button onClick={run} disabled={busy}>{busy ? "Extracting…" : "Download page images"}</Button>
    </div>
  );
}

/* ------------------------------ Extract text ------------------------------- */
export function ExtractTextFromPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!file) { setText(""); return; }
    let cancelled = false;
    setBusy(true);
    extractPdfText(file).then((t) => { if (!cancelled) setText(t); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [file]);

  if (!file) return <PdfDrop label="Drop a PDF to extract text" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      {busy && <Notice tone="info">Extracting…</Notice>}
      {text && <Output value={text} rows={12} filename="extracted.txt" mono={false} />}
      {!busy && !text && <Notice tone="info">No selectable text found (may be a scanned image PDF).</Notice>}
    </div>
  );
}

/* ------------------------------ PDF ↔ Word --------------------------------- */
export function PdfToWord() {
  const { file, onFiles, error } = usePdfFile();
  const [busy, setBusy] = React.useState(false);
  const [text, setText] = React.useState("");

  React.useEffect(() => {
    if (!file) { setText(""); return; }
    let cancelled = false;
    setBusy(true);
    extractPdfText(file).then((t) => { if (!cancelled) setText(t); }).finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [file]);

  const run = () => {
    if (!file || !text) return;
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><pre style='font-family:Calibri,sans-serif;white-space:pre-wrap'>${text.replace(/</g, "&lt;")}</pre></body></html>`;
    download(html, file.name.replace(/\.pdf$/i, ".doc"), "application/msword");
  };

  if (!file) return <PdfDrop label="Drop a PDF to convert to Word (.doc)" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">Exports extracted text as a .doc file. Layout and images are not preserved.</Notice>
      {busy && <Notice tone="info">Extracting text…</Notice>}
      {text && <Output value={text} rows={8} filename="from-pdf.txt" mono={false} />}
      <Button onClick={run} disabled={busy || !text}>{busy ? "Converting…" : "Download as .doc"}</Button>
    </div>
  );
}

export function WordToPdf() {
  const [busy, setBusy] = React.useState(false);
  const [htmlOut, setHtmlOut] = React.useState("");

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
      setHtmlOut(html);
      const wrap = document.createElement("div");
      wrap.innerHTML = html;
      wrap.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;padding:40px;font-family:Georgia,serif;font-size:14px;line-height:1.6;background:#fff;color:#000";
      document.body.appendChild(wrap);
      const dataUrl = await toPng(wrap, { pixelRatio: 2, cacheBust: true });
      document.body.removeChild(wrap);
      const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
      const doc = await PDFDocument.create();
      const img = await doc.embedPng(imgBytes);
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      await savePdf(doc, f.name.replace(/\.docx$/i, ".pdf"));
    } catch (e) {
      alert("Could not convert: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <FileDrop accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onFiles={onFiles} label="Drop a .docx file" />
      {busy && <Notice tone="info">Converting…</Notice>}
      {htmlOut && <Output value={htmlOut} rows={8} filename="from-word.html" mime="text/html" />}
      <Notice tone="info">Converts document content to a PDF image. Also offers the HTML preview for copy. Complex layouts may differ.</Notice>
    </div>
  );
}
