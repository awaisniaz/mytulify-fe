"use client";

import * as React from "react";
import { Button, Input } from "@/components/ui/primitives";
import { FileDrop, Field, Notice, Stat } from "@/components/tools/shared";
import { readAsDataURL, download } from "@/lib/utils";

type ZoneId = "walls" | "trim" | "door" | "accent" | "furniture";
type ToolMode = "brush" | "fill";

type Zone = {
  id: ZoneId;
  label: string;
  color: string;
  hint: string;
};

type AppliedPin = {
  id: string;
  zoneId: ZoneId;
  label: string;
  color: string;
  x: number;
  y: number;
};

const DEFAULT_ZONES: Zone[] = [
  { id: "walls", label: "Walls", color: "#d4c4a8", hint: "Main wall paint" },
  { id: "trim", label: "Trim / ceiling", color: "#f5f0e8", hint: "Skirting, ceiling, frames" },
  { id: "door", label: "Door / wood", color: "#8b5a2b", hint: "Doors, cabinets, wood" },
  { id: "accent", label: "Accent wall", color: "#3d5a4c", hint: "Feature wall or niche" },
  { id: "furniture", label: "Furniture", color: "#6b7280", hint: "Sofa, curtains, soft goods" },
];

const PALETTES: { name: string; colors: Record<ZoneId, string> }[] = [
  {
    name: "Warm sand",
    colors: { walls: "#e8dcc8", trim: "#faf6f0", door: "#9a6b3f", accent: "#c4a484", furniture: "#7a6a58" },
  },
  {
    name: "Coastal calm",
    colors: { walls: "#d9e4ea", trim: "#f7fafc", door: "#5c7a8a", accent: "#7ba3b5", furniture: "#8a9aa3" },
  },
  {
    name: "Modern sage",
    colors: { walls: "#d7ddd4", trim: "#f4f6f2", door: "#5f6f5a", accent: "#6f8468", furniture: "#7c8578" },
  },
  {
    name: "Soft terracotta",
    colors: { walls: "#edd8cc", trim: "#faf5f1", door: "#a05a3c", accent: "#c4785a", furniture: "#8c6b5c" },
  },
  {
    name: "Charcoal chic",
    colors: { walls: "#cfd3d6", trim: "#f3f4f5", door: "#3f4650", accent: "#2f353c", furniture: "#6b7280" },
  },
];

const LEGEND_H = 56;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Keep shadows/highlights; replace hue with paint color. */
function tintPixel(
  data: Uint8ClampedArray,
  i: number,
  paint: { r: number; g: number; b: number },
  paintLum: number,
  strength = 1,
) {
  const r = data[i]!;
  const g = data[i + 1]!;
  const b = data[i + 2]!;
  const lum = luminance(r, g, b);
  const scale = lum / paintLum;
  const nr = Math.min(255, paint.r * scale);
  const ng = Math.min(255, paint.g * scale);
  const nb = Math.min(255, paint.b * scale);
  data[i] = r + (nr - r) * strength;
  data[i + 1] = g + (ng - g) * strength;
  data[i + 2] = b + (nb - b) * strength;
}

function rgbToLabApprox(r: number, g: number, b: number) {
  // Fast perceptual-ish distance (not true Lab, but better than raw RGB for walls)
  const L = luminance(r, g, b);
  const a = (r - g) * 0.5 + (r - b) * 0.25;
  const bb = (g - b) * 0.5;
  return { L, a, b: bb };
}

function labDist(
  x: { L: number; a: number; b: number },
  y: { L: number; a: number; b: number },
) {
  const dL = (x.L - y.L) * 0.55; // allow lighting variation
  const da = x.a - y.a;
  const db = x.b - y.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/** Soft flood-fill: only connected region, feathered edges. */
function recolorRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sx: number,
  sy: number,
  paint: { r: number; g: number; b: number },
  tolerance: number,
) {
  const start = (sy * width + sx) * 4;
  const target = rgbToLabApprox(data[start]!, data[start + 1]!, data[start + 2]!);
  const paintLum = Math.max(8, luminance(paint.r, paint.g, paint.b));
  const distMap = new Float32Array(width * height);
  distMap.fill(-1);
  const queue: number[] = [sx, sy];
  distMap[sy * width + sx] = 0;
  let qi = 0;
  let changed = 0;
  const soft = Math.max(8, tolerance * 0.35);

  while (qi < queue.length) {
    const x = queue[qi++]!;
    const y = queue[qi++]!;
    const pi = y * width + x;
    const i = pi * 4;
    if (data[i + 3]! < 20) continue;

    const d = labDist(rgbToLabApprox(data[i]!, data[i + 1]!, data[i + 2]!), target);
    if (d > tolerance) continue;

    const strength = d <= tolerance - soft ? 1 : 1 - (d - (tolerance - soft)) / soft;
    tintPixel(data, i, paint, paintLum, Math.max(0.15, strength));
    changed++;

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ] as const;
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const npi = ny * width + nx;
      if (distMap[npi]! >= 0) continue;
      distMap[npi] = 0;
      queue.push(nx, ny);
    }
  }
  return changed;
}

/** Paint a soft circular brush stroke with luminance-preserving tint. */
function brushStroke(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  radius: number,
  paint: { r: number; g: number; b: number },
  seedLab: { L: number; a: number; b: number } | null,
  colorLock: number,
) {
  const paintLum = Math.max(8, luminance(paint.r, paint.g, paint.b));
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(1, radius * 0.35)));
  let painted = 0;

  for (let s = 0; s <= steps; s++) {
    const cx = Math.round(x0 + (dx * s) / steps);
    const cy = Math.round(y0 + (dy * s) / steps);
    const r2 = radius * radius;
    const softR = radius * 0.55;

    for (let y = cy - radius; y <= cy + radius; y++) {
      if (y < 0 || y >= height) continue;
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x < 0 || x >= width) continue;
        const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (d2 > r2) continue;
        const i = (y * width + x) * 4;
        if (data[i + 3]! < 20) continue;

        if (seedLab && colorLock < 100) {
          const lab = rgbToLabApprox(data[i]!, data[i + 1]!, data[i + 2]!);
          const d = labDist(lab, seedLab);
          if (d > colorLock) continue;
        }

        const dist = Math.sqrt(d2);
        const edge = dist <= softR ? 1 : 1 - (dist - softR) / (radius - softR + 0.001);
        tintPixel(data, i, paint, paintLum, Math.max(0.2, edge * 0.92));
        painted++;
      }
    }
  }
  return painted;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawEmbeddedLegend(
  ctx: CanvasRenderingContext2D,
  photoW: number,
  photoH: number,
  pins: AppliedPin[],
  activeColor: string,
  activeLabel: string,
) {
  for (const pin of pins) {
    const r = Math.max(9, Math.round(photoW * 0.015));
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, r, 0, Math.PI * 2);
    ctx.fillStyle = pin.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const tag = `${pin.label} ${pin.color}`;
    ctx.font = `bold ${Math.max(11, Math.round(photoW * 0.015))}px system-ui, sans-serif`;
    const tw = ctx.measureText(tag).width;
    const padX = 8;
    const bx = Math.min(photoW - tw - padX * 2 - 8, Math.max(8, pin.x + r + 6));
    const by = Math.max(18, pin.y - 6);
    ctx.fillStyle = "rgba(15,15,15,0.72)";
    roundRect(ctx, bx, by - 12, tw + padX * 2, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(tag, bx + padX, by + 4);
  }

  const unique = new Map<string, { label: string; color: string }>();
  for (const p of pins) unique.set(p.zoneId, p);
  unique.set("__active", { label: activeLabel, color: activeColor });

  const items = [...unique.values()];
  const stripY = photoH;
  ctx.fillStyle = "rgba(18,18,18,0.88)";
  ctx.fillRect(0, stripY, photoW, LEGEND_H);

  const slot = photoW / Math.max(1, items.length);
  items.forEach((item, i) => {
    const cx = slot * i + slot / 2;
    const cy = stripY + LEGEND_H / 2 - 4;
    const sw = Math.min(28, slot * 0.35);
    roundRect(ctx, cx - sw / 2, cy - sw / 2, sw, sw, 6);
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.font = `600 ${Math.max(9, Math.round(photoW * 0.012))}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(item.label, cx, stripY + LEGEND_H - 8);
    ctx.textAlign = "left";
  });
}

function clonePhoto(photo: ImageData) {
  return new ImageData(new Uint8ClampedArray(photo.data), photo.width, photo.height);
}

export function HomeColorVisualizer() {
  const [src, setSrc] = React.useState("");
  const [zones, setZones] = React.useState<Zone[]>(DEFAULT_ZONES);
  const [active, setActive] = React.useState<ZoneId>("walls");
  const [mode, setMode] = React.useState<ToolMode>("brush");
  const [brushSize, setBrushSize] = React.useState(36);
  const [tolerance, setTolerance] = React.useState(55);
  const [colorLock, setColorLock] = React.useState(48);
  const [status, setStatus] = React.useState("Upload a room photo, pick a color, then brush over the wall.");
  const [history, setHistory] = React.useState<{ photo: ImageData; pins: AppliedPin[] }[]>([]);
  const [pins, setPins] = React.useState<AppliedPin[]>([]);
  const [embedLegend, setEmbedLegend] = React.useState(true);
  const [drawing, setDrawing] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const photoRef = React.useRef<ImageData | null>(null);
  const photoSize = React.useRef({ w: 0, h: 0 });
  const lastPt = React.useRef<{ x: number; y: number } | null>(null);
  const strokeSeed = React.useRef<{ L: number; a: number; b: number } | null>(null);
  const strokeSaved = React.useRef(false);
  const strokePin = React.useRef<{ x: number; y: number } | null>(null);

  const activeZone = zones.find((z) => z.id === active)!;

  const paintCanvas = React.useCallback(
    (photo: ImageData, nextPins: AppliedPin[], showLegend: boolean, activeZ: Zone) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const w = photo.width;
      const h = photo.height;
      canvas.width = w;
      canvas.height = showLegend ? h + LEGEND_H : h;
      ctx.putImageData(photo, 0, 0);
      if (showLegend) {
        drawEmbeddedLegend(ctx, w, h, nextPins, activeZ.color, activeZ.label);
      } else {
        for (const pin of nextPins) {
          const r = Math.max(9, Math.round(w * 0.015));
          ctx.beginPath();
          ctx.arc(pin.x, pin.y, r + 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pin.x, pin.y, r, 0, Math.PI * 2);
          ctx.fillStyle = pin.color;
          ctx.fill();
        }
      }
    },
    [],
  );

  const redraw = React.useCallback(
    (nextPins?: AppliedPin[]) => {
      if (!photoRef.current) return;
      paintCanvas(photoRef.current, nextPins ?? pins, embedLegend, activeZone);
    },
    [paintCanvas, pins, embedLegend, activeZone],
  );

  React.useEffect(() => {
    redraw();
  }, [embedLegend, activeZone.color, activeZone.label, active, redraw]);

  const drawBase = React.useCallback(
    async (dataUrl: string) => {
      const img = await loadImage(dataUrl);
      const maxW = 1000;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      photoSize.current = { w, h };

      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, w, h);
      const photo = octx.getImageData(0, 0, w, h);
      photoRef.current = photo;
      setPins([]);
      setHistory([]);
      paintCanvas(photo, [], true, DEFAULT_ZONES[0]!);
      setStatus("Brush over the wall/door you want to recolor — shadows stay natural.");
    },
    [paintCanvas],
  );

  const onFiles = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const url = await readAsDataURL(f);
    setSrc(url);
    await drawBase(url);
  };

  const pushHistory = () => {
    if (!photoRef.current) return;
    setHistory((h) => [
      ...h.slice(-14),
      { photo: clonePhoto(photoRef.current!), pins: [...pins] },
    ]);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1]!;
    photoRef.current = prev.photo;
    setPins(prev.pins);
    setHistory((h) => h.slice(0, -1));
    paintCanvas(prev.photo, prev.pins, embedLegend, activeZone);
    setStatus("Undid last paint.");
  };

  const reset = async () => {
    if (!src) return;
    await drawBase(src);
    setStatus("Reset to original photo.");
  };

  const canvasToPhotoXY = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // object-fit: contain letterboxes — map into the actual drawn bitmap area
    const canvasAspect = canvas.width / Math.max(1, canvas.height);
    const elAspect = rect.width / Math.max(1, rect.height);
    let drawW = rect.width;
    let drawH = rect.height;
    let offsetX = 0;
    let offsetY = 0;
    if (elAspect > canvasAspect) {
      drawH = rect.height;
      drawW = drawH * canvasAspect;
      offsetX = (rect.width - drawW) / 2;
    } else {
      drawW = rect.width;
      drawH = drawW / canvasAspect;
      offsetY = (rect.height - drawH) / 2;
    }
    const x = Math.floor(((e.clientX - rect.left - offsetX) / drawW) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top - offsetY) / drawH) * canvas.height);
    if (y < 0 || y >= photoSize.current.h || x < 0 || x >= photoSize.current.w) return null;
    return { x, y };
  };

  const addOrReplacePin = (x: number, y: number) => {
    const pin: AppliedPin = {
      id: `${Date.now()}`,
      zoneId: active,
      label: activeZone.label,
      color: activeZone.color,
      x,
      y,
    };
    let nextPins: AppliedPin[] = [];
    setPins((ps) => {
      nextPins = [...ps.filter((p) => p.zoneId !== active), pin];
      return nextPins;
    });
    return nextPins;
  };

  const applyFill = (x: number, y: number) => {
    if (!photoRef.current) return;
    pushHistory();
    const photo = clonePhoto(photoRef.current);
    const paint = hexToRgb(activeZone.color);
    const changed = recolorRegion(photo.data, photo.width, photo.height, x, y, paint, tolerance);
    photoRef.current = photo;
    const nextPins = addOrReplacePin(x, y);
    paintCanvas(photo, nextPins, embedLegend, activeZone);
    setStatus(
      changed
        ? `Filled ${activeZone.label} on the clicked area (${changed.toLocaleString()} px).`
        : "Fill didn’t catch — raise Fill range, or switch to Brush and paint it.",
    );
  };

  const startBrush = (x: number, y: number) => {
    if (!photoRef.current) return;
    if (!strokeSaved.current) {
      pushHistory();
      strokeSaved.current = true;
    }
    const photo = photoRef.current;
    const i = (y * photo.width + x) * 4;
    strokeSeed.current = rgbToLabApprox(photo.data[i]!, photo.data[i + 1]!, photo.data[i + 2]!);
    strokePin.current = { x, y };
    lastPt.current = { x, y };
    setDrawing(true);

    const paint = hexToRgb(activeZone.color);
    brushStroke(
      photo.data,
      photo.width,
      photo.height,
      x,
      y,
      x,
      y,
      brushSize,
      paint,
      strokeSeed.current,
      colorLock,
    );
    paintCanvas(photo, pins, embedLegend, activeZone);
  };

  const moveBrush = (x: number, y: number) => {
    if (!drawing || !photoRef.current || !lastPt.current) return;
    const paint = hexToRgb(activeZone.color);
    brushStroke(
      photoRef.current.data,
      photoRef.current.width,
      photoRef.current.height,
      lastPt.current.x,
      lastPt.current.y,
      x,
      y,
      brushSize,
      paint,
      strokeSeed.current,
      colorLock,
    );
    lastPt.current = { x, y };
    paintCanvas(photoRef.current, pins, embedLegend, activeZone);
  };

  const endBrush = () => {
    if (!drawing) return;
    setDrawing(false);
    strokeSaved.current = false;
    lastPt.current = null;
    if (strokePin.current && photoRef.current) {
      const nextPins = addOrReplacePin(strokePin.current.x, strokePin.current.y);
      paintCanvas(photoRef.current, nextPins, embedLegend, activeZone);
      setStatus(`Brushed ${activeZone.label} (${activeZone.color}) — undo anytime.`);
    }
    strokeSeed.current = null;
    strokePin.current = null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = canvasToPhotoXY(e);
    if (!pt) return;
    if (mode === "fill") {
      applyFill(pt.x, pt.y);
      return;
    }
    startBrush(pt.x, pt.y);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "brush" || !drawing) return;
    const pt = canvasToPhotoXY(e);
    if (!pt) return;
    moveBrush(pt.x, pt.y);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    endBrush();
  };

  const setZoneColor = (id: ZoneId, color: string) => {
    setZones((zs) => zs.map((z) => (z.id === id ? { ...z, color } : z)));
    setPins((ps) => {
      const next = ps.map((p) => (p.zoneId === id ? { ...p, color } : p));
      if (photoRef.current) {
        paintCanvas(photoRef.current, next, embedLegend, {
          ...activeZone,
          color: id === active ? color : activeZone.color,
        });
      }
      return next;
    });
  };

  const applyPalette = (name: string) => {
    const p = PALETTES.find((x) => x.name === name);
    if (!p) return;
    setZones((zs) => zs.map((z) => ({ ...z, color: p.colors[z.id] })));
    setPins((ps) => {
      const next = ps.map((pin) => ({ ...pin, color: p.colors[pin.zoneId] }));
      if (photoRef.current) {
        paintCanvas(photoRef.current, next, embedLegend, {
          ...activeZone,
          color: p.colors[active],
        });
      }
      return next;
    });
    setStatus(`Loaded “${name}” palette — brush each surface to apply.`);
  };

  const downloadResult = () => {
    if (!photoRef.current) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = photoRef.current.width;
    exportCanvas.height = photoRef.current.height + LEGEND_H;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(photoRef.current, 0, 0);
    drawEmbeddedLegend(
      ctx,
      photoRef.current.width,
      photoRef.current.height,
      pins,
      activeZone.color,
      activeZone.label,
    );
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      download(blob, "home-color-preview.png", "image/png");
    }, "image/png");
  };

  return (
    <div className="space-y-4">
      <Notice tone="info">
        <strong>Brush</strong> over the exact wall/door (best). Or use <strong>Fill</strong> for one-click on a flat
        surface. Shadows & lighting stay — only the paint hue changes.
      </Notice>

      {!src ? (
        <FileDrop accept="image/*" onFiles={onFiles} label="Drop a home / room photo or click to upload" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setSrc("")}>
              New photo
            </Button>
            <Button variant="secondary" size="sm" onClick={undo} disabled={!history.length}>
              Undo
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void reset()}>
              Reset original
            </Button>
            <Button size="sm" onClick={downloadResult}>
              Download with colors
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border p-1">
              <button
                type="button"
                onClick={() => setMode("brush")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mode === "brush" ? "bg-brand text-white" : "text-muted hover:text-fg"
                }`}
              >
                Brush
              </button>
              <button
                type="button"
                onClick={() => setMode("fill")}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  mode === "fill" ? "bg-brand text-white" : "text-muted hover:text-fg"
                }`}
              >
                Fill
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={embedLegend} onChange={(e) => setEmbedLegend(e.target.checked)} />
              Embed color legend on image
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-border bg-surface-2 touch-none">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className="mx-auto block max-h-[70vh] w-auto max-w-full"
                  style={{
                    cursor:
                      mode === "brush"
                        ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='8' fill='none' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E") 12 12, crosshair`
                        : "crosshair",
                  }}
                />
              </div>
              <p className="text-sm text-muted">{status}</p>
            </div>

            <div className="space-y-4">
              {mode === "brush" ? (
                <>
                  <Field label="Brush size" hint="Bigger = faster walls">
                    <input
                      type="range"
                      min={12}
                      max={90}
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full accent-[var(--brand)]"
                    />
                    <Stat label="Size" value={brushSize} />
                  </Field>
                  <Field
                    label="Stay on same color"
                    hint="Lower = only similar pixels under brush (won’t bleed onto floor)"
                  >
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={colorLock}
                      onChange={(e) => setColorLock(Number(e.target.value))}
                      className="w-full accent-[var(--brand)]"
                    />
                    <Stat label="Lock" value={colorLock >= 95 ? "Off" : colorLock} />
                  </Field>
                </>
              ) : (
                <Field label="Fill range" hint="Higher = covers more of a lit wall">
                  <input
                    type="range"
                    min={25}
                    max={95}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-[var(--brand)]"
                  />
                  <Stat label="Range" value={tolerance} />
                </Field>
              )}

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Surfaces</p>
                <div className="space-y-2">
                  {zones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setActive(z.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                        active === z.id ? "border-brand bg-brand/5" : "border-border hover:bg-surface-2"
                      }`}
                    >
                      <input
                        type="color"
                        value={z.color}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setZoneColor(z.id, e.target.value)}
                        className="h-9 w-9 cursor-pointer rounded-lg border border-border bg-transparent p-0"
                        title={z.label}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{z.label}</span>
                        <span className="block truncate text-xs text-muted">{z.hint}</span>
                      </span>
                      <Input
                        value={z.color}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setZoneColor(z.id, e.target.value)}
                        className="w-[5.5rem] font-mono text-xs"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Ready-made palettes</p>
                <div className="flex flex-wrap gap-2">
                  {PALETTES.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPalette(p.name)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand"
                    >
                      <span className="mr-1.5 inline-flex gap-0.5">
                        {(Object.values(p.colors) as string[]).slice(0, 4).map((c) => (
                          <span key={c} className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                        ))}
                      </span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <Notice tone="success">
                Tip: use <strong>Brush</strong> for walls with windows/shadows. Keep “Stay on same color” around 40–55
                so the brush doesn’t paint furniture by mistake.
              </Notice>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
