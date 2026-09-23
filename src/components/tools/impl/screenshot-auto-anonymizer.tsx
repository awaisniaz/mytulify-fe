"use client";

import * as React from "react";
import { Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice } from "@/components/tools/shared";
import { Icon } from "@/components/ui/Icon";
import { cn, download } from "@/lib/utils";
import { detectSensitiveRegions, type DetectedBox } from "@/lib/anonymizer/detect";

type Effect = "none" | "blur" | "blackout";
type Mode = "select" | "draw";

type Region = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  effect: Effect;
  source: "auto" | "manual";
};

const ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const LABEL_COLOR: Record<string, string> = {
  face: "#22c55e",
  person: "#84cc16",
  text: "#3b82f6",
  "credit-card": "#f59e0b",
  "cell phone": "#a855f7",
  laptop: "#8b5cf6",
  book: "#06b6d4",
  keyboard: "#6366f1",
  remote: "#ec4899",
  mouse: "#14b8a6",
  tv: "#f43f5e",
  handbag: "#d946ef",
  suitcase: "#f97316",
  manual: "#64748b",
};

function uid() {
  return `r-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function applyRegionEffect(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement | HTMLImageElement,
  r: Region,
  blurPx: number,
) {
  if (r.effect === "none" || r.w < 1 || r.h < 1) return;
  const x = Math.round(r.x);
  const y = Math.round(r.y);
  const w = Math.round(r.w);
  const h = Math.round(r.h);

  if (r.effect === "blackout") {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(x, y, w, h);
    return;
  }

  // Blur via downscale → upscale (stronger + works without CSS filter quirks)
  const scale = Math.max(0.04, Math.min(0.25, 8 / Math.max(w, h, 1)));
  const sw = Math.max(1, Math.round(w * scale));
  const sh = Math.max(1, Math.round(h * scale));
  const tiny = document.createElement("canvas");
  tiny.width = sw;
  tiny.height = sh;
  const tctx = tiny.getContext("2d")!;
  tctx.imageSmoothingEnabled = true;
  tctx.drawImage(source, x, y, w, h, 0, 0, sw, sh);

  const soft = document.createElement("canvas");
  soft.width = w;
  soft.height = h;
  const sctx = soft.getContext("2d")!;
  sctx.imageSmoothingEnabled = true;
  sctx.filter = `blur(${Math.max(2, blurPx * 0.35)}px)`;
  sctx.drawImage(tiny, 0, 0, sw, sh, 0, 0, w, h);
  sctx.filter = "none";
  ctx.drawImage(soft, x, y);
}

export function ScreenshotAutoAnonymizer() {
  const [fileName, setFileName] = React.useState("screenshot.png");
  const [hasImage, setHasImage] = React.useState(false);
  const [regions, setRegions] = React.useState<Region[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<Mode>("select");
  const [paintEffect, setPaintEffect] = React.useState<Exclude<Effect, "none">>("blur");
  const [blurStrength, setBlurStrength] = React.useState(18);
  const [detecting, setDetecting] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");

  const sourceRef = React.useRef<HTMLCanvasElement | null>(null);
  const viewRef = React.useRef<HTMLCanvasElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    curX: number;
    curY: number;
    drawing: boolean;
  } | null>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  const selected = regions.find((r) => r.id === selectedId) ?? null;

  const canvasPoint = React.useCallback((e: { clientX: number; clientY: number }) => {
    const canvas = viewRef.current;
    const source = sourceRef.current;
    if (!canvas || !source) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = source.width / rect.width;
    const sy = source.height / rect.height;
    return {
      x: clamp((e.clientX - rect.left) * sx, 0, source.width),
      y: clamp((e.clientY - rect.top) * sy, 0, source.height),
    };
  }, []);

  const paint = React.useCallback(() => {
    const view = viewRef.current;
    const source = sourceRef.current;
    if (!view || !source) return;
    view.width = source.width;
    view.height = source.height;
    const ctx = view.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, view.width, view.height);
    ctx.drawImage(source, 0, 0);

    for (const r of regions) {
      applyRegionEffect(ctx, source, r, blurStrength);
    }

    // Overlay boxes
    for (const r of regions) {
      const color = LABEL_COLOR[r.label] ?? LABEL_COLOR.manual!;
      const isSel = r.id === selectedId;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = isSel ? 3 : 2;
      ctx.setLineDash(r.effect === "none" ? [6, 4] : []);
      ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalAlpha = 1;
      const tag = `${r.label}${r.effect !== "none" ? ` · ${r.effect}` : ""}`;
      ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";
      const tw = ctx.measureText(tag).width + 10;
      const ty = Math.max(14, r.y);
      ctx.fillStyle = color;
      ctx.fillRect(r.x, ty - 14, tw, 14);
      ctx.fillStyle = "#fff";
      ctx.fillText(tag, r.x + 5, ty - 3);
      ctx.restore();
    }

    // Live draw rect
    const d = dragRef.current;
    if (d?.drawing) {
      const x = Math.min(d.startX, d.curX);
      const y = Math.min(d.startY, d.curY);
      const w = Math.abs(d.curX - d.startX);
      const h = Math.abs(d.curY - d.startY);
      ctx.save();
      ctx.strokeStyle = "#0f766e";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }, [regions, selectedId, blurStrength]);

  React.useEffect(() => {
    paint();
  }, [paint]);

  async function loadFile(files: File[]) {
    const file = files[0];
    if (!file) return;
    if (!/image\/(png|jpeg|jpg|webp)/i.test(file.type) && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
      setError("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    setError("");
    setStatus("Loading image…");
    setRegions([]);
    setSelectedId(null);

    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Could not decode image"));
        el.src = url;
      });
      imageRef.current = img;
      const source = document.createElement("canvas");
      source.width = img.naturalWidth || img.width;
      source.height = img.naturalHeight || img.height;
      const sctx = source.getContext("2d")!;
      sctx.drawImage(img, 0, 0);
      sourceRef.current = source;
      setFileName(file.name.replace(/\.[^.]+$/, "") + "-anonymized.png");
      setHasImage(true);
      setStatus("Ready — run auto-detect or draw boxes manually.");
      requestAnimationFrame(paint);
    } catch {
      setError("Failed to load image.");
      setHasImage(false);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function runDetect() {
    const source = sourceRef.current;
    if (!source) return;
    setDetecting(true);
    setError("");
    setStatus("Detecting faces, text, and sensitive objects…");
    try {
      const boxes = await detectSensitiveRegions(source, setStatus);
      const next: Region[] = boxes.map((b: DetectedBox) => ({
        id: uid(),
        x: b.x,
        y: b.y,
        w: b.w,
        h: b.h,
        label: b.label,
        effect: "none" as Effect,
        source: "auto" as const,
      }));
      setRegions(next);
      setSelectedId(next[0]?.id ?? null);
      setStatus(
        next.length
          ? `Found ${next.length} region${next.length === 1 ? "" : "s"}. Click a box to blur or blackout.`
          : "No sensitive regions found — draw boxes manually if needed.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detection failed.");
      setStatus("");
    } finally {
      setDetecting(false);
    }
  }

  function hitTest(x: number, y: number): Region | null {
    for (let i = regions.length - 1; i >= 0; i--) {
      const r = regions[i]!;
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r;
    }
    return null;
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!hasImage) return;
    const pt = canvasPoint(e);
    if (!pt) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);

    if (mode === "draw") {
      dragRef.current = { startX: pt.x, startY: pt.y, curX: pt.x, curY: pt.y, drawing: true };
      paint();
      return;
    }

    const hit = hitTest(pt.x, pt.y);
    if (hit) {
      setSelectedId(hit.id);
      // Click applies current paint effect (toggle off if same)
      setRegions((prev) =>
        prev.map((r) =>
          r.id === hit.id
            ? { ...r, effect: r.effect === paintEffect ? "none" : paintEffect }
            : r,
        ),
      );
    } else {
      setSelectedId(null);
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = dragRef.current;
    if (!d?.drawing) return;
    const pt = canvasPoint(e);
    if (!pt) return;
    d.curX = pt.x;
    d.curY = pt.y;
    paint();
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = dragRef.current;
    if (!d?.drawing) return;
    d.drawing = false;
    const x = Math.min(d.startX, d.curX);
    const y = Math.min(d.startY, d.curY);
    const w = Math.abs(d.curX - d.startX);
    const h = Math.abs(d.curY - d.startY);
    dragRef.current = null;
    if (w > 6 && h > 6) {
      const region: Region = {
        id: uid(),
        x,
        y,
        w,
        h,
        label: "manual",
        effect: paintEffect,
        source: "manual",
      };
      setRegions((prev) => [...prev, region]);
      setSelectedId(region.id);
      setStatus("Manual region added.");
    } else {
      paint();
    }
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function setSelectedEffect(effect: Effect) {
    if (!selectedId) return;
    setRegions((prev) => prev.map((r) => (r.id === selectedId ? { ...r, effect } : r)));
  }

  function removeSelected() {
    if (!selectedId) return;
    setRegions((prev) => prev.filter((r) => r.id !== selectedId));
    setSelectedId(null);
  }

  function applyAll(effect: Exclude<Effect, "none">) {
    setRegions((prev) => prev.map((r) => ({ ...r, effect })));
  }

  function clearEffects() {
    setRegions((prev) => prev.map((r) => ({ ...r, effect: "none" })));
  }

  function downloadPng() {
    const source = sourceRef.current;
    if (!source) return;
    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = source.height;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(source, 0, 0);
    for (const r of regions) {
      applyRegionEffect(ctx, source, r, blurStrength);
    }
    out.toBlob((blob) => {
      if (!blob) return;
      download(blob, fileName, "image/png");
    }, "image/png");
  }

  function resetAll() {
    sourceRef.current = null;
    imageRef.current = null;
    setHasImage(false);
    setRegions([]);
    setSelectedId(null);
    setStatus("");
    setError("");
    const view = viewRef.current;
    if (view) {
      const ctx = view.getContext("2d");
      ctx?.clearRect(0, 0, view.width, view.height);
      view.width = 0;
      view.height = 0;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Icon name="ShieldCheck" className="h-3.5 w-3.5" />
          100% Private: Your image never leaves your browser
        </span>
        <span className="text-xs text-muted">Faces · text · cards · phones — detected on-device</span>
      </div>

      <Notice tone="info">
        Upload a screenshot, auto-detect sensitive areas (or draw boxes yourself), then click a box to{" "}
        <strong>Blur</strong> or <strong>Blackout</strong>. Download stays local as PNG.
      </Notice>

      {!hasImage ? (
        <FileDrop accept={ACCEPT} onFiles={(f) => void loadFile(f)} label="Drop PNG / JPG / WebP screenshot here" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void runDetect()} disabled={detecting}>
              {detecting ? "Detecting…" : "Auto-detect sensitive areas"}
            </Button>
            <Button
              type="button"
              variant={mode === "select" ? "primary" : "secondary"}
              onClick={() => setMode("select")}
            >
              Select / apply
            </Button>
            <Button
              type="button"
              variant={mode === "draw" ? "primary" : "secondary"}
              onClick={() => setMode("draw")}
            >
              Draw box
            </Button>
            <Button type="button" variant="secondary" onClick={resetAll}>
              New image
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Click effect">
              <div className="inline-flex rounded-xl border border-border p-1">
                {(["blur", "blackout"] as const).map((fx) => (
                  <button
                    key={fx}
                    type="button"
                    onClick={() => setPaintEffect(fx)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-semibold capitalize",
                      paintEffect === fx ? "bg-brand text-white" : "text-muted hover:text-foreground",
                    )}
                  >
                    {fx}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Blur strength (${blurStrength}px)`}>
              <input
                type="range"
                min={6}
                max={40}
                value={blurStrength}
                onChange={(e) => setBlurStrength(Number(e.target.value))}
                className="w-full accent-[var(--brand)]"
              />
            </Field>
            <Field label="Bulk actions">
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" size="sm" variant="secondary" onClick={() => applyAll("blur")}>
                  Blur all
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => applyAll("blackout")}>
                  Blackout all
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={clearEffects}>
                  Clear effects
                </Button>
              </div>
            </Field>
            <Field label="Selected region">
              {selected ? (
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" size="sm" onClick={() => setSelectedEffect("blur")}>
                    Blur
                  </Button>
                  <Button type="button" size="sm" onClick={() => setSelectedEffect("blackout")}>
                    Blackout
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedEffect("none")}>
                    Reveal
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={removeSelected}>
                    Remove
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">Click a box to select</p>
              )}
            </Field>
          </div>

          {(status || detecting) && (
            <p className="text-sm text-muted" aria-live="polite">
              {detecting ? "Working in your browser — nothing is uploaded…" : status}
            </p>
          )}

          <div
            ref={wrapRef}
            className="overflow-auto rounded-2xl border border-border bg-zinc-200/50 p-2 dark:bg-zinc-900/40"
          >
            <canvas
              ref={viewRef}
              className={cn(
                "mx-auto max-h-[min(70vh,720px)] w-auto max-w-full touch-none rounded-lg bg-white shadow-md",
                mode === "draw" ? "cursor-crosshair" : "cursor-pointer",
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={downloadPng} disabled={!hasImage}>
              <Icon name="Download" className="mr-1.5 h-4 w-4" />
              Download Anonymized Image
            </Button>
            <p className="text-xs text-muted">
              {regions.length} box{regions.length === 1 ? "" : "es"} ·{" "}
              {regions.filter((r) => r.effect !== "none").length} anonymized
            </p>
          </div>
        </>
      )}

      {error ? <Notice tone="error">{error}</Notice> : null}
    </div>
  );
}
