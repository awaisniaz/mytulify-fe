"use client";

import * as React from "react";
import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import { Input, Select, Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice, Stat } from "@/components/tools/shared";
import { download } from "@/lib/utils";

function useFiles(accept = "application/pdf", multiple = false) {
  const [files, setFiles] = React.useState<File[]>([]);
  const onFiles = (f: File[]) => setFiles(multiple ? [...files, ...f] : f.slice(0, 1));
  return { files, setFiles, onFiles };
}

function Busy({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return <Button disabled={busy}>{busy ? "Processing…" : children}</Button>;
}

/* parse "1-3,5,8" → zero-based index list against pageCount */
function parseRanges(spec: string, total: number): number[] {
  const out: number[] = [];
  for (const part of spec.split(",")) {
    const t = part.trim();
    if (!t) continue;
    if (t.includes("-")) {
      const [a, b] = t.split("-").map((x) => parseInt(x, 10));
      for (let i = a; i <= b; i++) if (i >= 1 && i <= total) out.push(i - 1);
    } else {
      const i = parseInt(t, 10);
      if (i >= 1 && i <= total) out.push(i - 1);
    }
  }
  return out;
}

/* ------------------------------ Merge -------------------------------------- */
export function MergePdf() {
  const { files, setFiles, onFiles } = useFiles("application/pdf", true);
  const [busy, setBusy] = React.useState(false);
  const merge = async () => {
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const f of files) {
        const src = await PDFDocument.load(await f.arrayBuffer());
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      download(new Blob([(await out.save()) as BlobPart], { type: "application/pdf" }), "merged.pdf");
    } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="application/pdf" multiple onFiles={onFiles} label="Add PDF files to merge" />
      {files.map((f, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
          <span className="truncate">{i + 1}. {f.name}</span>
          <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-muted hover:text-rose-500">✕</button>
        </div>
      ))}
      {files.length >= 2 && <div onClick={merge}><Busy busy={busy}>Merge {files.length} PDFs</Busy></div>}
    </div>
  );
}

/* ------------------------------ Images → PDF ------------------------------- */
export function ImagesToPdf() {
  const { files, setFiles, onFiles } = useFiles("image/*", true);
  const [busy, setBusy] = React.useState(false);
  const make = async () => {
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const f of files) {
        const bytes = await f.arrayBuffer();
        const img = /png$/i.test(f.type) ? await out.embedPng(bytes) : await out.embedJpg(bytes);
        const page = out.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      download(new Blob([(await out.save()) as BlobPart], { type: "application/pdf" }), "images.pdf");
    } finally { setBusy(false); }
  };
  return (
    <div className="space-y-4">
      <FileDrop accept="image/png,image/jpeg" multiple onFiles={onFiles} label="Add images (JPG / PNG)" />
      {files.length > 0 && <p className="text-sm text-muted">{files.length} image(s) · <button className="text-brand" onClick={() => setFiles([])}>clear</button></p>}
      {files.length > 0 && <div onClick={make}><Busy busy={busy}>Create PDF</Busy></div>}
    </div>
  );
}

/* ------------------------ Single-PDF transform shell ----------------------- */
function SinglePdf({
  label, action, controls,
}: {
  label: string;
  action: (doc: PDFDocument, opts: Record<string, string>) => Promise<PDFDocument | void> | PDFDocument | void;
  controls?: (opts: Record<string, string>, set: (k: string, v: string) => void, total: number) => React.ReactNode;
}) {
  const { files, onFiles } = useFiles();
  const [opts, setOptsState] = React.useState<Record<string, string>>({});
  const [total, setTotal] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const setOpt = (k: string, v: string) => setOptsState((o) => ({ ...o, [k]: v }));

  React.useEffect(() => {
    (async () => {
      if (files[0]) {
        const d = await PDFDocument.load(await files[0].arrayBuffer());
        setTotal(d.getPageCount());
      }
    })();
  }, [files]);

  const run = async () => {
    if (!files[0]) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(await files[0].arrayBuffer());
      const result = (await action(doc, opts)) || doc;
      download(new Blob([(await result.save()) as BlobPart], { type: "application/pdf" }), files[0].name.replace(/\.pdf$/i, "") + "-edited.pdf");
    } catch (e) {
      alert("Could not process this PDF: " + (e as Error).message);
    } finally { setBusy(false); }
  };

  if (!files[0]) return <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF or click to upload" />;
  return (
    <div className="space-y-4">
      <Notice tone="info">{files[0].name} · {total} pages</Notice>
      {controls?.(opts, setOpt, total)}
      <div onClick={run}><Busy busy={busy}>{label}</Busy></div>
    </div>
  );
}

/* the page counter — read only */
export function PdfPageCounter() {
  const { files, onFiles } = useFiles();
  const [info, setInfo] = React.useState<{ pages: number; size: number } | null>(null);
  React.useEffect(() => {
    (async () => {
      if (files[0]) {
        const d = await PDFDocument.load(await files[0].arrayBuffer());
        setInfo({ pages: d.getPageCount(), size: files[0].size });
      }
    })();
  }, [files]);
  if (!files[0]) return <FileDrop accept="application/pdf" onFiles={onFiles} label="Drop a PDF to count pages" />;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Pages" value={info?.pages ?? "…"} />
      <Stat label="File size" value={info ? `${Math.round(info.size / 1024)} KB` : "…"} />
    </div>
  );
}

export const RotatePdf = () => (
  <SinglePdf
    label="Rotate & download"
    controls={(o, set) => (
      <Field label="Rotation">
        <Select value={o.deg ?? "90"} onChange={(e) => set("deg", e.target.value)}>
          <option value="90">90° clockwise</option>
          <option value="180">180°</option>
          <option value="270">90° counter-clockwise</option>
        </Select>
      </Field>
    )}
    action={(doc, o) => {
      const d = parseInt(o.deg ?? "90", 10);
      doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + d) % 360)));
    }}
  />
);

export const DeletePdfPages = () => (
  <SinglePdf
    label="Delete pages & download"
    controls={(o, set, total) => (
      <Field label="Pages to delete" hint={`e.g. 1,3,5-7 · total ${total}`}>
        <Input value={o.range ?? ""} onChange={(e) => set("range", e.target.value)} placeholder="2,4-6" />
      </Field>
    )}
    action={(doc, o) => {
      const idx = parseRanges(o.range ?? "", doc.getPageCount()).sort((a, b) => b - a);
      idx.forEach((i) => doc.removePage(i));
    }}
  />
);

export const ExtractPdfPages = () => (
  <SinglePdf
    label="Extract pages & download"
    controls={(o, set, total) => (
      <Field label="Pages to keep" hint={`e.g. 1-3,5 · total ${total}`}>
        <Input value={o.range ?? ""} onChange={(e) => set("range", e.target.value)} placeholder="1-3" />
      </Field>
    )}
    action={async (doc, o) => {
      const keep = new Set(parseRanges(o.range ?? "", doc.getPageCount()));
      const remove = doc.getPageIndices().filter((i) => !keep.has(i)).sort((a, b) => b - a);
      remove.forEach((i) => doc.removePage(i));
    }}
  />
);

export const ReversePdfPages = () => (
  <SinglePdf
    label="Reverse & download"
    action={async (doc) => {
      const out = await PDFDocument.create();
      const idx = doc.getPageIndices().reverse();
      const pages = await out.copyPages(doc, idx);
      pages.forEach((p) => out.addPage(p));
      return out;
    }}
  />
);

export const AddPageNumbers = () => (
  <SinglePdf
    label="Add page numbers & download"
    action={async (doc) => {
      const font = await doc.embedFont(StandardFonts.Helvetica);
      doc.getPages().forEach((p, i) => {
        const { width } = p.getSize();
        p.drawText(`${i + 1}`, { x: width / 2 - 6, y: 18, size: 11, font, color: rgb(0.3, 0.3, 0.3) });
      });
    }}
  />
);

export const WatermarkPdf = () => (
  <SinglePdf
    label="Add watermark & download"
    controls={(o, set) => (
      <Field label="Watermark text">
        <Input value={o.text ?? ""} onChange={(e) => set("text", e.target.value)} placeholder="CONFIDENTIAL" />
      </Field>
    )}
    action={async (doc, o) => {
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const text = o.text || "WATERMARK";
      doc.getPages().forEach((p) => {
        const { width, height } = p.getSize();
        p.drawText(text, {
          x: width / 2 - text.length * 9, y: height / 2,
          size: 48, font, color: rgb(0.6, 0.6, 0.6), opacity: 0.25, rotate: degrees(45),
        });
      });
    }}
  />
);

export const DuplicatePdfPages = () => (
  <SinglePdf
    label="Duplicate pages & download"
    controls={(o, set, total) => (
      <Field label="Pages to duplicate" hint={`e.g. 1,3 · total ${total}`}>
        <Input value={o.range ?? ""} onChange={(e) => set("range", e.target.value)} placeholder="1" />
      </Field>
    )}
    action={async (doc, o) => {
      const out = await PDFDocument.create();
      for (const i of doc.getPageIndices()) {
        const [p] = await out.copyPages(doc, [i]);
        out.addPage(p);
        if (parseRanges(o.range ?? "", doc.getPageCount()).includes(i)) {
          const [dup] = await out.copyPages(doc, [i]);
          out.addPage(dup);
        }
      }
      return out;
    }}
  />
);

export const CompressPdf = () => (
  <SinglePdf
    label="Optimize & download"
    action={async (doc) => {
      // pdf-lib re-save with object streams reduces size on many PDFs
      return doc;
    }}
  />
);

export const SplitPdf = ExtractPdfPages;
