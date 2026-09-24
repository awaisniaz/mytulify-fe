"use client";

import * as React from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/primitives";
import { Field, FileDrop, Notice } from "@/components/tools/shared";
import { Icon } from "@/components/ui/Icon";
import { cn, download } from "@/lib/utils";

/* ---------------------------------- types --------------------------------- */

type AspectId = "original" | "16:9" | "9:16" | "1:1" | "4:5" | "4:3" | "21:9";
type FitMode = "contain" | "cover" | "stretch";
type Transition = "none" | "crossfade" | "fadeblack" | "flash";
type Tab = "clips" | "trim" | "look" | "fx" | "text" | "logo" | "export";

type Clip = {
  id: string;
  name: string;
  url: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  width: number;
  height: number;
  reverse: boolean;
  opacity: number;
  volume: number;
  muted: boolean;
  transition: Transition;
  transitionDur: number;
  kenBurns: number;
};

type TextLayer = {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  bg: string;
  font: string;
  start: number;
  end: number;
  align: CanvasTextAlign;
  shadow: boolean;
  bold: boolean;
  stroke: boolean;
  strokeColor: string;
  italic: boolean;
};

type LogoLayer = {
  id: string;
  url: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  rotation: number;
  start: number;
  end: number;
};

type Filters = {
  brightness: number;
  contrast: number;
  saturate: number;
  hue: number;
  blur: number;
  grayscale: number;
  sepia: number;
  invert: number;
};

const ASPECTS: { id: AspectId; label: string; w: number; h: number }[] = [
  { id: "original", label: "Original", w: 0, h: 0 },
  { id: "16:9", label: "YouTube 16:9", w: 16, h: 9 },
  { id: "9:16", label: "Reels / TikTok 9:16", w: 9, h: 16 },
  { id: "1:1", label: "Square 1:1", w: 1, h: 1 },
  { id: "4:5", label: "Instagram 4:5", w: 4, h: 5 },
  { id: "4:3", label: "Classic 4:3", w: 4, h: 3 },
  { id: "21:9", label: "Ultrawide 21:9", w: 21, h: 9 },
];

const FILTER_PRESETS: { id: string; label: string; filters: Partial<Filters> }[] = [
  { id: "none", label: "None", filters: {} },
  { id: "vivid", label: "Vivid", filters: { saturate: 140, contrast: 115, brightness: 105 } },
  { id: "cinematic", label: "Cinematic", filters: { contrast: 120, saturate: 85, brightness: 95 } },
  { id: "warm", label: "Warm", filters: { sepia: 25, saturate: 120, brightness: 105 } },
  { id: "cool", label: "Cool", filters: { hue: 200, saturate: 110, brightness: 102 } },
  { id: "bw", label: "B&W", filters: { grayscale: 100, contrast: 110 } },
  { id: "vintage", label: "Vintage", filters: { sepia: 45, contrast: 95, brightness: 105, saturate: 80 } },
  { id: "fade", label: "Faded", filters: { contrast: 85, brightness: 110, saturate: 70 } },
  { id: "noir", label: "Noir", filters: { grayscale: 100, contrast: 140, brightness: 90 } },
  { id: "dream", label: "Dreamy", filters: { blur: 1.2, brightness: 110, saturate: 90 } },
  { id: "punch", label: "Punchy", filters: { contrast: 135, saturate: 130, brightness: 102 } },
  { id: "moon", label: "Moonlight", filters: { hue: 220, saturate: 70, brightness: 90, contrast: 115 } },
  { id: "sunset", label: "Sunset", filters: { hue: 15, sepia: 30, saturate: 130, brightness: 105 } },
  { id: "teal", label: "Teal & Orange", filters: { hue: 175, saturate: 125, contrast: 118 } },
];

const FONTS = [
  "system-ui, sans-serif",
  "Georgia, serif",
  "Courier New, monospace",
  "Impact, sans-serif",
  "Segoe Script, cursive",
  "Arial Black, sans-serif",
  "Trebuchet MS, sans-serif",
];

const DEFAULT_FILTERS: Filters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  hue: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
};

const TEXT_PRESETS = [
  { id: "title", label: "Title card", text: "VIDEO TITLE", y: 50, size: 0.1, bg: "transparent" },
  { id: "lower", label: "Lower third", text: "Name · Role", y: 82, size: 0.055, bg: "rgba(0,0,0,0.65)" },
  { id: "caption", label: "Caption", text: "Your caption here", y: 88, size: 0.045, bg: "rgba(0,0,0,0.5)" },
  { id: "end", label: "End screen", text: "Thanks for watching\nSubscribe ↓", y: 50, size: 0.08, bg: "rgba(0,0,0,0.4)" },
  { id: "cta", label: "CTA", text: "Link in bio →", y: 78, size: 0.06, bg: "rgba(124,58,237,0.85)" },
] as const;

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function fmtTime(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
}

function clipLen(c: Clip) {
  return Math.max(0.05, c.trimEnd - c.trimStart);
}

function projectDuration(clips: Clip[], speed: number) {
  const raw = clips.reduce((sum, c) => sum + clipLen(c), 0);
  return raw / Math.max(0.1, speed);
}

function locateClip(clips: Clip[], projectTime: number, speed: number) {
  let t = projectTime * speed;
  let start = 0;
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i]!;
    const len = clipLen(c);
    if (t <= len) {
      const local = c.reverse ? c.trimEnd - t : c.trimStart + t;
      return { clip: c, local, index: i, offsetInClip: t, clipStartProj: start / speed };
    }
    t -= len;
    start += len;
  }
  const last = clips[clips.length - 1];
  if (!last) return null;
  return {
    clip: last,
    local: last.reverse ? last.trimStart : last.trimEnd,
    index: clips.length - 1,
    offsetInClip: clipLen(last),
    clipStartProj: (start - clipLen(last)) / speed,
  };
}

function filterCss(f: Filters) {
  return [
    `brightness(${f.brightness}%)`,
    `contrast(${f.contrast}%)`,
    `saturate(${f.saturate}%)`,
    `hue-rotate(${f.hue}deg)`,
    `blur(${f.blur}px)`,
    `grayscale(${f.grayscale}%)`,
    `sepia(${f.sepia}%)`,
    `invert(${f.invert}%)`,
  ].join(" ");
}

function pickMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video of/webm",
    "video/webm",
  ];
  for (const m of candidates) {
    if (m.includes(" of ")) continue;
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "video/webm";
}

function defaultClip(partial: Omit<Clip, "reverse" | "opacity" | "volume" | "muted" | "transition" | "transitionDur" | "kenBurns"> & Partial<Clip>): Clip {
  return {
    reverse: false,
    opacity: 1,
    volume: 1,
    muted: false,
    transition: "crossfade",
    transitionDur: 0.4,
    kenBurns: 0,
    ...partial,
  };
}

function loadVideoMeta(file: File): Promise<Clip> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => {
      const duration = Number.isFinite(v.duration) ? v.duration : 0;
      resolve(
        defaultClip({
          id: uid("clip"),
          name: file.name,
          url,
          duration,
          trimStart: 0,
          trimEnd: duration || 1,
          width: v.videoWidth || 1280,
          height: v.videoHeight || 720,
        }),
      );
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read ${file.name}`));
    };
    v.src = url;
  });
}

function loadImageUrl(file: File): Promise<{ url: string; name: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ url, name: file.name });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image"));
    };
    img.src = url;
  });
}

function parseSrt(raw: string): { start: number; end: number; text: string }[] {
  const blocks = raw.replace(/\r/g, "").split(/\n\n+/);
  const out: { start: number; end: number; text: string }[] = [];
  const toSec = (t: string) => {
    const m = t.trim().match(/(?:(\d+):)?(\d+):(\d+)[,.](\d+)/);
    if (!m) return 0;
    const h = +(m[1] || 0);
    return h * 3600 + +m[2]! * 60 + +m[3]! + +m[4]!.slice(0, 3) / 1000;
  };
  for (const b of blocks) {
    const lines = b.trim().split("\n");
    if (lines.length < 2) continue;
    const timeLine = lines.find((l) => l.includes("-->"));
    if (!timeLine) continue;
    const [a, c] = timeLine.split("-->");
    const text = lines.slice(lines.indexOf(timeLine) + 1).join("\n").trim();
    if (!text) continue;
    out.push({ start: toSec(a || "0"), end: toSec(c || "0"), text });
  }
  return out;
}

function outputSize(clips: Clip[], aspect: AspectId, maxEdge: number) {
  const first = clips[0];
  const ow = first?.width || 1280;
  const oh = first?.height || 720;
  const spec = ASPECTS.find((a) => a.id === aspect)!;
  if (aspect === "original" || !spec.w) {
    const scale = Math.min(1, maxEdge / Math.max(ow, oh));
    return {
      w: Math.max(2, Math.round((ow * scale) / 2) * 2),
      h: Math.max(2, Math.round((oh * scale) / 2) * 2),
    };
  }
  const ar = spec.w / spec.h;
  let w: number;
  let h: number;
  if (ar >= 1) {
    w = maxEdge;
    h = Math.round(maxEdge / ar);
  } else {
    h = maxEdge;
    w = Math.round(maxEdge * ar);
  }
  return { w: Math.max(2, Math.round(w / 2) * 2), h: Math.max(2, Math.round(h / 2) * 2) };
}

function drawVideoFitted(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  cw: number,
  ch: number,
  fit: FitMode,
  zoom: number,
  panX: number,
  panY: number,
) {
  const vw = video.videoWidth || 1;
  const vh = video.videoHeight || 1;
  let dw: number;
  let dh: number;
  if (fit === "stretch") {
    dw = cw;
    dh = ch;
  } else if (fit === "cover") {
    const s = Math.max(cw / vw, ch / vh) * zoom;
    dw = vw * s;
    dh = vh * s;
  } else {
    const s = Math.min(cw / vw, ch / vh) * zoom;
    dw = vw * s;
    dh = vh * s;
  }
  const dx = (cw - dw) / 2 + (panX / 100) * cw * 0.25;
  const dy = (ch - dh) / 2 + (panY / 100) * ch * 0.25;
  ctx.drawImage(video, dx, dy, dw, dh);
}

function drawGrainSafe(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, seed: number) {
  if (amount <= 0) return;
  const tile = 128;
  const off = document.createElement("canvas");
  off.width = tile;
  off.height = tile;
  const octx = off.getContext("2d")!;
  const img = octx.createImageData(tile, tile);
  let s = (Math.floor(seed) * 16807) % 2147483647 || 1;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const n = s % 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
    img.data[i + 3] = Math.round((amount / 100) * 70);
  }
  octx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  const pattern = ctx.createPattern(off, "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.globalAlpha = Math.min(1, amount / 100);
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/* -------------------------------- component ------------------------------- */

export function OnlineVideoEditor() {
  const [clips, setClips] = React.useState<Clip[]>([]);
  const [activeClipId, setActiveClipId] = React.useState<string | null>(null);
  const [texts, setTexts] = React.useState<TextLayer[]>([]);
  const [logos, setLogos] = React.useState<LogoLayer[]>([]);
  const [activeTextId, setActiveTextId] = React.useState<string | null>(null);
  const [activeLogoId, setActiveLogoId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>("clips");

  const [aspect, setAspect] = React.useState<AspectId>("original");
  const [fit, setFit] = React.useState<FitMode>("contain");
  const [bgColor, setBgColor] = React.useState("#0a0a0a");
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [rotate, setRotate] = React.useState(0);
  const [flipH, setFlipH] = React.useState(false);
  const [flipV, setFlipV] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [panX, setPanX] = React.useState(0);
  const [panY, setPanY] = React.useState(0);
  const [speed, setSpeed] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [muted, setMuted] = React.useState(false);
  const [fadeIn, setFadeIn] = React.useState(0);
  const [fadeOut, setFadeOut] = React.useState(0);
  const [quality, setQuality] = React.useState<"720" | "1080" | "480">("720");

  /* FX */
  const [vignette, setVignette] = React.useState(0);
  const [grain, setGrain] = React.useState(0);
  const [tintColor, setTintColor] = React.useState("#ff6b35");
  const [tintAmount, setTintAmount] = React.useState(0);
  const [letterbox, setLetterbox] = React.useState(0);
  const [borderW, setBorderW] = React.useState(0);
  const [borderColor, setBorderColor] = React.useState("#ffffff");
  const [blurBg, setBlurBg] = React.useState(false);
  const [showGuides, setShowGuides] = React.useState(false);
  const [progressBar, setProgressBar] = React.useState(false);
  const [progressColor, setProgressColor] = React.useState("#a855f7");
  const [loop, setLoop] = React.useState(false);
  const [silentExport, setSilentExport] = React.useState(false);
  const [fps, setFps] = React.useState(30);
  const [bitrate, setBitrate] = React.useState<"low" | "med" | "high">("med");

  const [playing, setPlaying] = React.useState(false);
  const [playhead, setPlayhead] = React.useState(0);
  const [exporting, setExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const videoMapRef = React.useRef<Map<string, HTMLVideoElement>>(new Map());
  const logoMapRef = React.useRef<Map<string, HTMLImageElement>>(new Map());
  const rafRef = React.useRef(0);
  const playStartRef = React.useRef({ wall: 0, head: 0 });
  const exportingRef = React.useRef(false);
  const playheadRef = React.useRef(0);
  const audioWiredRef = React.useRef(false);

  const activeClip = clips.find((c) => c.id === activeClipId) ?? clips[0] ?? null;
  const activeText = texts.find((t) => t.id === activeTextId) ?? null;
  const activeLogo = logos.find((l) => l.id === activeLogoId) ?? null;
  const totalDur = projectDuration(clips, speed);
  const maxEdge = quality === "1080" ? 1920 : quality === "720" ? 1280 : 854;
  const size = outputSize(clips, aspect, maxEdge);

  React.useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  React.useEffect(() => {
    const map = videoMapRef.current;
    const keep = new Set(clips.map((c) => c.id));
    for (const [id, el] of map) {
      if (!keep.has(id)) {
        el.pause();
        el.removeAttribute("src");
        el.load();
        map.delete(id);
      }
    }
    for (const c of clips) {
      if (!map.has(c.id)) {
        const v = document.createElement("video");
        v.src = c.url;
        v.playsInline = true;
        v.preload = "auto";
        v.crossOrigin = "anonymous";
        map.set(c.id, v);
      }
    }
  }, [clips]);

  React.useEffect(() => {
    const map = logoMapRef.current;
    const keep = new Set(logos.map((l) => l.id));
    for (const [id] of map) {
      if (!keep.has(id)) map.delete(id);
    }
    for (const l of logos) {
      if (!map.has(l.id)) {
        const img = new Image();
        img.src = l.url;
        map.set(l.id, img);
      }
    }
  }, [logos]);

  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      const seen = new Set<string>();
      for (const c of clips) {
        if (!seen.has(c.url)) {
          seen.add(c.url);
          URL.revokeObjectURL(c.url);
        }
      }
      for (const l of logos) URL.revokeObjectURL(l.url);
      videoMapRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  const drawClipVideo = React.useCallback(
    (
      ctx: CanvasRenderingContext2D,
      clip: Clip,
      video: HTMLVideoElement,
      w: number,
      h: number,
      alpha: number,
      zoomMul: number,
    ) => {
      if (video.readyState < 2) return;
      ctx.save();
      ctx.globalAlpha = alpha * clip.opacity;
      ctx.filter = filterCss(filters);

      if (blurBg && fit === "contain") {
        ctx.save();
        ctx.filter = `${filterCss(filters)} blur(18px)`;
        drawVideoFitted(ctx, video, w, h, "cover", 1.15 * zoomMul, 0, 0);
        ctx.restore();
        ctx.filter = filterCss(filters);
      }

      drawVideoFitted(ctx, video, w, h, fit, zoom * zoomMul, panX, panY);
      ctx.restore();
    },
    [filters, fit, blurBg, zoom, panX, panY],
  );

  const drawFrame = React.useCallback(
    (projectTime: number, alphaMul = 1, previewGuides = true) => {
      const canvas = canvasRef.current;
      if (!canvas || clips.length === 0) return;
      const { w, h } = size;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);

      let fade = 1;
      if (fadeIn > 0 && projectTime < fadeIn) fade = projectTime / fadeIn;
      if (fadeOut > 0 && projectTime > totalDur - fadeOut) {
        fade = Math.min(fade, Math.max(0, (totalDur - projectTime) / fadeOut));
      }
      fade *= alphaMul;

      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.translate(-w / 2, -h / 2);

      const hit = locateClip(clips, projectTime, speed);
      if (hit) {
        const progress = hit.offsetInClip / Math.max(0.01, clipLen(hit.clip));
        const kb = 1 + hit.clip.kenBurns * progress;
        const video = videoMapRef.current.get(hit.clip.id);

        // Crossfade / transitions into next clip
        let drawn = false;
        const rem = clipLen(hit.clip) - hit.offsetInClip;
        const td = hit.clip.transitionDur;
        const next = clips[hit.index + 1];
        if (
          next &&
          hit.clip.transition !== "none" &&
          td > 0 &&
          rem < td &&
          hit.offsetInClip > 0.05
        ) {
          const p = 1 - rem / td;
          if (hit.clip.transition === "crossfade" && video) {
            drawClipVideo(ctx, hit.clip, video, w, h, fade * (1 - p), kb);
            const nv = videoMapRef.current.get(next.id);
            if (nv && nv.readyState >= 2) {
              const nLocal = next.reverse ? next.trimEnd : next.trimStart;
              if (Math.abs(nv.currentTime - nLocal) > 0.2) {
                try {
                  nv.currentTime = nLocal;
                } catch {
                  /* */
                }
              }
              drawClipVideo(ctx, next, nv, w, h, fade * p, 1);
            }
            drawn = true;
          } else if (hit.clip.transition === "fadeblack") {
            if (video) drawClipVideo(ctx, hit.clip, video, w, h, fade * Math.max(0, 1 - p * 2), kb);
            if (p > 0.5) {
              const nv = videoMapRef.current.get(next.id);
              if (nv) {
                const nLocal = next.reverse ? next.trimEnd : next.trimStart;
                try {
                  nv.currentTime = nLocal;
                } catch {
                  /* */
                }
                drawClipVideo(ctx, next, nv, w, h, fade * (p - 0.5) * 2, 1);
              }
            }
            drawn = true;
          } else if (hit.clip.transition === "flash") {
            if (video) drawClipVideo(ctx, hit.clip, video, w, h, fade, kb);
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = `rgba(255,255,255,${Math.sin(p * Math.PI) * 0.85})`;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
            drawn = true;
          }
        }

        if (!drawn && video) {
          drawClipVideo(ctx, hit.clip, video, w, h, fade, kb);
        }
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.filter = "none";

      // Tint
      if (tintAmount > 0) {
        ctx.save();
        ctx.globalAlpha = (tintAmount / 100) * fade;
        ctx.fillStyle = tintColor;
        ctx.globalCompositeOperation = "soft-light";
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Vignette
      if (vignette > 0) {
        const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.92})`);
        ctx.fillStyle = g;
        ctx.globalAlpha = fade;
        ctx.fillRect(0, 0, w, h);
      }

      // Film grain
      if (grain > 0) drawGrainSafe(ctx, w, h, grain * fade, projectTime * 60);

      // Letterbox bars
      if (letterbox > 0) {
        const bar = (letterbox / 100) * h * 0.5;
        ctx.globalAlpha = fade;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, bar);
        ctx.fillRect(0, h - bar, w, bar);
      }

      // Border
      if (borderW > 0) {
        ctx.globalAlpha = fade;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderW;
        ctx.strokeRect(borderW / 2, borderW / 2, w - borderW, h - borderW);
      }

      for (const layer of logos) {
        if (projectTime < layer.start || projectTime > layer.end) continue;
        const img = logoMapRef.current.get(layer.id);
        if (!img || !img.complete) continue;
        const lw = (layer.scale / 100) * w;
        const lh = (img.height / Math.max(1, img.width)) * lw;
        const lx = (layer.x / 100) * w;
        const ly = (layer.y / 100) * h;
        ctx.save();
        ctx.globalAlpha = fade * layer.opacity;
        ctx.translate(lx, ly);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh);
        ctx.restore();
      }

      for (const t of texts) {
        if (projectTime < t.start || projectTime > t.end) continue;
        const px = (t.x / 100) * w;
        const py = (t.y / 100) * h;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.font = `${t.italic ? "italic " : ""}${t.bold ? "700" : "500"} ${t.size}px ${t.font}`;
        ctx.textAlign = t.align;
        ctx.textBaseline = "middle";
        const lines = t.text.split("\n");
        const lineH = t.size * 1.25;
        const blockH = lines.length * lineH;
        const startY = py - blockH / 2 + lineH / 2;
        if (t.bg && t.bg !== "transparent") {
          const metrics = lines.map((ln) => ctx.measureText(ln).width);
          const maxW = Math.max(0, ...metrics);
          const pad = 10;
          let bx = px - pad;
          if (t.align === "center") bx = px - maxW / 2 - pad;
          if (t.align === "right") bx = px - maxW - pad;
          ctx.fillStyle = t.bg;
          ctx.fillRect(bx, startY - lineH / 2 - pad / 2, maxW + pad * 2, blockH + pad);
        }
        if (t.shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.65)";
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
        }
        lines.forEach((ln, i) => {
          const yy = startY + i * lineH;
          if (t.stroke) {
            ctx.lineWidth = Math.max(2, t.size * 0.08);
            ctx.strokeStyle = t.strokeColor;
            ctx.strokeText(ln, px, yy);
          }
          ctx.fillStyle = t.color;
          ctx.fillText(ln, px, yy);
        });
        ctx.restore();
      }

      // Progress bar burn-in
      if (progressBar && totalDur > 0) {
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, h - 6, w, 6);
        ctx.fillStyle = progressColor;
        ctx.fillRect(0, h - 6, w * Math.min(1, projectTime / totalDur), 6);
        ctx.restore();
      }

      // Preview guides (not for export)
      if (previewGuides && showGuides && !exportingRef.current) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(w / 3, 0);
        ctx.lineTo(w / 3, h);
        ctx.moveTo((2 * w) / 3, 0);
        ctx.lineTo((2 * w) / 3, h);
        ctx.moveTo(0, h / 3);
        ctx.lineTo(w, h / 3);
        ctx.moveTo(0, (2 * h) / 3);
        ctx.lineTo(w, (2 * h) / 3);
        ctx.stroke();
        const m = Math.min(w, h) * 0.05;
        ctx.strokeStyle = "rgba(34,197,94,0.45)";
        ctx.strokeRect(m, m, w - m * 2, h - m * 2);
        ctx.restore();
      }

      ctx.restore();
    },
    [
      clips,
      size,
      bgColor,
      fadeIn,
      fadeOut,
      totalDur,
      rotate,
      flipH,
      flipV,
      speed,
      logos,
      texts,
      tintAmount,
      tintColor,
      vignette,
      grain,
      letterbox,
      borderW,
      borderColor,
      progressBar,
      progressColor,
      showGuides,
      drawClipVideo,
    ],
  );

  const syncVideoToTime = React.useCallback(
    async (projectTime: number) => {
      const hit = locateClip(clips, projectTime, speed);
      for (const [id, v] of videoMapRef.current) {
        if (!hit || id !== hit.clip.id) {
          if (!v.paused) v.pause();
        }
      }
      if (!hit) return;
      const v = videoMapRef.current.get(hit.clip.id);
      if (!v) return;
      const clipVol = hit.clip.muted ? 0 : hit.clip.volume;
      v.playbackRate = hit.clip.reverse ? 1 : speed;
      v.muted = muted || volume <= 0 || clipVol <= 0;
      v.volume = muted ? 0 : Math.min(1, volume * clipVol);
      if (Math.abs(v.currentTime - hit.local) > 0.1) {
        try {
          v.currentTime = Math.max(0, Math.min(hit.clip.duration - 0.05, hit.local));
        } catch {
          /* */
        }
      }
    },
    [clips, speed, muted, volume],
  );

  React.useEffect(() => {
    if (!playing || exportingRef.current) return;
    playStartRef.current = { wall: performance.now(), head: playheadRef.current };

    const tick = () => {
      const elapsed = (performance.now() - playStartRef.current.wall) / 1000;
      let next = playStartRef.current.head + elapsed;
      if (next >= totalDur) {
        if (loop && totalDur > 0.2) {
          playStartRef.current = { wall: performance.now(), head: 0 };
          next = 0;
        } else {
          next = totalDur;
          setPlayhead(next);
          setPlaying(false);
          for (const v of videoMapRef.current.values()) v.pause();
          drawFrame(next);
          return;
        }
      }
      setPlayhead(next);
      void syncVideoToTime(next).then(() => {
        const hit = locateClip(clips, next, speed);
        if (hit) {
          const v = videoMapRef.current.get(hit.clip.id);
          if (v) {
            if (hit.clip.reverse) {
              if (!v.paused) v.pause();
            } else if (v.paused) {
              void v.play().catch(() => undefined);
            }
          }
        }
        drawFrame(next);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, totalDur, drawFrame, syncVideoToTime, clips, speed, loop]);

  React.useEffect(() => {
    if (playing || exporting) return;
    void syncVideoToTime(playhead).then(() => {
      requestAnimationFrame(() => drawFrame(playhead));
    });
  }, [
    playhead,
    playing,
    exporting,
    drawFrame,
    syncVideoToTime,
    filters,
    aspect,
    fit,
    rotate,
    flipH,
    flipV,
    zoom,
    panX,
    panY,
    texts,
    logos,
    bgColor,
    size.w,
    size.h,
    clips,
    vignette,
    grain,
    tintAmount,
    letterbox,
    borderW,
    blurBg,
    progressBar,
    showGuides,
  ]);

  async function addVideos(files: File[]) {
    setError("");
    const vids = files.filter((f) => f.type.startsWith("video/") || /\.(mp4|webm|mov|mkv|ogg)$/i.test(f.name));
    if (!vids.length) {
      setError("Please drop video files (MP4, WebM, MOV…).");
      return;
    }
    try {
      const loaded = await Promise.all(vids.map(loadVideoMeta));
      setClips((prev) => {
        const next = [...prev, ...loaded];
        if (!activeClipId) setActiveClipId(loaded[0]?.id ?? null);
        return next;
      });
      setStatus(`Added ${loaded.length} clip${loaded.length > 1 ? "s" : ""}`);
      setTab("trim");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function updateClip(id: string, patch: Partial<Clip>) {
    setClips((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeClip(id: string) {
    setClips((prev) => {
      const c = prev.find((x) => x.id === id);
      const next = prev.filter((x) => x.id !== id);
      if (c && !next.some((x) => x.url === c.url)) URL.revokeObjectURL(c.url);
      if (activeClipId === id) setActiveClipId(next[0]?.id ?? null);
      return next;
    });
  }

  function duplicateClip(id: string) {
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      if (i < 0) return prev;
      const src = prev[i]!;
      const copy = { ...src, id: uid("clip"), name: `${src.name} copy` };
      const next = [...prev];
      next.splice(i + 1, 0, copy);
      return next;
    });
    setStatus("Clip duplicated");
  }

  function moveClip(id: string, dir: -1 | 1) {
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(i, 1);
      next.splice(j, 0, item!);
      return next;
    });
  }

  function splitAtPlayhead() {
    const hit = locateClip(clips, playhead, speed);
    if (!hit) return;
    const { clip, local } = hit;
    const cut = hit.clip.reverse ? local : local;
    if (cut <= clip.trimStart + 0.15 || cut >= clip.trimEnd - 0.15) return;
    const a = defaultClip({ ...clip, id: uid("clip"), trimEnd: cut, name: `${clip.name} (A)` });
    const b = defaultClip({ ...clip, id: uid("clip"), trimStart: cut, name: `${clip.name} (B)` });
    setClips((prev) => {
      const i = prev.findIndex((c) => c.id === clip.id);
      if (i < 0) return prev;
      const next = [...prev];
      next.splice(i, 1, a, b);
      return next;
    });
    setActiveClipId(b.id);
    setStatus("Split clip at playhead");
  }

  function addTextLayer(preset?: (typeof TEXT_PRESETS)[number]) {
    const p = preset;
    const layer: TextLayer = {
      id: uid("txt"),
      text: p?.text ?? "Your caption",
      x: 50,
      y: p?.y ?? 85,
      size: Math.round(size.h * (p?.size ?? 0.06)),
      color: "#ffffff",
      bg: p?.bg ?? "rgba(0,0,0,0.55)",
      font: FONTS[0]!,
      start: Math.max(0, playhead),
      end: Math.max(playhead + 3, totalDur || 3),
      align: "center",
      shadow: true,
      bold: true,
      stroke: false,
      strokeColor: "#000000",
      italic: false,
    };
    setTexts((t) => [...t, layer]);
    setActiveTextId(layer.id);
    setTab("text");
  }

  function importSrtFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const cues = parseSrt(String(reader.result || ""));
      if (!cues.length) {
        setError("No cues found in SRT.");
        return;
      }
      const layers: TextLayer[] = cues.map((c) => ({
        id: uid("txt"),
        text: c.text,
        x: 50,
        y: 88,
        size: Math.round(size.h * 0.045),
        color: "#ffffff",
        bg: "rgba(0,0,0,0.55)",
        font: FONTS[0]!,
        start: c.start,
        end: Math.max(c.end, c.start + 0.2),
        align: "center" as CanvasTextAlign,
        shadow: true,
        bold: true,
        stroke: true,
        strokeColor: "#000000",
        italic: false,
      }));
      setTexts((t) => [...t, ...layers]);
      setActiveTextId(layers[0]?.id ?? null);
      setTab("text");
      setStatus(`Imported ${layers.length} SRT cues`);
    };
    reader.readAsText(file);
  }

  async function addLogo(files: File[]) {
    const f = files[0];
    if (!f) return;
    try {
      const { url, name } = await loadImageUrl(f);
      const layer: LogoLayer = {
        id: uid("logo"),
        url,
        name,
        x: 88,
        y: 12,
        scale: 18,
        opacity: 0.9,
        rotation: 0,
        start: 0,
        end: Math.max(totalDur, 1),
      };
      setLogos((prev) => [...prev, layer]);
      setActiveLogoId(layer.id);
      setTab("logo");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function applyPreset(id: string) {
    const p = FILTER_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setFilters({ ...DEFAULT_FILTERS, ...p.filters });
  }

  function snapshotFrame() {
    const c = canvasRef.current;
    if (!c) return;
    drawFrame(playhead, 1, false);
    c.toBlob((b) => {
      if (!b) return;
      download(b, `frame-${fmtTime(playhead).replace(":", "-")}.png`, "image/png");
      setStatus("Frame saved as PNG");
    }, "image/png");
  }

  async function exportVideo() {
    if (!clips.length || exporting) return;
    setError("");
    setExporting(true);
    exportingRef.current = true;
    setPlaying(false);
    setExportProgress(0);
    setStatus("Preparing export…");

    const canvas = canvasRef.current;
    if (!canvas) {
      setExporting(false);
      exportingRef.current = false;
      return;
    }

    const mime = pickMime();
    let audioCtx: AudioContext | null = null;
    let mixed: MediaStream;
    const videoStream = canvas.captureStream(fps);

    if (silentExport) {
      mixed = videoStream;
    } else {
      try {
        audioCtx = new AudioContext();
        const dest = audioCtx.createMediaStreamDestination();
        if (!audioWiredRef.current) {
          for (const v of videoMapRef.current.values()) {
            try {
              const src = audioCtx.createMediaElementSource(v);
              const gain = audioCtx.createGain();
              gain.gain.value = muted ? 0 : volume;
              src.connect(gain);
              gain.connect(dest);
              gain.connect(audioCtx.destination);
            } catch {
              /* already wired */
            }
          }
          audioWiredRef.current = true;
        }
        mixed = new MediaStream([...videoStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      } catch {
        mixed = videoStream;
      }
    }

    const bits =
      bitrate === "high" ? (quality === "1080" ? 8e6 : 5e6) : bitrate === "low" ? 1.2e6 : quality === "1080" ? 6e6 : 3.5e6;

    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(mixed, { mimeType: mime, videoBitsPerSecond: bits });
    } catch {
      recorder = new MediaRecorder(mixed);
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const done = new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(";")[0] || "video/webm" }));
      recorder.onerror = () => reject(new Error("Recording failed"));
    });

    setPlayhead(0);
    playheadRef.current = 0;
    for (const v of videoMapRef.current.values()) {
      v.pause();
      v.muted = silentExport;
      v.volume = muted || silentExport ? 0 : volume;
      v.playbackRate = speed;
    }

    await syncVideoToTime(0);
    await new Promise((r) => setTimeout(r, 120));
    drawFrame(0, 1, false);
    recorder.start(200);
    setStatus("Recording… keep this tab open");

    const startWall = performance.now();
    const durationMs = totalDur * 1000;

    await new Promise<void>((resolve) => {
      const step = () => {
        const elapsed = (performance.now() - startWall) / 1000;
        const t = Math.min(totalDur, elapsed);
        playheadRef.current = t;
        setPlayhead(t);
        setExportProgress(totalDur > 0 ? t / totalDur : 1);

        const hit = locateClip(clips, t, speed);
        if (hit) {
          const v = videoMapRef.current.get(hit.clip.id);
          if (v) {
            if (Math.abs(v.currentTime - hit.local) > 0.2) {
              try {
                v.currentTime = hit.local;
              } catch {
                /* */
              }
            }
            if (hit.clip.reverse) {
              if (!v.paused) v.pause();
            } else if (v.paused) {
              void v.play().catch(() => undefined);
            }
            for (const [id, other] of videoMapRef.current) {
              if (id !== hit.clip.id && !other.paused) other.pause();
            }
          }
        }
        drawFrame(t, 1, false);

        if (t >= totalDur - 0.02 || performance.now() - startWall >= durationMs + 400) {
          resolve();
          return;
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    });

    for (const v of videoMapRef.current.values()) v.pause();
    if (recorder.state !== "inactive") recorder.stop();
    const blob = await done;
    void audioCtx?.close();

    download(blob, `edited-video-${Date.now()}.webm`, blob.type || "video/webm");
    setStatus(`Exported ${(blob.size / (1024 * 1024)).toFixed(1)} MB WebM`);
    setExportProgress(1);
    setExporting(false);
    exportingRef.current = false;
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "clips", label: "Clips", icon: "Film" },
    { id: "trim", label: "Trim", icon: "Scissors" },
    { id: "look", label: "Look", icon: "Wand2" },
    { id: "fx", label: "FX", icon: "Sparkles" },
    { id: "text", label: "Text", icon: "Type" },
    { id: "logo", label: "Logo", icon: "Image" },
    { id: "export", label: "Export", icon: "Download" },
  ];

  function skip(delta: number) {
    setPlaying(false);
    setPlayhead((p) => Math.max(0, Math.min(totalDur, p + delta)));
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Browser video editor — multi-clip timeline, trim/split/reverse, transitions, filters, FX, captions (incl. SRT),
        logos, aspect ratios & WebM export. Private on-device.
      </Notice>

      {clips.length === 0 ? (
        <FileDrop
          accept="video/*,.mp4,.webm,.mov,.mkv,.ogg"
          multiple
          onFiles={(files) => void addVideos(files)}
          label="Drop videos here or click to upload"
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-black">
            <div className="relative mx-auto flex max-h-[min(58vh,520px)] items-center justify-center bg-[radial-gradient(ellipse_at_center,#1a1a1a,#050505)]">
              <canvas ref={canvasRef} className="max-h-[min(58vh,520px)] max-w-full" />
              {exporting && (
                <div className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-semibold text-white">
                  Exporting… {Math.round(exportProgress * 100)}%
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-white/10 bg-zinc-950 px-3 py-3">
              <input
                type="range"
                min={0}
                max={Math.max(0.01, totalDur)}
                step={0.05}
                value={Math.min(playhead, totalDur)}
                disabled={exporting}
                onChange={(e) => {
                  setPlaying(false);
                  setPlayhead(+e.target.value);
                }}
                className="w-full accent-[var(--brand)]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="secondary" disabled={exporting} onClick={() => skip(-5)}>
                  −5s
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={exporting} onClick={() => skip(-1)}>
                  −1s
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={exporting}
                  onClick={() => {
                    if (playhead >= totalDur - 0.05) setPlayhead(0);
                    setPlaying((p) => !p);
                  }}
                >
                  <Icon name={playing ? "Square" : "Play"} className="h-3.5 w-3.5" />
                  {playing ? "Pause" : "Play"}
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={exporting} onClick={() => skip(1)}>
                  +1s
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={exporting} onClick={() => skip(5)}>
                  +5s
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={exporting}
                  onClick={() => {
                    setPlaying(false);
                    setPlayhead(0);
                  }}
                >
                  Reset
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={exporting} onClick={splitAtPlayhead}>
                  <Icon name="Scissors" className="h-3.5 w-3.5" />
                  Split
                </Button>
                <Button type="button" size="sm" variant={loop ? "primary" : "secondary"} onClick={() => setLoop((v) => !v)}>
                  Loop
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setMuted((m) => !m)}>
                  <Icon name="Volume2" className="h-3.5 w-3.5" />
                  {muted ? "Unmute" : "Mute"}
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={exporting} onClick={snapshotFrame}>
                  Snapshot
                </Button>
                <span className="ml-auto font-mono text-xs text-zinc-400">
                  {fmtTime(playhead)} / {fmtTime(totalDur)}
                </span>
              </div>
              <div className="flex h-10 gap-0.5 overflow-hidden rounded-lg bg-zinc-900 p-0.5">
                {clips.map((c) => {
                  const pct = totalDur > 0 ? (clipLen(c) / speed / totalDur) * 100 : 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      title={c.name}
                      onClick={() => {
                        setActiveClipId(c.id);
                        setTab("trim");
                      }}
                      className={cn(
                        "h-full truncate rounded-md px-1 text-[10px] font-semibold text-white/90",
                        c.id === activeClip?.id ? "bg-violet-600" : "bg-violet-900/80 hover:bg-violet-800",
                      )}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    >
                      {c.reverse ? "◀ " : ""}
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={tab === t.id ? "primary" : "secondary"}
                onClick={() => setTab(t.id)}
              >
                <Icon name={t.icon} className="h-3.5 w-3.5" />
                {t.label}
              </Button>
            ))}
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="file"
                accept="video/*,.mp4,.webm,.mov"
                multiple
                className="hidden"
                onChange={(e) => {
                  void addVideos(e.target.files ? Array.from(e.target.files) : []);
                  e.target.value = "";
                }}
              />
              <span className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 text-xs font-bold text-muted hover:border-brand/40 hover:text-brand">
                <Icon name="Plus" className="h-3.5 w-3.5" />
                Add clip
              </span>
            </label>
          </div>

          {tab === "clips" && (
            <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
              {clips.map((c, i) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2",
                    c.id === activeClip?.id ? "border-brand/50 bg-brand/5" : "border-border",
                  )}
                >
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setActiveClipId(c.id)}>
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-muted">
                      {fmtTime(clipLen(c))} · {c.reverse ? "reverse · " : ""}
                      {c.transition !== "none" ? `${c.transition} · ` : ""}
                      {c.width}×{c.height}
                    </p>
                  </button>
                  <Button type="button" size="sm" variant="secondary" disabled={i === 0} onClick={() => moveClip(c.id, -1)}>
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={i === clips.length - 1}
                    onClick={() => moveClip(c.id, 1)}
                  >
                    ↓
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => duplicateClip(c.id)}>
                    Copy
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => removeClip(c.id)}>
                    <Icon name="Trash2" className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tab === "trim" && activeClip && (
            <div className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-2">
              <Field label={`In ${fmtTime(activeClip.trimStart)}`}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.1, activeClip.duration)}
                  step={0.05}
                  value={activeClip.trimStart}
                  onChange={(e) =>
                    updateClip(activeClip.id, { trimStart: Math.min(+e.target.value, activeClip.trimEnd - 0.1) })
                  }
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label={`Out ${fmtTime(activeClip.trimEnd)}`}>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0.1, activeClip.duration)}
                  step={0.05}
                  value={activeClip.trimEnd}
                  onChange={(e) =>
                    updateClip(activeClip.id, { trimEnd: Math.max(+e.target.value, activeClip.trimStart + 0.1) })
                  }
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label={`Clip opacity ${Math.round(activeClip.opacity * 100)}%`}>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={activeClip.opacity}
                  onChange={(e) => updateClip(activeClip.id, { opacity: +e.target.value })}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label={`Clip volume ${Math.round(activeClip.volume * 100)}%`}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={activeClip.volume}
                  onChange={(e) => updateClip(activeClip.id, { volume: +e.target.value })}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label="Transition to next">
                <Select
                  value={activeClip.transition}
                  onChange={(e) => updateClip(activeClip.id, { transition: e.target.value as Transition })}
                >
                  <option value="none">None</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="fadeblack">Fade through black</option>
                  <option value="flash">Flash wipe</option>
                </Select>
              </Field>
              <Field label={`Transition ${activeClip.transitionDur.toFixed(1)}s`}>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={activeClip.transitionDur}
                  onChange={(e) => updateClip(activeClip.id, { transitionDur: +e.target.value })}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label={`Ken Burns zoom +${activeClip.kenBurns.toFixed(2)}`}>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={activeClip.kenBurns}
                  onChange={(e) => updateClip(activeClip.id, { kenBurns: +e.target.value })}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const hit = locateClip(clips, playhead, speed);
                    if (!hit || hit.clip.id !== activeClip.id) return;
                    updateClip(activeClip.id, { trimStart: Math.min(hit.local, activeClip.trimEnd - 0.1) });
                  }}
                >
                  Set in at playhead
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const hit = locateClip(clips, playhead, speed);
                    if (!hit || hit.clip.id !== activeClip.id) return;
                    updateClip(activeClip.id, { trimEnd: Math.max(hit.local, activeClip.trimStart + 0.1) });
                  }}
                >
                  Set out at playhead
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeClip.reverse ? "primary" : "secondary"}
                  onClick={() => updateClip(activeClip.id, { reverse: !activeClip.reverse })}
                >
                  Reverse
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeClip.muted ? "primary" : "secondary"}
                  onClick={() => updateClip(activeClip.id, { muted: !activeClip.muted })}
                >
                  Mute clip
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => updateClip(activeClip.id, { trimStart: 0, trimEnd: activeClip.duration })}
                >
                  Reset trim
                </Button>
              </div>
            </div>
          )}

          {tab === "look" && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap gap-1.5">
                {FILTER_PRESETS.map((p) => (
                  <Button key={p.id} type="button" size="sm" variant="secondary" onClick={() => applyPreset(p.id)}>
                    {p.label}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(
                  [
                    ["brightness", "Brightness", 40, 160],
                    ["contrast", "Contrast", 40, 160],
                    ["saturate", "Saturation", 0, 200],
                    ["hue", "Hue", 0, 360],
                    ["blur", "Blur", 0, 8],
                    ["grayscale", "Grayscale", 0, 100],
                    ["sepia", "Sepia", 0, 100],
                    ["invert", "Invert", 0, 100],
                  ] as const
                ).map(([key, label, min, max]) => (
                  <Field key={key} label={`${label} ${filters[key]}${key === "hue" ? "°" : key === "blur" ? "px" : "%"}`}>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={key === "blur" ? 0.1 : 1}
                      value={filters[key]}
                      onChange={(e) => setFilters((f) => ({ ...f, [key]: +e.target.value }))}
                      className="w-full accent-[var(--brand)]"
                    />
                  </Field>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Aspect ratio">
                  <Select value={aspect} onChange={(e) => setAspect(e.target.value as AspectId)}>
                    {ASPECTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Fit">
                  <Select value={fit} onChange={(e) => setFit(e.target.value as FitMode)}>
                    <option value="contain">Contain (letterbox)</option>
                    <option value="cover">Cover (crop)</option>
                    <option value="stretch">Stretch</option>
                  </Select>
                </Field>
                <Field label="Background">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border"
                  />
                </Field>
                <Field label={`Speed ${speed.toFixed(2)}×`}>
                  <input
                    type="range"
                    min={0.25}
                    max={3}
                    step={0.05}
                    value={speed}
                    onChange={(e) => setSpeed(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Zoom ${zoom.toFixed(2)}×`}>
                  <input
                    type="range"
                    min={0.5}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Pan X ${panX}`}>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={panX}
                    onChange={(e) => setPanX(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Pan Y ${panY}`}>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={panY}
                    onChange={(e) => setPanY(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Master volume ${Math.round(volume * 100)}%`}>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                {[0, 90, 180, 270].map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={rotate === d ? "primary" : "secondary"}
                    onClick={() => setRotate(d)}
                  >
                    Rotate {d}°
                  </Button>
                ))}
                <Button type="button" size="sm" variant={flipH ? "primary" : "secondary"} onClick={() => setFlipH((v) => !v)}>
                  Flip H
                </Button>
                <Button type="button" size="sm" variant={flipV ? "primary" : "secondary"} onClick={() => setFlipV((v) => !v)}>
                  Flip V
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={blurBg ? "primary" : "secondary"}
                  onClick={() => setBlurBg((v) => !v)}
                >
                  Blur fill bg
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={`Fade in ${fadeIn.toFixed(1)}s`}>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.1}
                    value={fadeIn}
                    onChange={(e) => setFadeIn(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Fade out ${fadeOut.toFixed(1)}s`}>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.1}
                    value={fadeOut}
                    onChange={(e) => setFadeOut(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
              </div>
            </div>
          )}

          {tab === "fx" && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label={`Vignette ${vignette}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={vignette}
                    onChange={(e) => setVignette(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Film grain ${grain}%`}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={grain}
                    onChange={(e) => setGrain(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Tint ${tintAmount}%`}>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    value={tintAmount}
                    onChange={(e) => setTintAmount(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label="Tint color">
                  <input
                    type="color"
                    value={tintColor}
                    onChange={(e) => setTintColor(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border"
                  />
                </Field>
                <Field label={`Cinematic bars ${letterbox}%`}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={letterbox}
                    onChange={(e) => setLetterbox(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Border ${borderW}px`}>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={borderW}
                    onChange={(e) => setBorderW(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label="Border color">
                  <input
                    type="color"
                    value={borderColor}
                    onChange={(e) => setBorderColor(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border"
                  />
                </Field>
                <Field label="Progress bar color">
                  <input
                    type="color"
                    value={progressColor}
                    onChange={(e) => setProgressColor(e.target.value)}
                    className="h-11 w-full rounded-xl border border-border"
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={progressBar ? "primary" : "secondary"}
                  onClick={() => setProgressBar((v) => !v)}
                >
                  Burn-in progress bar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={showGuides ? "primary" : "secondary"}
                  onClick={() => setShowGuides((v) => !v)}
                >
                  Rule-of-thirds guides
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setVignette(0);
                    setGrain(0);
                    setTintAmount(0);
                    setLetterbox(0);
                    setBorderW(0);
                    setProgressBar(false);
                  }}
                >
                  Reset FX
                </Button>
              </div>
            </div>
          )}

          {tab === "text" && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => addTextLayer()}>
                  <Icon name="Plus" className="h-3.5 w-3.5" />
                  Add caption
                </Button>
                {TEXT_PRESETS.map((p) => (
                  <Button key={p.id} type="button" size="sm" variant="secondary" onClick={() => addTextLayer(p)}>
                    {p.label}
                  </Button>
                ))}
                <label className="inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept=".srt,text/plain"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importSrtFile(f);
                      e.target.value = "";
                    }}
                  />
                  <span className="inline-flex h-8 items-center rounded-xl border border-border bg-surface-2 px-3 text-xs font-bold text-muted hover:text-brand">
                    Import SRT
                  </span>
                </label>
                {texts.map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    size="sm"
                    variant={t.id === activeTextId ? "primary" : "secondary"}
                    onClick={() => setActiveTextId(t.id)}
                  >
                    {t.text.slice(0, 16) || "Text"}
                  </Button>
                ))}
              </div>
              {activeText ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Text">
                    <Textarea
                      rows={3}
                      value={activeText.text}
                      onChange={(e) =>
                        setTexts((all) => all.map((t) => (t.id === activeText.id ? { ...t, text: e.target.value } : t)))
                      }
                    />
                  </Field>
                  <div className="space-y-3">
                    <Field label="Font">
                      <Select
                        value={activeText.font}
                        onChange={(e) =>
                          setTexts((all) => all.map((t) => (t.id === activeText.id ? { ...t, font: e.target.value } : t)))
                        }
                      >
                        {FONTS.map((f) => (
                          <option key={f} value={f}>
                            {f.split(",")[0]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Color">
                        <input
                          type="color"
                          value={activeText.color.startsWith("#") ? activeText.color : "#ffffff"}
                          onChange={(e) =>
                            setTexts((all) =>
                              all.map((t) => (t.id === activeText.id ? { ...t, color: e.target.value } : t)),
                            )
                          }
                          className="h-11 w-full rounded-xl border border-border"
                        />
                      </Field>
                      <Field label={`Size ${activeText.size}`}>
                        <input
                          type="range"
                          min={12}
                          max={140}
                          value={activeText.size}
                          onChange={(e) =>
                            setTexts((all) =>
                              all.map((t) => (t.id === activeText.id ? { ...t, size: +e.target.value } : t)),
                            )
                          }
                          className="w-full accent-[var(--brand)]"
                        />
                      </Field>
                    </div>
                  </div>
                  {(
                    [
                      ["x", "X", activeText.x],
                      ["y", "Y", activeText.y],
                    ] as const
                  ).map(([key, label, val]) => (
                    <Field key={key} label={`${label} ${val}%`}>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={val}
                        onChange={(e) =>
                          setTexts((all) =>
                            all.map((t) => (t.id === activeText.id ? { ...t, [key]: +e.target.value } : t)),
                          )
                        }
                        className="w-full accent-[var(--brand)]"
                      />
                    </Field>
                  ))}
                  <Field label={`Start ${fmtTime(activeText.start)}`}>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.1, totalDur)}
                      step={0.1}
                      value={activeText.start}
                      onChange={(e) =>
                        setTexts((all) =>
                          all.map((t) =>
                            t.id === activeText.id ? { ...t, start: Math.min(+e.target.value, t.end - 0.1) } : t,
                          ),
                        )
                      }
                      className="w-full accent-[var(--brand)]"
                    />
                  </Field>
                  <Field label={`End ${fmtTime(activeText.end)}`}>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.1, totalDur)}
                      step={0.1}
                      value={activeText.end}
                      onChange={(e) =>
                        setTexts((all) =>
                          all.map((t) =>
                            t.id === activeText.id ? { ...t, end: Math.max(+e.target.value, t.start + 0.1) } : t,
                          ),
                        )
                      }
                      className="w-full accent-[var(--brand)]"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    {(["left", "center", "right"] as const).map((a) => (
                      <Button
                        key={a}
                        type="button"
                        size="sm"
                        variant={activeText.align === a ? "primary" : "secondary"}
                        onClick={() =>
                          setTexts((all) => all.map((t) => (t.id === activeText.id ? { ...t, align: a } : t)))
                        }
                      >
                        {a}
                      </Button>
                    ))}
                    {(
                      [
                        ["bold", "Bold"],
                        ["italic", "Italic"],
                        ["shadow", "Shadow"],
                        ["stroke", "Outline"],
                      ] as const
                    ).map(([key, label]) => (
                      <Button
                        key={key}
                        type="button"
                        size="sm"
                        variant={activeText[key] ? "primary" : "secondary"}
                        onClick={() =>
                          setTexts((all) =>
                            all.map((t) => (t.id === activeText.id ? { ...t, [key]: !t[key] } : t)),
                          )
                        }
                      >
                        {label}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setTexts((all) => all.map((t) => (t.id === activeText.id ? { ...t, bg: "transparent" } : t)))
                      }
                    >
                      Clear bg
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setTexts((all) => all.filter((t) => t.id !== activeText.id));
                        setActiveTextId(null);
                      }}
                    >
                      <Icon name="Trash2" className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">Add captions, title cards, or import an SRT subtitle file.</p>
              )}
            </div>
          )}

          {tab === "logo" && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void addLogo(e.target.files ? Array.from(e.target.files) : []);
                      e.target.value = "";
                    }}
                  />
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white">
                    <Icon name="Plus" className="h-3.5 w-3.5" />
                    Upload logo / sticker
                  </span>
                </label>
                {logos.map((l) => (
                  <Button
                    key={l.id}
                    type="button"
                    size="sm"
                    variant={l.id === activeLogoId ? "primary" : "secondary"}
                    onClick={() => setActiveLogoId(l.id)}
                  >
                    {l.name.slice(0, 16)}
                  </Button>
                ))}
              </div>
              {activeLogo ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["x", "X", activeLogo.x, 0, 100],
                      ["y", "Y", activeLogo.y, 0, 100],
                      ["scale", "Size", activeLogo.scale, 4, 80],
                      ["rotation", "Rotate", activeLogo.rotation, -180, 180],
                    ] as const
                  ).map(([key, label, val, min, max]) => (
                    <Field key={key} label={`${label} ${val}${key === "rotation" ? "°" : "%"}`}>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={val}
                        onChange={(e) =>
                          setLogos((all) =>
                            all.map((l) => (l.id === activeLogo.id ? { ...l, [key]: +e.target.value } : l)),
                          )
                        }
                        className="w-full accent-[var(--brand)]"
                      />
                    </Field>
                  ))}
                  <Field label={`Opacity ${Math.round(activeLogo.opacity * 100)}%`}>
                    <input
                      type="range"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={activeLogo.opacity}
                      onChange={(e) =>
                        setLogos((all) =>
                          all.map((l) => (l.id === activeLogo.id ? { ...l, opacity: +e.target.value } : l)),
                        )
                      }
                      className="w-full accent-[var(--brand)]"
                    />
                  </Field>
                  <Field label={`Start ${fmtTime(activeLogo.start)}`}>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.1, totalDur)}
                      step={0.1}
                      value={activeLogo.start}
                      onChange={(e) =>
                        setLogos((all) =>
                          all.map((l) =>
                            l.id === activeLogo.id ? { ...l, start: Math.min(+e.target.value, l.end - 0.1) } : l,
                          ),
                        )
                      }
                      className="w-full accent-[var(--brand)]"
                    />
                  </Field>
                  <Field label={`End ${fmtTime(activeLogo.end)}`}>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.1, totalDur)}
                      step={0.1}
                      value={activeLogo.end}
                      onChange={(e) =>
                        setLogos((all) =>
                          all.map((l) =>
                            l.id === activeLogo.id ? { ...l, end: Math.max(+e.target.value, l.start + 0.1) } : l,
                          ),
                        )
                      }
                      className="w-full accent-[var(--brand)]"
                    />
                  </Field>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const l = logos.find((x) => x.id === activeLogo.id);
                      if (l) URL.revokeObjectURL(l.url);
                      setLogos((all) => all.filter((x) => x.id !== activeLogo.id));
                      setActiveLogoId(null);
                    }}
                  >
                    <Icon name="Trash2" className="h-3.5 w-3.5" />
                    Remove logo
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted">Upload a PNG/WebP logo or sticker to watermark your video.</p>
              )}
            </div>
          )}

          {tab === "export" && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Resolution">
                  <Select value={quality} onChange={(e) => setQuality(e.target.value as typeof quality)}>
                    <option value="480">SD ~480p</option>
                    <option value="720">HD 720p</option>
                    <option value="1080">Full HD 1080p</option>
                  </Select>
                </Field>
                <Field label="FPS">
                  <Select value={String(fps)} onChange={(e) => setFps(+e.target.value)}>
                    <option value="24">24</option>
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="60">60</option>
                  </Select>
                </Field>
                <Field label="Bitrate">
                  <Select value={bitrate} onChange={(e) => setBitrate(e.target.value as typeof bitrate)}>
                    <option value="low">Low (smaller)</option>
                    <option value="med">Medium</option>
                    <option value="high">High (better)</option>
                  </Select>
                </Field>
                <Field label="Output size">
                  <Input readOnly value={`${size.w} × ${size.h} px`} />
                </Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={silentExport ? "primary" : "secondary"}
                  onClick={() => setSilentExport((v) => !v)}
                >
                  Export silent (no audio)
                </Button>
                <span className="self-center text-xs text-muted">Duration {fmtTime(totalDur)}</span>
              </div>
              {exporting && (
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: `${Math.round(exportProgress * 100)}%` }}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={exporting || !clips.length} onClick={() => void exportVideo()}>
                  <Icon name={exporting ? "Loader2" : "Download"} className={cn("h-4 w-4", exporting && "animate-spin")} />
                  {exporting ? "Exporting…" : "Export WebM"}
                </Button>
                <Button type="button" variant="secondary" disabled={exporting} onClick={snapshotFrame}>
                  Save current frame PNG
                </Button>
              </div>
              <p className="text-xs text-muted">
                Export records the timeline in real time. WebM works in Chrome, Edge, and Firefox. Convert to MP4 later if
                an app needs it.
              </p>
            </div>
          )}
        </>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      {status && !error && <p className="text-xs text-muted">{status}</p>}
    </div>
  );
}
