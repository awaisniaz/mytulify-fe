"use client";

import * as React from "react";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import mammoth from "mammoth";
import { toPng } from "html-to-image";
import { Input, Button } from "@/components/ui/primitives";
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
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {order.map((pg, i) => (
          <div key={`${pg}-${i}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
            <span className="flex-1">Page {pg + 1}</span>
            <button type="button" onClick={() => move(i, -1)} className="px-2 text-muted hover:text-foreground">↑</button>
            <button type="button" onClick={() => move(i, 1)} className="px-2 text-muted hover:text-foreground">↓</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={exportPdf} disabled={busy}>{busy ? "Saving…" : "Download reordered PDF"}</Button>
        <Button variant="outline" onClick={clear}>Upload another</Button>
      </div>
    </div>
  );
}

/* ------------------------------ Split in half ------------------------------ */
export function SplitPdfInHalf() {
  const { file, pages, error, onFiles } = usePdfFile();
  const [busy, setBusy] = React.useState(false);

  const split = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const src = await loadDoc(file);
      const mid = Math.ceil(src.getPageCount() / 2);
      for (const [label, indices] of [["part1", src.getPageIndices().slice(0, mid)], ["part2", src.getPageIndices().slice(mid)]] as const) {
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
  return (
    <div className="space-y-4">
      <Notice tone="info">{file.name} · {pages} pages → split at page {Math.ceil(pages / 2)}</Notice>
      <Button onClick={split} disabled={busy}>{busy ? "Splitting…" : "Download both halves"}</Button>
    </div>
  );
}

/* ------------------------------ Resize PDF --------------------------------- */
export function ResizePdf() {
  const { file, onFiles, error } = usePdfFile();
  const [scale, setScale] = React.useState(100);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const factor = scale / 100;
      doc.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        p.scale(factor, factor);
        p.setSize(width * factor, height * factor);
      });
      await savePdf(doc, file.name.replace(/\.pdf$/i, `-resized-${scale}pct.pdf`));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to resize" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Field label={`Scale: ${scale}%`}>
        <input type="range" min={25} max={200} value={scale} onChange={(e) => setScale(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Resize & download"}</Button>
    </div>
  );
}

/* ------------------------------ Crop PDF ----------------------------------- */
export function CropPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [margin, setMargin] = React.useState(10);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const pct = margin / 100;
      doc.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        const mx = width * pct;
        const my = height * pct;
        const w = width - mx * 2;
        const h = height - my * 2;
        p.setCropBox(mx, my, w, h);
        p.setMediaBox(mx, my, w, h);
      });
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-cropped.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to crop margins" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Field label={`Crop margin: ${margin}% per side`}>
        <input type="range" min={1} max={40} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Crop & download"}</Button>
    </div>
  );
}

/* ------------------------------ Sign PDF ----------------------------------- */
export function SignPdf() {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [sigFile, setSigFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!pdfFile || !sigFile) return;
    setBusy(true);
    try {
      const doc = await loadDoc(pdfFile);
      const sigBytes = await sigFile.arrayBuffer();
      const sig = /jpe?g$/i.test(sigFile.type)
        ? await doc.embedJpg(sigBytes)
        : await doc.embedPng(sigBytes);
      const page = doc.getPage(doc.getPageCount() - 1);
      const { width } = page.getSize();
      const sw = 160;
      const sh = (sig.height / sig.width) * sw;
      page.drawImage(sig, { x: width - sw - 40, y: 40, width: sw, height: sh });
      await savePdf(doc, pdfFile.name.replace(/\.pdf$/i, "-signed.pdf"));
    } catch (e) {
      alert("Could not sign PDF: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {!pdfFile ? (
        <FileDrop accept="application/pdf" onFiles={(f) => setPdfFile(f[0] ?? null)} label="Step 1: Drop PDF" />
      ) : !sigFile ? (
        <>
          <Notice tone="success">PDF: {pdfFile.name}</Notice>
          <FileDrop accept="image/png,image/jpeg" onFiles={(f) => setSigFile(f[0] ?? null)} label="Step 2: Drop signature image (PNG/JPG)" />
        </>
      ) : (
        <>
          <Notice tone="info">Signature will be placed on the last page (bottom-right).</Notice>
          <Button onClick={run} disabled={busy}>{busy ? "Signing…" : "Sign & download"}</Button>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Edit PDF (add text) ------------------------ */
export function EditPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [text, setText] = React.useState(`Edited with ${brand.name}`);
  const [page, setPage] = React.useState(1);
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file || !text) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const p = doc.getPage(Math.min(page, doc.getPageCount()) - 1);
      p.drawText(text, { x: 50, y: 50, size: 14, font, color: rgb(0, 0, 0.8) });
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-edited.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to add text" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Field label="Text to add"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <Field label="Page number"><Input type="number" min={1} value={page} onChange={(e) => setPage(+e.target.value)} className="w-32" /></Field>
      <Button onClick={run} disabled={busy}>{busy ? "Saving…" : "Add text & download"}</Button>
    </div>
  );
}

/* ------------------------------ Fill PDF form ------------------------------ */
export function FillPdfForm() {
  const { file, onFiles, clear, error } = usePdfFile();
  const [fields, setFields] = React.useState<{ name: string; value: string }[]>([]);
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
      form.flatten();
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
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const doc = await loadDoc(file);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      doc.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        p.drawText(`LOCKED: ${password || "PROTECTED"}`, {
          x: width / 2 - 60, y: height / 2, size: 24, font, color: rgb(0.8, 0.2, 0.2), opacity: 0.15, rotate: degrees(30),
        });
      });
      doc.setTitle("Protected document");
      await savePdf(doc, file.name.replace(/\.pdf$/i, "-protected.pdf"));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">Browser tools cannot apply PDF password encryption. This adds a visible protection watermark. For true encryption, use desktop PDF software.</Notice>
      <Field label="Protection label (watermark)"><Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="CONFIDENTIAL" /></Field>
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Apply watermark & download"}</Button>
    </div>
  );
}

export function UnlockPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const doc = await loadDoc(file);
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
      <Button onClick={run} disabled={busy}>{busy ? "Processing…" : "Try unlock & download"}</Button>
      {msg && <Notice tone="info">{msg}</Notice>}
    </div>
  );
}

/* ------------------------------ PDF → images ------------------------------- */
function PdfToImages({ format }: { format: "jpeg" | "png" }) {
  const { file, pages, error, onFiles } = usePdfFile();
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      for (let i = 1; i <= pages; i++) {
        const canvas = await renderPdfPageToCanvas(file, i, 2);
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), `image/${format}`, format === "jpeg" ? 0.92 : undefined));
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
      <Button onClick={run} disabled={busy}>{busy ? "Converting…" : `Download all pages as ${format.toUpperCase()}`}</Button>
    </div>
  );
}

export const PdfToJpg = () => <PdfToImages format="jpeg" />;
export const PdfToPng = () => <PdfToImages format="png" />;

export function ExtractImagesFromPdf() {
  const { file, pages, error, onFiles } = usePdfFile();
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      for (let i = 1; i <= pages; i++) {
        const canvas = await renderPdfPageToCanvas(file, i, 2);
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
      <Button onClick={run} disabled={busy}>{busy ? "Extracting…" : "Download page images"}</Button>
    </div>
  );
}

/* ------------------------------ Extract text ------------------------------- */
export function ExtractTextFromPdf() {
  const { file, onFiles, error } = usePdfFile();
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      setText(await extractPdfText(file));
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to extract text" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Button onClick={run} disabled={busy}>{busy ? "Extracting…" : "Extract text"}</Button>
      {text && <Output value={text} rows={12} filename="extracted.txt" mono={false} />}
    </div>
  );
}

/* ------------------------------ PDF ↔ Word --------------------------------- */
export function PdfToWord() {
  const { file, onFiles, error } = usePdfFile();
  const [busy, setBusy] = React.useState(false);

  const run = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const text = await extractPdfText(file);
      const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><pre style='font-family:Calibri,sans-serif;white-space:pre-wrap'>${text.replace(/</g, "&lt;")}</pre></body></html>`;
      download(html, file.name.replace(/\.pdf$/i, ".doc"), "application/msword");
    } finally {
      setBusy(false);
    }
  };

  if (!file) return <PdfDrop label="Drop a PDF to convert to Word (.doc)" onFiles={onFiles} error={error} />;
  return (
    <div className="space-y-4">
      <Notice tone="info">Exports extracted text as a .doc file. Layout and images are not preserved.</Notice>
      <Button onClick={run} disabled={busy}>{busy ? "Converting…" : "Download as .doc"}</Button>
    </div>
  );
}

export function WordToPdf() {
  const [busy, setBusy] = React.useState(false);

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    try {
      const { value: html } = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() });
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
      <Notice tone="info">Converts document content to a single-page PDF image. Complex layouts may differ from the original.</Notice>
    </div>
  );
}
