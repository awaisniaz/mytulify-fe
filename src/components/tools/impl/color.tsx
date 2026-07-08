"use client";

import * as React from "react";
import { Input, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Notice } from "@/components/tools/shared";

/* ============================== Color math ================================= */
export type RGB = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RGB | null {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
export function rgbToHex({ r, g, b }: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}
export function rgbToHsl({ r, g, b }: RGB) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360; s /= 100; l /= 100;
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}
export function rgbToCmyk({ r, g, b }: RGB) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}
function luminance({ r, g, b }: RGB) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
export function contrastRatio(a: RGB, b: RGB) {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* ============================== Swatch UI ================================= */
function Swatch({ hex, big }: { hex: string; big?: boolean }) {
  return (
    <span
      className={`inline-block rounded-lg border border-border ${big ? "h-16 w-16" : "h-8 w-8"}`}
      style={{ background: hex }}
    />
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
      <span className="w-16 text-sm text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-all font-mono text-sm">{value}</span>
      <CopyButton value={value} />
    </div>
  );
}

/* ===================== All-formats converter (universal) =================== */
export function ColorConverter({ initial = "#6366f1" }: { initial?: string }) {
  const [hex, setHex] = React.useState(initial);
  const rgb = hexToRgb(hex) ?? { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb);
  const cmyk = rgbToCmyk(rgb);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="color"
          value={hexToRgb(hex) ? hex : "#6366f1"}
          onChange={(e) => setHex(e.target.value)}
          className="h-16 w-24 cursor-pointer rounded-xl border border-border bg-surface-2"
        />
        <div className="flex-1 min-w-48">
          <Field label="HEX">
            <Input value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono" />
          </Field>
        </div>
        <Swatch hex={hex} big />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Row label="HEX" value={rgbToHex(rgb).toUpperCase()} />
        <Row label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
        <Row label="RGBA" value={`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`} />
        <Row label="HSL" value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`} />
        <Row label="HSV" value={hsvString(rgb)} />
        <Row label="CMYK" value={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`} />
      </div>
    </div>
  );
}
function hsvString({ r, g, b }: RGB) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `hsv(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
}

/* ============================ Palette generator =========================== */
export function PaletteGenerator() {
  const [base, setBase] = React.useState("#6366f1");
  const rgb = hexToRgb(base) ?? { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb);
  const schemes: Record<string, number[]> = {
    Complementary: [0, 180],
    Analogous: [-30, 0, 30],
    Triadic: [0, 120, 240],
    Tetradic: [0, 90, 180, 270],
    "Split-Comp": [0, 150, 210],
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-border" />
        <Input value={base} onChange={(e) => setBase(e.target.value)} className="font-mono max-w-40" />
      </div>
      {Object.entries(schemes).map(([name, offsets]) => (
        <div key={name}>
          <p className="mb-2 text-sm font-medium">{name}</p>
          <div className="flex flex-wrap gap-2">
            {offsets.map((o, i) => {
              const h = (hsl.h + o + 360) % 360;
              const hex = rgbToHex(hslToRgb(h, hsl.s, hsl.l)).toUpperCase();
              return (
                <div key={i} className="overflow-hidden rounded-xl border border-border">
                  <div className="h-16 w-24" style={{ background: hex }} />
                  <div className="flex items-center justify-between gap-1 bg-surface-2 px-2 py-1.5">
                    <span className="font-mono text-xs">{hex}</span>
                    <CopyButton value={hex} label="" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================ Shades / Tints ============================== */
export function ShadesTints({ mode }: { mode: "shades" | "tints" | "both" }) {
  const [base, setBase] = React.useState("#6366f1");
  const rgb = hexToRgb(base) ?? { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb);
  const make = (target: number) =>
    Array.from({ length: 10 }, (_, i) => {
      const l = hsl.l + ((target - hsl.l) * (i + 1)) / 10;
      return rgbToHex(hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, l)))).toUpperCase();
    });
  const groups: [string, string[]][] = [];
  if (mode !== "tints") groups.push(["Shades (darker)", make(0)]);
  if (mode !== "shades") groups.push(["Tints (lighter)", make(100)]);
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-border" />
        <Input value={base} onChange={(e) => setBase(e.target.value)} className="font-mono max-w-40" />
      </div>
      {groups.map(([title, cols]) => (
        <div key={title}>
          <p className="mb-2 text-sm font-medium">{title}</p>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
            {cols.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => navigator.clipboard.writeText(c)}
                className="h-14 rounded-lg border border-border transition hover:scale-105"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      ))}
      <Notice tone="info">Tip: click any swatch to copy its hex.</Notice>
    </div>
  );
}

/* ============================ Contrast checker ============================ */
export function ContrastChecker() {
  const [fg, setFg] = React.useState("#ffffff");
  const [bg, setBg] = React.useState("#6366f1");
  const ratio = contrastRatio(hexToRgb(fg) ?? { r: 255, g: 255, b: 255 }, hexToRgb(bg) ?? { r: 0, g: 0, b: 0 });
  const grade = (min: number) => (ratio >= min ? "Pass" : "Fail");
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Text color">
          <div className="flex gap-2">
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-11 w-14 rounded-xl border border-border" />
            <Input value={fg} onChange={(e) => setFg(e.target.value)} className="font-mono" />
          </div>
        </Field>
        <Field label="Background color">
          <div className="flex gap-2">
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-14 rounded-xl border border-border" />
            <Input value={bg} onChange={(e) => setBg(e.target.value)} className="font-mono" />
          </div>
        </Field>
      </div>
      <div className="rounded-xl p-8 text-center" style={{ background: bg, color: fg }}>
        <p className="text-2xl font-bold">Almost before we knew it,</p>
        <p>we had left the ground.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
          <div className="text-2xl font-bold text-brand">{ratio.toFixed(2)}:1</div>
          <div className="text-xs text-muted">Contrast</div>
        </div>
        {[["AA Normal", 4.5], ["AA Large", 3], ["AAA Normal", 7]].map(([l, m]) => (
          <div key={l as string} className="rounded-xl border border-border bg-surface-2 p-4 text-center">
            <div className={`text-lg font-bold ${ratio >= (m as number) ? "text-emerald-500" : "text-rose-500"}`}>
              {grade(m as number)}
            </div>
            <div className="text-xs text-muted">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================ Gradient generator ========================== */
export function GradientGenerator() {
  const [c1, setC1] = React.useState("#6366f1");
  const [c2, setC2] = React.useState("#d946ef");
  const [angle, setAngle] = React.useState(135);
  const [type, setType] = React.useState<"linear" | "radial">("linear");
  const css =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${c1}, ${c2})`
      : `radial-gradient(circle, ${c1}, ${c2})`;
  return (
    <div className="space-y-5">
      <div className="h-44 rounded-2xl border border-border" style={{ background: css }} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Color 1">
          <input type="color" value={c1} onChange={(e) => setC1(e.target.value)} className="h-11 w-full rounded-xl border border-border" />
        </Field>
        <Field label="Color 2">
          <input type="color" value={c2} onChange={(e) => setC2(e.target.value)} className="h-11 w-full rounded-xl border border-border" />
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as "linear")} className="h-11 w-full rounded-xl border border-border bg-surface-2 px-3">
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </Field>
        <Field label={`Angle: ${angle}°`}>
          <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-full accent-[var(--brand)]" disabled={type === "radial"} />
        </Field>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all text-sm">background: {css};</code>
        <CopyButton value={`background: ${css};`} />
      </div>
    </div>
  );
}

/* ============================ Shadow generators =========================== */
export function ShadowGenerator({ kind }: { kind: "box" | "text" }) {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(8);
  const [blur, setBlur] = React.useState(24);
  const [spread, setSpread] = React.useState(0);
  const [color, setColor] = React.useState("#6366f1");
  const [opacity, setOpacity] = React.useState(40);
  const rgb = hexToRgb(color) ?? { r: 99, g: 102, b: 241 };
  const rgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
  const css =
    kind === "box"
      ? `${x}px ${y}px ${blur}px ${spread}px ${rgba}`
      : `${x}px ${y}px ${blur}px ${rgba}`;
  const prop = kind === "box" ? "box-shadow" : "text-shadow";
  return (
    <div className="space-y-5">
      <div className="grid place-items-center rounded-2xl border border-border bg-surface-2 p-12">
        {kind === "box" ? (
          <div className="h-28 w-44 rounded-2xl bg-surface" style={{ boxShadow: css }} />
        ) : (
          <p className="text-4xl font-bold" style={{ textShadow: css }}>
            Preview
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Slider label="Offset X" value={x} set={setX} min={-50} max={50} />
        <Slider label="Offset Y" value={y} set={setY} min={-50} max={50} />
        <Slider label="Blur" value={blur} set={setBlur} min={0} max={100} />
        {kind === "box" && <Slider label="Spread" value={spread} set={setSpread} min={-50} max={50} />}
        <Slider label="Opacity %" value={opacity} set={setOpacity} min={0} max={100} />
        <Field label="Color">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-full rounded-xl border border-border" />
        </Field>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
        <code className="min-w-0 flex-1 break-all text-sm">{prop}: {css};</code>
        <CopyButton value={`${prop}: ${css};`} />
      </div>
    </div>
  );
}
function Slider({ label, value, set, min, max }: { label: string; value: number; set: (n: number) => void; min: number; max: number }) {
  return (
    <Field label={`${label}: ${value}`}>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)} className="w-full accent-[var(--brand)]" />
    </Field>
  );
}

/* ============================ Random / mixer ============================== */
export function RandomColor() {
  const [colors, setColors] = React.useState<string[]>([]);
  const gen = React.useCallback(() => {
    const arr = Array.from({ length: 10 }, () => {
      const v = Math.floor(Math.random() * 0xffffff);
      return "#" + v.toString(16).padStart(6, "0").toUpperCase();
    });
    setColors(arr);
  }, []);
  React.useEffect(() => gen(), [gen]);
  return (
    <div className="space-y-4">
      <Button onClick={gen}>Generate random colors</Button>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {colors.map((c) => (
          <div key={c} className="overflow-hidden rounded-xl border border-border">
            <div className="h-24" style={{ background: c }} />
            <div className="flex items-center justify-between gap-1 bg-surface-2 px-2 py-1.5">
              <span className="font-mono text-xs">{c}</span>
              <CopyButton value={c} label="" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ColorMixer() {
  const [a, setA] = React.useState("#6366f1");
  const [b, setB] = React.useState("#f59e0b");
  const [ratio, setRatio] = React.useState(50);
  const ra = hexToRgb(a)!, rb = hexToRgb(b)!;
  const t = ratio / 100;
  const mix = rgbToHex({
    r: ra.r * (1 - t) + rb.r * t,
    g: ra.g * (1 - t) + rb.g * t,
    b: ra.b * (1 - t) + rb.b * t,
  }).toUpperCase();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <input type="color" value={a} onChange={(e) => setA(e.target.value)} className="h-16 w-full rounded-xl border border-border" />
        <div className="rounded-xl border border-border" style={{ background: mix }} />
        <input type="color" value={b} onChange={(e) => setB(e.target.value)} className="h-16 w-full rounded-xl border border-border" />
      </div>
      <Slider label="Mix ratio %" value={ratio} set={setRatio} min={0} max={100} />
      <Row label="Result" value={mix} />
    </div>
  );
}

/* ====================== Harmony (complementary etc.) ===================== */
export function Harmony({ offsets, title }: { offsets: number[]; title: string }) {
  const [base, setBase] = React.useState("#6366f1");
  const rgb = hexToRgb(base) ?? { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb);
  const cols = offsets.map((o) => rgbToHex(hslToRgb((hsl.h + o + 360) % 360, hsl.s, hsl.l)).toUpperCase());
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-11 w-16 rounded-xl border border-border" />
        <Input value={base} onChange={(e) => setBase(e.target.value)} className="font-mono max-w-40" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-3">
        {cols.map((c, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border">
            <div className="h-24 w-28" style={{ background: c }} />
            <div className="flex items-center justify-between gap-1 bg-surface-2 px-2 py-1.5">
              <span className="font-mono text-xs">{c}</span>
              <CopyButton value={c} label="" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====================== Color name finder =============================== */
const NAMED: [string, string][] = [
  ["Black", "#000000"], ["White", "#FFFFFF"], ["Red", "#FF0000"], ["Lime", "#00FF00"],
  ["Blue", "#0000FF"], ["Yellow", "#FFFF00"], ["Cyan", "#00FFFF"], ["Magenta", "#FF00FF"],
  ["Silver", "#C0C0C0"], ["Gray", "#808080"], ["Maroon", "#800000"], ["Olive", "#808000"],
  ["Green", "#008000"], ["Purple", "#800080"], ["Teal", "#008080"], ["Navy", "#000080"],
  ["Orange", "#FFA500"], ["Pink", "#FFC0CB"], ["Gold", "#FFD700"], ["Indigo", "#4B0082"],
  ["Violet", "#EE82EE"], ["Coral", "#FF7F50"], ["Salmon", "#FA8072"], ["Crimson", "#DC143C"],
  ["Tomato", "#FF6347"], ["Khaki", "#F0E68C"], ["Turquoise", "#40E0D0"], ["Lavender", "#E6E6FA"],
  ["Beige", "#F5F5DC"], ["Brown", "#A52A2A"], ["Chocolate", "#D2691E"], ["SkyBlue", "#87CEEB"],
  ["SlateGray", "#708090"], ["SeaGreen", "#2E8B57"], ["Tan", "#D2B48C"], ["Plum", "#DDA0DD"],
];
export function ColorNameFinder() {
  const [hex, setHex] = React.useState("#6366f1");
  const rgb = hexToRgb(hex) ?? { r: 99, g: 102, b: 241 };
  let best = NAMED[0], bestD = Infinity;
  for (const [, h] of NAMED) {
    const c = hexToRgb(h)!;
    const d = (c.r - rgb.r) ** 2 + (c.g - rgb.g) ** 2 + (c.b - rgb.b) ** 2;
    if (d < bestD) { bestD = d; best = NAMED.find((x) => x[1] === h)!; }
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-16 w-24 rounded-xl border border-border" />
        <Input value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono max-w-40" />
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-4">
        <span className="h-12 w-12 rounded-lg border border-border" style={{ background: best[1] }} />
        <div>
          <p className="text-lg font-semibold">{best[0]}</p>
          <p className="font-mono text-sm text-muted">{best[1]} · nearest named color</p>
        </div>
      </div>
    </div>
  );
}

/* ====================== Hex → solid image =============================== */
export function HexToImage() {
  const [hex, setHex] = React.useState("#6366f1");
  const [w, setW] = React.useState(800);
  const [h, setH] = React.useState(400);
  const make = () => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = hex; ctx.fillRect(0, 0, w, h);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png"); a.download = `${hex.replace("#", "")}.png`; a.click();
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-11 w-16 rounded-xl border border-border" />
        <Input value={hex} onChange={(e) => setHex(e.target.value)} className="font-mono max-w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Width"><Input type="number" value={w} onChange={(e) => setW(+e.target.value)} /></Field>
        <Field label="Height"><Input type="number" value={h} onChange={(e) => setH(+e.target.value)} /></Field>
      </div>
      <div className="h-32 rounded-xl border border-border" style={{ background: hex }} />
      <Button onClick={make}>Download PNG</Button>
    </div>
  );
}

/* ====================== Color blindness simulator ====================== */
export function ColorBlindnessSim() {
  const [src, setSrc] = React.useState("");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [type, setType] = React.useState("protanopia");
  const matrices: Record<string, number[]> = {
    protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
  };
  React.useEffect(() => {
    if (!src || !canvasRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      const c = canvasRef.current!; c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height);
      const m = matrices[type];
      for (let i = 0; i < data.data.length; i += 4) {
        const [r, g, b] = [data.data[i], data.data[i + 1], data.data[i + 2]];
        data.data[i] = r * m[0] + g * m[1] + b * m[2];
        data.data[i + 1] = r * m[3] + g * m[4] + b * m[5];
        data.data[i + 2] = r * m[6] + g * m[7] + b * m[8];
      }
      ctx.putImageData(data, 0, 0);
    };
    img.src = src;
  }, [src, type]);
  if (!src) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface-2 p-10 cursor-pointer" onClick={() => document.getElementById("cb-up")?.click()}>
        <p className="text-sm font-medium">Upload an image to simulate color blindness</p>
        <input id="cb-up" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setSrc(r.result as string); r.readAsDataURL(f); } }} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <Field label="Vision type"><select value={type} onChange={(e) => setType(e.target.value)} className="h-11 rounded-xl border border-border bg-surface-2 px-3"><option value="protanopia">Protanopia (red-blind)</option><option value="deuteranopia">Deuteranopia (green-blind)</option><option value="tritanopia">Tritanopia (blue-blind)</option></select></Field>
      <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-4 text-center"><canvas ref={canvasRef} className="mx-auto max-w-full" style={{ maxHeight: 360 }} /></div>
      <Button variant="outline" onClick={() => setSrc("")}>Upload another</Button>
    </div>
  );
}

/* ====================== Image color picker / extractor ================= */
export function ImageColorPicker({ extract }: { extract?: boolean }) {
  const [src, setSrc] = React.useState("");
  const [picked, setPicked] = React.useState("");
  const [palette, setPalette] = React.useState<string[]>([]);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (!src || !canvasRef.current) return;
    const img = new window.Image();
    img.onload = () => {
      const c = canvasRef.current!;
      const scale = Math.min(1, 600 / img.width);
      c.width = img.width * scale; c.height = img.height * scale;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, c.width, c.height);
      if (extract) {
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        const buckets = new Map<string, number>();
        for (let i = 0; i < data.length; i += 40) {
          const key = `${Math.round(data[i] / 32) * 32},${Math.round(data[i + 1] / 32) * 32},${Math.round(data[i + 2] / 32) * 32}`;
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        setPalette([...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => {
          const [r, g, b] = k.split(",").map(Number);
          return rgbToHex({ r, g, b }).toUpperCase();
        }));
      }
    };
    img.src = src;
  }, [src, extract]);
  const pick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (c.width / rect.width);
    const y = (e.clientY - rect.top) * (c.height / rect.height);
    const [r, g, b] = c.getContext("2d")!.getImageData(x, y, 1, 1).data;
    setPicked(rgbToHex({ r, g, b }).toUpperCase());
  };
  if (!src) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-surface-2 p-10 cursor-pointer" onClick={() => document.getElementById("cp-up")?.click()}>
        <p className="text-sm font-medium">Upload an image to {extract ? "extract its palette" : "pick colors from it"}</p>
        <input id="cp-up" type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setSrc(r.result as string); r.readAsDataURL(f); } }} />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-3 text-center">
        <canvas ref={canvasRef} onClick={pick} className="mx-auto max-w-full cursor-crosshair" style={{ maxHeight: 360 }} />
      </div>
      {!extract && picked && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
          <span className="h-10 w-10 rounded-lg border border-border" style={{ background: picked }} />
          <span className="flex-1 font-mono">{picked}</span>
          <CopyButton value={picked} />
        </div>
      )}
      {extract && (
        <div className="flex flex-wrap gap-2">
          {palette.map((c) => (
            <div key={c} className="overflow-hidden rounded-xl border border-border">
              <div className="h-16 w-20" style={{ background: c }} />
              <div className="flex items-center gap-1 bg-surface-2 px-2 py-1 font-mono text-xs">{c}<CopyButton value={c} label="" /></div>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={() => setSrc("")}>Upload another</Button>
    </div>
  );
}

/* ====================== Lighten / darken ================================= */
export function LightenDarken() {
  const [base, setBase] = React.useState("#6366f1");
  const [amt, setAmt] = React.useState(0);
  const rgb = hexToRgb(base) ?? { r: 99, g: 102, b: 241 };
  const hsl = rgbToHsl(rgb);
  const out = rgbToHex(hslToRgb(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + amt)))).toUpperCase();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input type="color" value={base} onChange={(e) => setBase(e.target.value)} className="h-11 w-16 rounded-xl border border-border" />
        <Input value={base} onChange={(e) => setBase(e.target.value)} className="font-mono max-w-40" />
      </div>
      <Slider label="Adjust lightness %" value={amt} set={setAmt} min={-100} max={100} />
      <div className="grid grid-cols-2 gap-3">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="h-24" style={{ background: base }} />
          <div className="bg-surface-2 px-2 py-1.5 text-center font-mono text-xs">{base.toUpperCase()}</div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="h-24" style={{ background: out }} />
          <div className="flex items-center justify-between bg-surface-2 px-2 py-1.5 font-mono text-xs">
            {out} <CopyButton value={out} label="" />
          </div>
        </div>
      </div>
    </div>
  );
}
