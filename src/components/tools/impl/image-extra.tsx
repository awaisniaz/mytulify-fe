"use client";

import * as React from "react";
import { Select, Button } from "@/components/ui/primitives";
import { FileDrop, Field, Notice } from "@/components/tools/shared";
import { download } from "@/lib/utils";

function downloadUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function HeicToJpg() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [q, setQ] = React.useState(92);
  const convert = async (files: File[]) => {
    const f = files[0];
    if (!f) return;
    setBusy(true);
    setError("");
    try {
      const { default: heic2any } = await import("heic2any");
      const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: q / 100 });
      const result = Array.isArray(blob) ? blob[0] : blob;
      downloadUrl(URL.createObjectURL(result), f.name.replace(/\.heic$/i, ".jpg"));
    } catch (e) {
      setError((e as Error).message || "Could not convert HEIC file.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <Field label={`JPEG quality ${q}%`}>
        <input type="range" min={40} max={100} value={q} onChange={(e) => setQ(+e.target.value)} className="w-full accent-[var(--brand)]" />
      </Field>
      <FileDrop accept=".heic,image/heic,image/heif" onFiles={convert} label="Drop a HEIC/HEIF photo" />
      {busy && <Notice tone="info">Converting…</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

export function PngToSvg() {
  const [svg, setSvg] = React.useState("");
  const [w, setW] = React.useState(0);
  const [h, setH] = React.useState(0);
  const onFiles = (files: File[]) => {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        setW(img.naturalWidth);
        setH(img.naturalHeight);
        setSvg(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${img.naturalWidth}" height="${img.naturalHeight}" viewBox="0 0 ${img.naturalWidth} ${img.naturalHeight}">\n  <image href="${data}" width="${img.naturalWidth}" height="${img.naturalHeight}"/>\n</svg>`,
        );
      };
      img.src = data;
    };
    reader.readAsDataURL(f);
  };
  const scaled = svg;
  return (
    <div className="space-y-4">
      {!svg ? (
        <FileDrop accept="image/png,image/*" onFiles={onFiles} label="Drop a PNG to wrap in SVG" />
      ) : (
        <>
          <textarea readOnly value={scaled} rows={8} className="w-full rounded-xl border border-border bg-surface-2 p-3 font-mono text-xs" />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => download(scaled, "image.svg", "image/svg+xml")}>Download SVG</Button>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(scaled)}>Copy SVG</Button>
            <Button variant="outline" onClick={() => setSvg("")}>Convert another</Button>
          </div>
          <Notice tone="info">{w}×{h}px — embeds the raster inside SVG (not a vector trace).</Notice>
        </>
      )}
    </div>
  );
}

export function CollageMaker() {
  const [imgs, setImgs] = React.useState<HTMLImageElement[]>([]);
  const [cols, setCols] = React.useState(2);
  const [gap, setGap] = React.useState(8);
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
    const rows = Math.ceil(imgs.length / cols);
    const cell = 320;
    c.width = cols * cell + gap * (cols + 1);
    c.height = rows * cell + gap * (rows + 1);
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);
    imgs.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = gap + col * (cell + gap);
      const y = gap + row * (cell + gap);
      const scale = Math.min(cell / img.naturalWidth, cell / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, x + (cell - dw) / 2, y + (cell - dh) / 2, dw, dh);
    });
    c.toBlob((b) => {
      if (!b) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
    });
  }, [imgs, cols, gap, bg]);

  return (
    <div className="space-y-4">
      <FileDrop accept="image/*" multiple onFiles={add} label="Add photos for collage" />
      {imgs.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Columns">
              <Select value={String(cols)} onChange={(e) => setCols(+e.target.value)}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} columns</option>)}
              </Select>
            </Field>
            <Field label={`Gap ${gap}px`}>
              <input type="range" min={0} max={32} value={gap} onChange={(e) => setGap(+e.target.value)} className="w-full accent-[var(--brand)]" />
            </Field>
            <Field label="Background">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-11 w-full rounded-xl border border-border" />
            </Field>
          </div>
          <p className="text-xs text-muted">{imgs.length} photos</p>
          <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-3 text-center">
            <canvas ref={canvasRef} className="mx-auto max-w-full" style={{ maxHeight: 400 }} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => urlRef.current && downloadUrl(urlRef.current, "collage.png")}>Download PNG</Button>
            <Button variant="outline" onClick={() => setImgs([])}>Clear</Button>
          </div>
        </>
      )}
    </div>
  );
}
