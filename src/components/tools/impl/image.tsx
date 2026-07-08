"use client";

import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice, CopyButton } from "@/components/tools/shared";
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
      <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-4 text-center">
        <canvas ref={canvasRef} className="mx-auto max-w-full" style={{ maxHeight: 400 }} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => urlRef.current && downloadUrl(urlRef.current, `${name}.${outExt}`)}>Download {outExt.toUpperCase()}</Button>
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
  return <Processor draw={drawBase} outType={`image/${to}`} outExt={to === "jpeg" ? "jpg" : to} quality={to === "png" ? undefined : 0.92} />;
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
  const [dir, setDir] = React.useState<"h" | "v">("h");
  return (
    <Processor
      deps={[dir]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.translate(dir === "h" ? c.width : 0, dir === "v" ? c.height : 0);
        ctx.scale(dir === "h" ? -1 : 1, dir === "v" ? -1 : 1);
        ctx.drawImage(img, 0, 0);
      }}
      controls={() => <Select value={dir} onChange={(e) => setDir(e.target.value as "h")} className="max-w-48"><option value="h">Horizontal</option><option value="v">Vertical</option></Select>}
    />
  );
}

/* ------------------------------ Filters ------------------------------------ */
export function FilterImage({ kind }: { kind: "grayscale" | "blur" | "pixelate" }) {
  const [amt, setAmt] = React.useState(kind === "blur" ? 5 : 10);
  return (
    <Processor
      deps={[amt]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        if (kind === "grayscale") { ctx.filter = "grayscale(1)"; ctx.drawImage(img, 0, 0); ctx.filter = "none"; }
        else if (kind === "blur") { ctx.filter = `blur(${amt}px)`; ctx.drawImage(img, 0, 0); ctx.filter = "none"; }
        else {
          const s = Math.max(1, amt);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, c.width / s, c.height / s);
          ctx.drawImage(c, 0, 0, c.width / s, c.height / s, 0, 0, c.width, c.height);
        }
      }}
      controls={() => kind === "grayscale" ? null : (
        <Field label={`${kind === "blur" ? "Blur" : "Pixel size"}: ${amt}`}><input type="range" min={1} max={kind === "blur" ? 40 : 40} value={amt} onChange={(e) => setAmt(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
      )}
    />
  );
}

/* ------------------------------ Circle crop -------------------------------- */
export function CircleCrop() {
  return (
    <Processor
      outType="image/png" outExt="png"
      draw={(c, img) => {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        c.width = s; c.height = s;
        const ctx = c.getContext("2d")!;
        ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, s, s);
      }}
    />
  );
}

/* ------------------------------ Watermark ---------------------------------- */
export function WatermarkImage() {
  const [text, setText] = React.useState(`© ${brand.name}`);
  const [opacity, setOpacity] = React.useState(50);
  const [sizePct, setSize] = React.useState(5);
  return (
    <Processor
      deps={[text, opacity, sizePct]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const fs = (c.width * sizePct) / 100;
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${opacity / 100})`;
        ctx.strokeStyle = `rgba(0,0,0,${opacity / 200})`;
        ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.fillText(text, c.width - fs * 0.5, c.height - fs * 0.5);
        ctx.strokeText(text, c.width - fs * 0.5, c.height - fs * 0.5);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Watermark text"><Input value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <Field label={`Opacity ${opacity}%`}><input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
          <Field label={`Size ${sizePct}%`}><input type="range" min={2} max={15} value={sizePct} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
        </div>
      )}
    />
  );
}

/* ------------------------------ Meme generator ----------------------------- */
export function MemeGenerator() {
  const [top, setTop] = React.useState("TOP TEXT");
  const [bottom, setBottom] = React.useState("BOTTOM TEXT");
  return (
    <Processor
      deps={[top, bottom]}
      draw={(c, img) => {
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const fs = c.width / 12;
        ctx.font = `bold ${fs}px Impact, sans-serif`;
        ctx.textAlign = "center"; ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = fs / 18;
        ctx.textBaseline = "top";
        ctx.fillText(top.toUpperCase(), c.width / 2, 10); ctx.strokeText(top.toUpperCase(), c.width / 2, 10);
        ctx.textBaseline = "bottom";
        ctx.fillText(bottom.toUpperCase(), c.width / 2, c.height - 10); ctx.strokeText(bottom.toUpperCase(), c.width / 2, c.height - 10);
      }}
      controls={() => (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Top text"><Input value={top} onChange={(e) => setTop(e.target.value)} /></Field>
          <Field label="Bottom text"><Input value={bottom} onChange={(e) => setBottom(e.target.value)} /></Field>
        </div>
      )}
    />
  );
}

/* ------------------------------ Image → Base64 ----------------------------- */
export function ImageToBase64() {
  const [out, setOut] = React.useState("");
  const onFiles = (files: File[]) => {
    const f = files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setOut(r.result as string); r.readAsDataURL(f);
  };
  if (!out) return <FileDrop accept="image/*" onFiles={onFiles} label="Drop an image to encode" />;
  return (
    <div className="space-y-3">
      <textarea readOnly value={out} rows={8} className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs" />
      <div className="flex gap-2"><CopyButton value={out} /><Button variant="outline" onClick={() => setOut("")}>Reset</Button></div>
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
  const [tw, th] = presets[preset];
  return (
    <Processor
      deps={[preset]} outType="image/jpeg" outExt="jpg" quality={0.95}
      draw={(c, img) => {
        c.width = tw; c.height = th;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, tw, th);
        const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
      }}
      controls={() => (
        <Field label="Photo size"><Select value={preset} onChange={(e) => setPreset(e.target.value)}>{Object.keys(presets).map((k) => <option key={k}>{k}</option>)}</Select></Field>
      )}
    />
  );
}

/* ------------------------------ Combine images ----------------------------- */
export function CombineImages() {
  const [imgs, setImgs] = React.useState<HTMLImageElement[]>([]);
  const [dir, setDir] = React.useState<"h" | "v">("v");
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
    if (dir === "v") {
      c.width = Math.max(...imgs.map((i) => i.naturalWidth));
      c.height = imgs.reduce((s, i) => s + i.naturalHeight, 0);
    } else {
      c.height = Math.max(...imgs.map((i) => i.naturalHeight));
      c.width = imgs.reduce((s, i) => s + i.naturalWidth, 0);
    }
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    let off = 0;
    for (const i of imgs) {
      if (dir === "v") { ctx.drawImage(i, 0, off); off += i.naturalHeight; }
      else { ctx.drawImage(i, off, 0); off += i.naturalWidth; }
    }
    c.toBlob((b) => { if (b) { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = URL.createObjectURL(b); } });
  }, [imgs, dir]);
  return (
    <div className="space-y-4">
      <FileDrop accept="image/*" multiple onFiles={add} label="Add images to combine" />
      {imgs.length > 0 && (
        <>
          <Select value={dir} onChange={(e) => setDir(e.target.value as "h")} className="max-w-48"><option value="v">Stack vertically</option><option value="h">Stack horizontally</option></Select>
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
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {sizes.map((s) => (
          <button key={s} onClick={() => downloadUrl(make(s), `favicon-${s}x${s}.png`)} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface-2 p-2 hover:bg-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={make(s)} alt={`${s}`} width={Math.min(s, 48)} height={Math.min(s, 48)} />
            <span className="text-xs text-muted">{s}px</span>
          </button>
        ))}
      </div>
      <Notice tone="info">Click any size to download that favicon PNG.</Notice>
    </div>
  );
}
