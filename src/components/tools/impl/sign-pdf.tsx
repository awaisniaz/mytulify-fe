"use client";

import * as React from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Input, Select, Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice } from "@/components/tools/shared";
import { SignaturePad } from "@/components/tools/impl/SignaturePad";
import { download } from "@/lib/utils";
import { loadPdfJs, renderPdfPageToCanvas } from "@/lib/pdfjs";

/* ── Types ─────────────────────────────────────────────────────────────── */

type SigMode = "draw" | "type" | "upload";

type Placement = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  opacity: number;
  label: string;
};

type DateStamp = {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  fontSize: number;
};

type PageMeta = { width: number; height: number };

const SIG_FONTS = [
  { id: "cursive", label: "Script", css: "'Segoe Script', 'Brush Script MT', cursive" },
  { id: "serif", label: "Serif", css: "Georgia, 'Times New Roman', serif" },
  { id: "sans", label: "Clean", css: "Helvetica, Arial, sans-serif" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

async function measureDataUrl(dataUrl: string): Promise<{ width: number; height: number }> {
  const img = await loadImage(dataUrl);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

function textToSignatureDataUrl(text: string, fontCss: string, fontSize: number): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = `${fontSize}px ${fontCss}`;
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  const h = fontSize + 28;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  ctx.font = `${fontSize}px ${fontCss}`;
  ctx.fillStyle = "#111827";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, 12, fontSize + 8);
  return canvas.toDataURL("image/png");
}

function pdfToDisplay(
  p: Pick<Placement, "x" | "y" | "width" | "height">,
  pdfH: number,
  scale: number,
) {
  return {
    left: p.x * scale,
    top: (pdfH - p.y - p.height) * scale,
    width: p.width * scale,
    height: p.height * scale,
  };
}

function displayToPdf(
  left: number,
  top: number,
  width: number,
  height: number,
  pdfH: number,
  scale: number,
): Pick<Placement, "x" | "y" | "width" | "height"> {
  const w = width / scale;
  const h = height / scale;
  const x = left / scale;
  const y = pdfH - top / scale - h;
  return { x, y, width: w, height: h };
}

function clampPlacement(
  p: Pick<Placement, "x" | "y" | "width" | "height">,
  page: PageMeta,
): Pick<Placement, "x" | "y" | "width" | "height"> {
  const width = Math.min(p.width, page.width);
  const height = Math.min(p.height, page.height);
  const x = Math.max(0, Math.min(p.x, page.width - width));
  const y = Math.max(0, Math.min(p.y, page.height - height));
  return { x, y, width, height };
}

async function embedImage(doc: PDFDocument, dataUrl: string) {
  const bytes = dataUrlToBytes(dataUrl);
  if (/^data:image\/jpe?g/i.test(dataUrl)) return doc.embedJpg(bytes);
  return doc.embedPng(bytes);
}

/* ── Overlay: draggable + resizable signature on preview ───────────────── */

function SignatureOverlay({
  placement,
  pdfPage,
  scale,
  selected,
  onSelect,
  onChange,
  onDelete,
}: {
  placement: Placement;
  pdfPage: PageMeta;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<Pick<Placement, "x" | "y" | "width" | "height">>) => void;
  onDelete: () => void;
}) {
  const disp = pdfToDisplay(placement, pdfPage.height, scale);
  const dragRef = React.useRef<{ mode: "move" | "resize"; startX: number; startY: number; orig: Placement } | null>(
    null,
  );

  const onPointerDown = (e: React.PointerEvent, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, orig: { ...placement } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.mode === "move") {
      const origDisp = pdfToDisplay(d.orig, pdfPage.height, scale);
      const next = displayToPdf(
        origDisp.left + dx,
        origDisp.top + dy,
        origDisp.width,
        origDisp.height,
        pdfPage.height,
        scale,
      );
      onChange(clampPlacement(next, pdfPage));
    } else {
      const ratio = d.orig.height / d.orig.width;
      const newW = Math.max(30 / scale, d.orig.width + dx / scale);
      const newH = newW * ratio;
      const next = clampPlacement({ ...d.orig, width: newW, height: newH }, pdfPage);
      onChange(next);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="absolute touch-none select-none"
      style={{
        left: disp.left,
        top: disp.top,
        width: disp.width,
        height: disp.height,
        opacity: placement.opacity,
        zIndex: selected ? 20 : 10,
      }}
      onPointerDown={(e) => onPointerDown(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img
        src={placement.dataUrl}
        alt={placement.label || "Signature"}
        className="pointer-events-none h-full w-full object-contain"
        draggable={false}
      />
      {selected && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded border-2 border-brand ring-2 ring-brand/30" />
          <div
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-full border-2 border-brand bg-white shadow"
            onPointerDown={(e) => onPointerDown(e, "resize")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
          <button
            type="button"
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow hover:bg-red-600"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────── */

export function SignPdf() {
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pageCount, setPageCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageMeta, setPageMeta] = React.useState<PageMeta | null>(null);
  const [previewScale, setPreviewScale] = React.useState(1.2);
  const [zoom, setZoom] = React.useState(100);
  const [rendering, setRendering] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const previewWrapRef = React.useRef<HTMLDivElement>(null);

  const [sigMode, setSigMode] = React.useState<SigMode>("draw");
  const [drawnSig, setDrawnSig] = React.useState("");
  const [typedText, setTypedText] = React.useState("");
  const [typedFont, setTypedFont] = React.useState(SIG_FONTS[0]!.css);
  const [typedSize, setTypedSize] = React.useState(48);
  const [uploadedSig, setUploadedSig] = React.useState("");
  const [savedSigs, setSavedSigs] = React.useState<{ id: string; label: string; dataUrl: string }[]>([]);

  const [placements, setPlacements] = React.useState<Placement[]>([]);
  const [dateStamps, setDateStamps] = React.useState<DateStamp[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [defaultOpacity, setDefaultOpacity] = React.useState(100);
  const [defaultWidth, setDefaultWidth] = React.useState(160);
  const [includeDate, setIncludeDate] = React.useState(false);
  const [dateText, setDateText] = React.useState(() => new Date().toLocaleDateString());
  const [applyAllPages, setApplyAllPages] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const activeSigDataUrl = React.useMemo(() => {
    if (sigMode === "draw" && drawnSig) return drawnSig;
    if (sigMode === "type" && typedText.trim()) return textToSignatureDataUrl(typedText.trim(), typedFont, typedSize);
    if (sigMode === "upload" && uploadedSig) return uploadedSig;
    return "";
  }, [sigMode, drawnSig, typedText, typedFont, typedSize, uploadedSig]);

  const selected = placements.find((p) => p.id === selectedId) ?? null;

  const effectiveScale = previewScale * (zoom / 100);

  const loadPdf = React.useCallback(async (file: File) => {
    setLoadError("");
    try {
      const pdfjs = await loadPdfJs();
      const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      setPdfFile(file);
      setPageCount(doc.numPages);
      setCurrentPage(1);
      setPlacements([]);
      setDateStamps([]);
      setSelectedId(null);
    } catch (e) {
      setPdfFile(null);
      setLoadError((e as Error).message || "Could not read this PDF.");
    }
  }, []);

  React.useEffect(() => {
    if (!pdfFile) return;
    let cancelled = false;
    (async () => {
      setRendering(true);
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ data: await pdfFile.arrayBuffer() }).promise;
        const page = await doc.getPage(currentPage);
        const base = page.getViewport({ scale: 1 });
        if (cancelled) return;
        setPageMeta({ width: base.width, height: base.height });

        const canvas = await renderPdfPageToCanvas(pdfFile, currentPage, effectiveScale);
        if (cancelled) return;
        const el = canvasRef.current;
        if (el) {
          el.width = canvas.width;
          el.height = canvas.height;
          const ctx = el.getContext("2d");
          ctx?.clearRect(0, 0, el.width, el.height);
          ctx?.drawImage(canvas, 0, 0);
        }
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message || "Could not render page.");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfFile, currentPage, effectiveScale]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        setPlacements((prev) => prev.filter((p) => p.id !== selectedId));
        setDateStamps((prev) => prev.filter((d) => d.id !== `date-${selectedId}`));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const saveCurrentSig = () => {
    if (!activeSigDataUrl) return;
    const label =
      sigMode === "type"
        ? typedText.trim().slice(0, 24)
        : sigMode === "draw"
          ? "Drawn signature"
          : "Uploaded signature";
    setSavedSigs((prev) => [{ id: uid(), label, dataUrl: activeSigDataUrl }, ...prev].slice(0, 8));
  };

  const placeSignature = async (dataUrl?: string, opts?: { width?: number; label?: string }) => {
    const src = dataUrl ?? activeSigDataUrl;
    if (!src || !pageMeta) return;
    const dims = await measureDataUrl(src);
    const aspect = dims.height / dims.width;
    const width = opts?.width ?? defaultWidth;
    const height = width * aspect;
    const x = (pageMeta.width - width) / 2;
    const y = 48;

    const makePlacement = (pageIndex: number): Placement => ({
      id: uid(),
      pageIndex,
      x,
      y,
      width,
      height,
      dataUrl: src,
      opacity: defaultOpacity / 100,
      label: opts?.label ?? (sigMode === "type" ? typedText.trim() : "Signature"),
    });

    if (applyAllPages) {
      const newOnes = Array.from({ length: pageCount }, (_, i) => makePlacement(i));
      setPlacements((prev) => [...prev, ...newOnes]);
      setSelectedId(newOnes[0]?.id ?? null);
      if (includeDate) {
        setDateStamps((prev) => [
          ...prev,
          ...newOnes.map((p) => ({
            id: `date-${p.id}`,
            pageIndex: p.pageIndex,
            x: p.x,
            y: p.y - 18,
            text: dateText,
            fontSize: 11,
          })),
        ]);
      }
    } else {
      const p = makePlacement(currentPage - 1);
      setPlacements((prev) => [...prev, p]);
      setSelectedId(p.id);

      if (includeDate) {
        setDateStamps((prev) => [
          ...prev,
          {
            id: `date-${p.id}`,
            pageIndex: p.pageIndex,
            x: p.x,
            y: p.y - 18,
            text: dateText,
            fontSize: 11,
          },
        ]);
      }
    }
  };

  const updatePlacement = (id: string, patch: Partial<Placement>) => {
    setPlacements((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        let merged = { ...p, ...patch };
        if (patch.width !== undefined && !patch.height) {
          const ratio = p.height / p.width;
          merged = { ...merged, height: patch.width * ratio };
        }
        if (!pageMeta) return merged;
        const clamped = clampPlacement(merged, pageMeta);
        return { ...merged, ...clamped };
      }),
    );
  };

  const duplicateToAllPages = () => {
    if (!selected || !pageMeta) return;
    const others = Array.from({ length: pageCount }, (_, i) => i)
      .filter((i) => i !== selected.pageIndex)
      .map((pageIndex) => ({
        ...selected,
        id: uid(),
        pageIndex,
      }));
    setPlacements((prev) => [...prev, ...others]);
  };

  const exportPdf = async () => {
    if (!pdfFile) return;
    setBusy(true);
    try {
      const doc = await PDFDocument.load(await pdfFile.arrayBuffer(), { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);

      for (const p of placements) {
        const page = doc.getPage(p.pageIndex);
        const img = await embedImage(doc, p.dataUrl);
        page.drawImage(img, {
          x: p.x,
          y: p.y,
          width: p.width,
          height: p.height,
          opacity: p.opacity,
        });
      }

      for (const d of dateStamps) {
        const page = doc.getPage(d.pageIndex);
        page.drawText(d.text, {
          x: d.x,
          y: d.y,
          size: d.fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
      }

      download(
        new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" }),
        pdfFile.name.replace(/\.pdf$/i, "-signed.pdf"),
      );
    } catch (e) {
      alert("Could not sign PDF: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onUploadSig = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setUploadedSig(String(reader.result));
    reader.readAsDataURL(f);
    setSigMode("upload");
  };

  if (!pdfFile) {
    return (
      <div className="space-y-4">
        <Notice tone="info">
          Upload a PDF, preview every page, draw/type/upload your signature, drag it into place, resize it, and
          download — all privately in your browser.
        </Notice>
        <FileDrop accept="application/pdf" onFiles={(f) => void loadPdf(f[0]!)} label="Drop PDF to sign" />
        {loadError && <Notice tone="error">{loadError}</Notice>}
      </div>
    );
  }

  const pagePlacements = placements.filter((p) => p.pageIndex === currentPage - 1);

  return (
    <div className="space-y-4">
      <Notice tone="success">
        {pdfFile.name} · {pageCount} page{pageCount !== 1 ? "s" : ""} · {placements.length} signature
        {placements.length !== 1 ? "s" : ""} placed
      </Notice>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* PDF Preview */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </Button>
            <span className="text-sm text-muted">
              Page{" "}
              <Input
                type="number"
                min={1}
                max={pageCount}
                value={currentPage}
                onChange={(e) => setCurrentPage(Math.min(pageCount, Math.max(1, +e.target.value || 1)))}
                className="inline-block w-16 text-center"
              />{" "}
              of {pageCount}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
            >
              Next →
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
                −
              </Button>
              <span className="w-12 text-center text-xs text-muted">{zoom}%</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
                +
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setZoom(100)}>
                Fit
              </Button>
            </div>
          </div>

          <div
            ref={previewWrapRef}
            className="relative overflow-auto rounded-xl border border-border bg-surface-2 p-3"
            style={{ maxHeight: "70vh" }}
            onClick={() => setSelectedId(null)}
          >
            {rendering && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface-2/80 text-sm text-muted">
                Rendering page…
              </div>
            )}
            {pageMeta && (
              <div className="relative mx-auto w-fit">
                <canvas ref={canvasRef} className="block max-w-full shadow-md" />
                {pagePlacements.map((p) => (
                  <SignatureOverlay
                    key={p.id}
                    placement={p}
                    pdfPage={pageMeta}
                    scale={effectiveScale}
                    selected={selectedId === p.id}
                    onSelect={() => setSelectedId(p.id)}
                    onChange={(patch) => updatePlacement(p.id, patch)}
                    onDelete={() => {
                      setPlacements((prev) => prev.filter((x) => x.id !== p.id));
                      setDateStamps((prev) => prev.filter((d) => d.id !== `date-${p.id}`));
                      setSelectedId(null);
                    }}
                  />
                ))}
                {dateStamps
                  .filter((d) => d.pageIndex === currentPage - 1)
                  .map((d) => {
                    const left = d.x * effectiveScale;
                    const top = (pageMeta.height - d.y - d.fontSize * 1.2) * effectiveScale;
                    return (
                      <div
                        key={d.id}
                        className="pointer-events-none absolute text-[11px] font-medium text-gray-800"
                        style={{ left, top, fontSize: d.fontSize * effectiveScale * 0.85 }}
                      >
                        {d.text}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          <p className="text-xs text-muted">
            Click a signature to select · Drag to move · Drag corner handle to resize · Delete key to remove
          </p>
        </div>

        {/* Signature panel */}
        <div className="space-y-4">
          <Section title="Create signature">
            <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
              {(["draw", "type", "upload"] as SigMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition ${
                    sigMode === m ? "bg-brand text-brand-fg" : "text-muted hover:text-foreground"
                  }`}
                  onClick={() => setSigMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>

            {sigMode === "draw" && <SignaturePad value={drawnSig || undefined} onChange={setDrawnSig} />}

            {sigMode === "type" && (
              <div className="space-y-2">
                <Field label="Type your name">
                  <Input value={typedText} onChange={(e) => setTypedText(e.target.value)} placeholder="John Smith" />
                </Field>
                <Field label="Font style">
                  <Select value={typedFont} onChange={(e) => setTypedFont(e.target.value)}>
                    {SIG_FONTS.map((f) => (
                      <option key={f.id} value={f.css}>
                        {f.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={`Size: ${typedSize}px`}>
                  <input
                    type="range"
                    min={24}
                    max={96}
                    value={typedSize}
                    onChange={(e) => setTypedSize(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                {typedText.trim() && (
                  <div className="rounded-lg border border-border bg-white p-3 text-center">
                    <img
                      src={textToSignatureDataUrl(typedText.trim(), typedFont, typedSize)}
                      alt="Preview"
                      className="mx-auto max-h-16"
                    />
                  </div>
                )}
              </div>
            )}

            {sigMode === "upload" && (
              <FileDrop
                accept="image/png,image/jpeg,image/webp"
                onFiles={onUploadSig}
                label="Drop signature image (PNG/JPG)"
              />
            )}

            {activeSigDataUrl && (
              <div className="rounded-lg border border-border bg-white p-2">
                <img src={activeSigDataUrl} alt="Current signature" className="mx-auto max-h-20 object-contain" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={!activeSigDataUrl} onClick={() => void placeSignature()}>
                Place on page
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!activeSigDataUrl}
                onClick={() => void placeSignature(undefined, { width: Math.round(defaultWidth * 0.45), label: "Initials" })}
              >
                Place initials
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={!activeSigDataUrl} onClick={saveCurrentSig}>
                Save signature
              </Button>
            </div>
          </Section>

          {savedSigs.length > 0 && (
            <Section title="Saved signatures">
              <div className="space-y-2">
                {savedSigs.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-left hover:border-brand"
                    onClick={() => void placeSignature(s.dataUrl)}
                  >
                    <img src={s.dataUrl} alt="" className="h-8 max-w-[80px] object-contain" />
                    <span className="truncate text-xs text-muted">{s.label}</span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <Section title="Placement options">
            <Field label={`Default width: ${defaultWidth}pt`}>
              <input
                type="range"
                min={60}
                max={400}
                value={defaultWidth}
                onChange={(e) => setDefaultWidth(+e.target.value)}
                className="w-full accent-[var(--brand)]"
              />
            </Field>
            <Field label={`Opacity: ${defaultOpacity}%`}>
              <input
                type="range"
                min={20}
                max={100}
                value={defaultOpacity}
                onChange={(e) => setDefaultOpacity(+e.target.value)}
                className="w-full accent-[var(--brand)]"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={applyAllPages}
                onChange={(e) => setApplyAllPages(e.target.checked)}
                className="accent-[var(--brand)]"
              />
              Place on all pages
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                className="accent-[var(--brand)]"
              />
              Add date stamp
            </label>
            {includeDate && (
              <Field label="Date text">
                <Input value={dateText} onChange={(e) => setDateText(e.target.value)} />
              </Field>
            )}
          </Section>

          {selected && pageMeta && (
            <Section title="Selected signature">
              <Field label={`Width: ${Math.round(selected.width)}pt`}>
                <input
                  type="range"
                  min={40}
                  max={Math.min(400, pageMeta.width)}
                  value={Math.round(selected.width)}
                  onChange={(e) => updatePlacement(selected.id, { width: +e.target.value })}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label={`Opacity: ${Math.round(selected.opacity * 100)}%`}>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={Math.round(selected.opacity * 100)}
                  onChange={(e) => updatePlacement(selected.id, { opacity: +e.target.value / 100 })}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={duplicateToAllPages}>
                  Copy to all pages
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setPlacements((prev) => prev.filter((p) => p.id !== selected.id));
                    setSelectedId(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </Section>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" onClick={() => void exportPdf()} disabled={busy || placements.length === 0}>
              {busy ? "Signing…" : "Download signed PDF"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPdfFile(null);
                setPlacements([]);
                setSavedSigs([]);
              }}
            >
              Upload another
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface-1 p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
