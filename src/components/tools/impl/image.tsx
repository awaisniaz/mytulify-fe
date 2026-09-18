"use client";

import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice, CopyButton, Output } from "@/components/tools/shared";
import { brand } from "@/lib/brand";
import { formatBytes } from "@/lib/utils";

function useImage() {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  const [name, setName] = React.useState("");
  const [size, setSize] = React.useState(0);
  const onFiles = React.useCallback((files: File[]) => {
    const f = files[0];
    if (!f) return;
    setName(f.name.replace(/\.[^.]+$/, ""));
    setSize(f.size);
    const url = URL.createObjectURL(f);
    const image = new window.Image();
    image.onload = () => { setImg(image); URL.revokeObjectURL(url); };
    image.src = url;
  }, []);
  return { img, name, size, onFiles, reset: () => setImg(null) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), type, quality));
}

/** Download via anchor pointing at an object URL. */
function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}

type ProcessorProps = {
  controls?: (img: HTMLImageElement) => React.ReactNode;
  draw: (canvas: HTMLCanvasElement, img: HTMLImageElement) => void;
  outType?: string; outExt?: string; quality?: number; deps?: unknown[];
};

/** Generic processor: upload → draw(canvas,img) → preview + download. */
function Processor(props: ProcessorProps) {
  const { img, name, size, onFiles, reset } = useImage();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [outSize, setOutSize] = React.useState(0);
  const urlRef = React.useRef("");
  const { draw, outType = "image/png", outExt = "png", quality, controls, deps = [] } = props;

  React.useEffect(() => {
    if (!img || !canvasRef.current) return;
    draw(canvasRef.current, img);
    canvasToBlob(canvasRef.current, outType, quality).then((b) => {
      setOutSize(b.size);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, outType, quality, ...deps]);

  if (!img) return <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image or click to upload" />;
  return (
    <div className="space-y-4">
      {controls?.(img)}
      <p className="text-xs text-muted">{img.naturalWidth}×{img.naturalHeight}px{name ? ` · ${name}` : ""}</p>
      <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-4 text-center">
        <canvas ref={canvasRef} className="mx-auto max-w-full" style={{ maxHeight: 400 }} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => urlRef.current && downloadUrl(urlRef.current, `${name}.${outExt}`)}>Download {outExt.toUpperCase()}</Button>
        <CopyButton value={urlRef.current} label="Copy data URL" />
        <Button variant="outline" onClick={reset}>Upload another</Button>
        {outSize > 0 && (
          <span className="text-sm text-muted">
            {size > 0 && `${formatBytes(size)} → `}{formatBytes(outSize)}
            {size > 0 && outSize < size && <span className="text-emerald-500"> (−{Math.round((1 - outSize / size) * 100)}%)</span>}
          </span>
        )}
      </div>
    </div>
  );
}

const drawBase = (c: HTMLCanvasElement, img: HTMLImageElement) => {
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
};

/* ------------------------------ Convert ------------------------------------ */
export function ImageConvert({ to }: { to: "png" | "jpeg" | "webp" }) {
  const [q, setQ] = React.useState(92);
  const lossy = to !== "png";
  return (
    <Processor
      draw={drawBase}
      outType={`image/${to}`}
      outExt={to === "jpeg" ? "jpg" : to}
      quality={lossy ? q / 100 : undefined}
      deps={[q]}
      controls={lossy ? () => (
        <Field label={`Quality: ${q}%`}>
          <input type="range" min={10} max={100} value={q} onChange={(e) => setQ(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      ) : undefined}
    />
  );
}

/* ------------------------------ Resize ------------------------------------- */
export function ResizeImage() {
  const [w, setW] = React.useState(0);
  const [h, setH] = React.useState(0);
  const [lock, setLock] = React.useState(true);
  const ratio = React.useRef(1);
  return (
    <Processor
      deps={[w, h]}
      draw={(c, img) => {
        const tw = w || img.naturalWidth, th = h || img.naturalHeight;
        c.width = tw; c.height = th;
        c.getContext("2d")!.drawImage(img, 0, 0, tw, th);
      }}
      controls={(img) => {
        if (!w) { setW(img.naturalWidth); setH(img.naturalHeight); ratio.current = img.naturalWidth / img.naturalHeight; }
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Width (px)"><Input type="number" value={w} onChange={(e) => { const v = +e.target.value; setW(v); if (lock) setH(Math.round(v / ratio.current)); }} /></Field>
              <Field label="Height (px)"><Input type="number" value={h} onChange={(e) => { const v = +e.target.value; setH(v); if (lock) setW(Math.round(v * ratio.current)); }} /></Field>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} /> Lock aspect ratio</label>
          </div>
        );
      }}
    />
  );
}

/* ------------------------------ Compress ----------------------------------- */
export function CompressImage() {
  const [q, setQ] = React.useState(70);
  return (
    <Processor
      deps={[q]} outType="image/jpeg" outExt="jpg" quality={q / 100}
      draw={drawBase}
      controls={() => <Field label={`Quality: ${q}%`}><input type="range" min={10} max={100} value={q} onChange={(e) => setQ(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>}
    />
  );
}

/* ------------------------------ Rotate / flip ------------------------------ */
export function RotateImage() {
  const [deg, setDeg] = React.useState(90);
  return (
    <Processor
      deps={[deg]}
      draw={(c, img) => {
        const rad = (deg * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
        const w = img.naturalWidth, h = img.naturalHeight;
        c.width = w * cos + h * sin; c.height = w * sin + h * cos;
        const ctx = c.getContext("2d")!;
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(img, -w / 2, -h / 2);
      }}
      controls={() => (
        <div className="flex flex-wrap items-end gap-3">
          <Field label={`Angle: ${deg}°`}><input type="range" min={0} max={360} value={deg} onChange={(e) => setDeg(+e.target.value)} className="w-64 accent-[var(--brand)]" /></Field>
          {[90, 180, 270].map((d) => <Button key={d} variant="secondary" size="sm" onClick={() => setDeg(d)}>{d}°</Button>)}
        </div>
      )}
    />
  );
}
export function FlipImage() {
  const [dir, setDir] = React.useState<"h" | "v" | "both">("h");
  return (
    <Processor
      deps={[dir]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        const sx = dir === "v" ? 1 : -1;
        const sy = dir === "h" ? 1 : -1;
        ctx.translate(sx === -1 ? c.width : 0, sy === -1 ? c.height : 0);
        ctx.scale(sx, sy);
        ctx.drawImage(img, 0, 0);
      }}
      controls={() => (
        <Select value={dir} onChange={(e) => setDir(e.target.value as "h")} className="max-w-48">
          <option value="h">Horizontal</option>
          <option value="v">Vertical</option>
          <option value="both">Both</option>
        </Select>
      )}
    />
  );
}

/* ------------------------------ Filters ------------------------------------ */
export function FilterImage({ kind }: { kind: "grayscale" | "blur" | "pixelate" }) {
  const [amt, setAmt] = React.useState(kind === "blur" ? 5 : kind === "grayscale" ? 100 : 10);
  return (
    <Processor
      deps={[amt]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        if (kind === "grayscale") { ctx.filter = `grayscale(${amt}%)`; ctx.drawImage(img, 0, 0); ctx.filter = "none"; }
        else if (kind === "blur") { ctx.filter = `blur(${amt}px)`; ctx.drawImage(img, 0, 0); ctx.filter = "none"; }
        else {
          const s = Math.max(1, amt);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, c.width / s, c.height / s);
          ctx.drawImage(c, 0, 0, c.width / s, c.height / s, 0, 0, c.width, c.height);
        }
      }}
      controls={() => (
        <Field label={`${kind === "blur" ? "Blur" : kind === "grayscale" ? "Amount" : "Pixel size"}: ${amt}${kind === "grayscale" ? "%" : ""}`}>
          <input type="range" min={1} max={kind === "grayscale" ? 100 : 40} value={amt} onChange={(e) => setAmt(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      )}
    />
  );
}

/* ------------------------------ Circle crop -------------------------------- */
export function CircleCrop() {
  const [pad, setPad] = React.useState(0);
  const [bg, setBg] = React.useState("#ffffff");
  return (
    <Processor
      deps={[pad, bg]}
      outType="image/png" outExt="png"
      draw={(c, img) => {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        const extra = Math.round(s * (pad / 100));
        const size = s + extra * 2;
        c.width = size; c.height = size;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, size, size);
        ctx.beginPath(); ctx.arc(size / 2, size / 2, s / 2, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, extra, extra, s, s);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Padding ${pad}%`}><input type="range" min={0} max={40} value={pad} onChange={(e) => setPad(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
        </div>
      )}
    />
  );
}

/* ------------------------------ Watermark ---------------------------------- */
export function WatermarkImage() {
  const [text, setText] = React.useState(`© ${brand.name}`);
  const [opacity, setOpacity] = React.useState(50);
  const [sizePct, setSize] = React.useState(5);
  const [pos, setPos] = React.useState("br");
  return (
    <Processor
      deps={[text, opacity, sizePct, pos]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const fs = (c.width * sizePct) / 100;
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${opacity / 100})`;
        ctx.strokeStyle = `rgba(0,0,0,${opacity / 200})`;
        const pad = fs * 0.5;
        const align = pos === "bl" || pos === "tl" ? "left" : pos === "c" ? "center" : "right";
        const base = pos === "t" || pos === "tl" || pos === "tr" ? "top" : pos === "c" ? "middle" : "bottom";
        ctx.textAlign = align;
        ctx.textBaseline = base;
        const x = pos === "bl" || pos === "tl" ? pad : pos === "c" || pos === "t" || pos === "b" ? c.width / 2 : c.width - pad;
        const y = pos === "tl" || pos === "tr" || pos === "t" ? pad : pos === "c" ? c.height / 2 : c.height - pad;
        ctx.fillText(text, x, y);
        ctx.strokeText(text, x, y);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Watermark text"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <Field label={`Opacity ${opacity}%`}><input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label={`Size ${sizePct}%`}><input type="range" min={2} max={15} value={sizePct} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label="Position">
            <Select value={pos} onChange={(e) => setPos(e.target.value)}>
              <option value="br">Bottom right</option>
              <option value="bl">Bottom left</option>
              <option value="tr">Top right</option>
              <option value="tl">Top left</option>
              <option value="c">Center</option>
            </Select>
          </Field>
        </div>
      )}
    />
  );
}

/* ------------------------------ Meme generator ----------------------------- */
export function MemeGenerator() {
  const [top, setTop] = React.useState("TOP TEXT");
  const [bottom, setBottom] = React.useState("BOTTOM TEXT");
  const [size, setSize] = React.useState(12);
  const [color, setColor] = React.useState("#ffffff");
  const [stroke, setStroke] = React.useState("#000000");
  const [caps, setCaps] = React.useState(true);
  return (
    <Processor
      deps={[top, bottom, size, color, stroke, caps]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const fs = c.width / Math.max(6, size);
        const t = caps ? top.toUpperCase() : top;
        const b = caps ? bottom.toUpperCase() : bottom;
        ctx.font = `bold ${fs}px Impact, sans-serif`;
        ctx.textAlign = "center"; ctx.fillStyle = color; ctx.strokeStyle = stroke; ctx.lineWidth = fs / 18;
        ctx.textBaseline = "top";
        ctx.strokeText(t, c.width / 2, 10); ctx.fillText(t, c.width / 2, 10);
        ctx.textBaseline = "bottom";
        ctx.strokeText(b, c.width / 2, c.height - 10); ctx.fillText(b, c.width / 2, c.height - 10);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Top text"><Input value={top} onChange={(e) => setTop(e.target.value)} /></Field>
          <Field label="Bottom text"><Input value={bottom} onChange={(e) => setBottom(e.target.value)} /></Field>
          <Field label={`Size (1/${size} of width)`}><input type="range" min={6} max={20} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label="Fill"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
          <Field label="Outline"><input type="color" value={stroke} onChange={(e) => setStroke(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={caps} onChange={(e) => setCaps(e.target.checked)} /> ALL CAPS</label>
        </div>
      )}
    />
  );
}

/* ------------------------------ Image → Base64 ----------------------------- */
export function ImageToBase64() {
  const [out, setOut] = React.useState("");
  const [name, setName] = React.useState("image");
  const onFiles = (files: File[]) => {
    const f = files[0]; if (!f) return;
    setName(f.name.replace(/\.[^.]+$/, "") || "image");
    const r = new FileReader(); r.onload = () => setOut(r.result as string); r.readAsDataURL(f);
  };
  const css = out ? `background-image: url("${out}");` : "";
  const imgTag = out ? `<img src="${out}" alt="${name}" />` : "";
  if (!out) return <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image to encode" />;
  return (
    <div className="space-y-3">
      <textarea readOnly value={out} rows={6} className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs" />
      <div className="flex flex-wrap gap-2">
        <CopyButton value={out} label="Copy data URL" />
        <CopyButton value={css} label="Copy CSS" />
        <CopyButton value={imgTag} label="Copy <img>" />
        <Button variant="outline" onClick={() => setOut("")}>Reset</Button>
      </div>
      <Output value={`${css}\n\n${imgTag}`} rows={4} filename={`${name}-base64.txt`} />
    </div>
  );
}
export function Base64ToImage() {
  const [input, setInput] = React.useState("");
  const valid = input.startsWith("data:image");
  return (
    <div className="space-y-3">
      <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5} placeholder="Paste a data:image/... Base64 string" className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs" />
      {input && !valid && <Notice tone="error">Must start with data:image/…</Notice>}
      {valid && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={input} alt="decoded" className="mx-auto max-h-80 rounded-xl border border-border" />
          <Button onClick={() => downloadUrl(input, "image.png")}>Download image</Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Crop --------------------------------------- */
export function CropImage() {
  const [x, setX] = React.useState(10);
  const [y, setY] = React.useState(10);
  const [w, setW] = React.useState(80);
  const [h, setH] = React.useState(80);
  return (
    <Processor
      deps={[x, y, w, h]}
      draw={(c, img) => {
        const sx = (x / 100) * img.naturalWidth;
        const sy = (y / 100) * img.naturalHeight;
        const sw = (w / 100) * img.naturalWidth;
        const sh = (h / 100) * img.naturalHeight;
        c.width = sw; c.height = sh;
        c.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={`X: ${x}%`}><input type="range" min={0} max={90} value={x} onChange={(e) => setX(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label={`Y: ${y}%`}><input type="range" min={0} max={90} value={y} onChange={(e) => setY(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label={`Width: ${w}%`}><input type="range" min={10} max={100} value={w} onChange={(e) => setW(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label={`Height: ${h}%`}><input type="range" min={10} max={100} value={h} onChange={(e) => setH(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
        </div>
      )}
    />
  );
}

/* ------------------------------ Passport photo ----------------------------- */
export function PassportPhoto() {
  const presets: Record<string, [number, number]> = {
    "US/India 2×2 in (600×600)": [600, 600],
    "Passport 35×45 mm (413×531)": [413, 531],
    "Visa 2×2 (600×600)": [600, 600],
    "EU 35×45 mm (413×531)": [413, 531],
  };
  const [preset, setPreset] = React.useState(Object.keys(presets)[0]);
  const [bg, setBg] = React.useState("#ffffff");
  const [tw, th] = presets[preset];
  return (
    <Processor
      deps={[preset, bg]} outType="image/jpeg" outExt="jpg" quality={0.95}
      draw={(c, img) => {
        c.width = tw; c.height = th;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = bg; ctx.fillRect(0, 0, tw, th);
        const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Photo size"><Select value={preset} onChange={(e) => setPreset(e.target.value)}>{Object.keys(presets).map((k) => <option key={k}>{k}</option>)}</Select></Field>
          <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
        </div>
      )}
    />
  );
}

/* ------------------------------ Combine images ----------------------------- */
export function CombineImages() {
  const [imgs, setImgs] = React.useState<HTMLImageElement[]>([]);
  const [dir, setDir] = React.useState<"h" | "v">("v");
  const [gap, setGap] = React.useState(0);
  const [bg, setBg] = React.useState("#ffffff");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const urlRef = React.useRef("");
  const add = (files: File[]) => {
    files.forEach((f) => {
      const img = new window.Image();
      img.onload = () => setImgs((p) => [...p, img]);
      img.src = URL.createObjectURL(f);
    });
  };
  React.useEffect(() => {
    if (!imgs.length || !canvasRef.current) return;
    const c = canvasRef.current;
    const g = Math.max(0, gap);
    if (dir === "v") {
      c.width = Math.max(...imgs.map((i) => i.naturalWidth));
      c.height = imgs.reduce((s, i) => s + i.naturalHeight, 0) + g * Math.max(0, imgs.length - 1);
    } else {
      c.height = Math.max(...imgs.map((i) => i.naturalHeight));
      c.width = imgs.reduce((s, i) => s + i.naturalWidth, 0) + g * Math.max(0, imgs.length - 1);
    }
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height);
    let off = 0;
    for (const i of imgs) {
      if (dir === "v") { ctx.drawImage(i, (c.width - i.naturalWidth) / 2, off); off += i.naturalHeight + g; }
      else { ctx.drawImage(i, off, (c.height - i.naturalHeight) / 2); off += i.naturalWidth + g; }
    }
    c.toBlob((b) => { if (b) { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = URL.createObjectURL(b); } });
  }, [imgs, dir, gap, bg]);
  return (
    <div className="space-y-4">
      <FileDrop accept="image/*" multiple onFiles={add} label="Add images to combine" />
      {imgs.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select value={dir} onChange={(e) => setDir(e.target.value as "h")} className="max-w-48"><option value="v">Stack vertically</option><option value="h">Stack horizontally</option></Select>
            <Field label={`Gap ${gap}px`}><input type="range" min={0} max={80} value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
            <Field label="Background"><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
          </div>
          <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-3 text-center"><canvas ref={canvasRef} className="mx-auto max-w-full" style={{ maxHeight: 360 }} /></div>
          <div className="flex gap-2">
            <Button onClick={() => urlRef.current && downloadUrl(urlRef.current, "combined.png")}>Download PNG</Button>
            <Button variant="outline" onClick={() => setImgs([])}>Clear</Button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Favicon ------------------------------------ */
export function FaviconGenerator() {
  const { img, onFiles } = useImage();
  const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
  if (!img) return <FileDrop accept="image/*" onFiles={onFiles} label="Upload a square image (logo)" />;
  const make = (s: number) => {
    const c = document.createElement("canvas"); c.width = s; c.height = s;
    c.getContext("2d")!.drawImage(img, 0, 0, s, s);
    return c.toDataURL("image/png");
  };
  const html = `<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />\n<link rel="apple-touch-icon" sizes="180x180" href="/favicon-180x180.png" />`;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {sizes.map((s) => (
          <button key={s} type="button" onClick={() => downloadUrl(make(s), `favicon-${s}x${s}.png`)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface-2 p-2 hover:bg-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={make(s)} alt={`${s}`} width={Math.min(s, 48)} height={Math.min(s, 48)} />
            <span className="text-xs text-muted">{s}px</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => sizes.forEach((s) => downloadUrl(make(s), `favicon-${s}x${s}.png`))}>Download all sizes</Button>
        <CopyButton value={html} label="Copy HTML tags" />
      </div>
      <Notice tone="info">Click any size to download that favicon PNG. 180px is the Apple touch icon.</Notice>
    </div>
  );
}
