"use client";

import * as React from "react";
import { Input, Textarea, Button, Select } from "@/components/ui/primitives";
import { Field, Output, Notice } from "@/components/tools/shared";

/* Minimal 5-line ASCII banner font (A-Z, 0-9, space) */
const FONT: Record<string, string[]> = {
  " ": ["     ", "     ", "     ", "     ", "     "],
  A: [" ### ", "#   #", "#####", "#   #", "#   #"],
  B: ["#### ", "#   #", "#### ", "#   #", "#### "],
  C: [" ####", "#    ", "#    ", "#    ", " ####"],
  D: ["#### ", "#   #", "#   #", "#   #", "#### "],
  E: ["#####", "#    ", "#### ", "#    ", "#####"],
  F: ["#####", "#    ", "#### ", "#    ", "#    "],
  G: [" ####", "#    ", "#  ##", "#   #", " ####"],
  H: ["#   #", "#   #", "#####", "#   #", "#   #"],
  I: ["#####", "  #  ", "  #  ", "  #  ", "#####"],
  J: ["#####", "   # ", "   # ", "#  # ", " ##  "],
  K: ["#   #", "#  # ", "###  ", "#  # ", "#   #"],
  L: ["#    ", "#    ", "#    ", "#    ", "#####"],
  M: ["#   #", "## ##", "# # #", "#   #", "#   #"],
  N: ["#   #", "##  #", "# # #", "#  ##", "#   #"],
  O: [" ### ", "#   #", "#   #", "#   #", " ### "],
  P: ["#### ", "#   #", "#### ", "#    ", "#    "],
  Q: [" ### ", "#   #", "#   #", "#  ##", " ####"],
  R: ["#### ", "#   #", "#### ", "#  # ", "#   #"],
  S: [" ####", "#    ", " ### ", "    #", "#### "],
  T: ["#####", "  #  ", "  #  ", "  #  ", "  #  "],
  U: ["#   #", "#   #", "#   #", "#   #", " ### "],
  V: ["#   #", "#   #", "#   #", " # # ", "  #  "],
  W: ["#   #", "#   #", "# # #", "## ##", "#   #"],
  X: ["#   #", " # # ", "  #  ", " # # ", "#   #"],
  Y: ["#   #", " # # ", "  #  ", "  #  ", "  #  "],
  Z: ["#####", "   # ", "  #  ", " #   ", "#####"],
  "0": [" ### ", "#  ##", "# # #", "##  #", " ### "],
  "1": ["  #  ", " ##  ", "  #  ", "  #  ", " ### "],
  "2": [" ### ", "#   #", "  ## ", " #   ", "#####"],
  "3": [" ### ", "    #", " ### ", "    #", " ### "],
  "4": ["#   #", "#   #", "#####", "    #", "    #"],
  "5": ["#####", "#    ", "#### ", "    #", "#### "],
  "6": [" ### ", "#    ", "#### ", "#   #", " ### "],
  "7": ["#####", "   # ", "  #  ", " #   ", " #   "],
  "8": [" ### ", "#   #", " ### ", "#   #", " ### "],
  "9": [" ### ", "#   #", " ####", "    #", " ### "],
};
FONT["?"] = [" ### ", "#   #", "  #  ", "     ", "  #  "];

function toAsciiArt(text: string): string {
  const upper = text.toUpperCase();
  const lines = ["", "", "", "", ""];
  for (const ch of upper) {
    const glyph = FONT[ch] ?? FONT["?" ] ?? FONT[" "];
    for (let i = 0; i < 5; i++) lines[i] += (glyph[i] ?? "     ") + " ";
  }
  return lines.join("\n");
}

export function TextToAsciiArt() {
  const [text, setText] = React.useState("HELLO");
  const [fill, setFill] = React.useState("#");
  const [empty, setEmpty] = React.useState(" ");
  const [fig, setFig] = React.useState(false);
  const out = toAsciiArt(text).replace(/#/g, fill.slice(0, 1) || "#").replace(/ /g, empty || " ");
  const boxed = fig ? out.split("\n").map((l) => `| ${l} |`).join("\n") : out;
  return (
    <div className="space-y-4">
      <Field label="Text"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a word or phrase" /></Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Fill character"><Input value={fill} onChange={(e) => setFill(e.target.value.slice(0, 1))} maxLength={1} /></Field>
        <Field label="Empty character"><Input value={empty} onChange={(e) => setEmpty(e.target.value.slice(0, 1))} maxLength={1} /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={fig} onChange={(e) => setFig(e.target.checked)} /> Box border</label>
      </div>
      <Output value={boxed} rows={7} filename="ascii-art.txt" />
    </div>
  );
}

export function TextToHandwriting() {
  const FONTS = [
    { id: "cursive", label: "Cursive", stack: `"Segoe Script", "Brush Script MT", "Apple Chancery", cursive` },
    { id: "hand", label: "Casual hand", stack: `"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive` },
    { id: "neat", label: "Neat script", stack: `"Lucida Handwriting", "Apple Chancery", cursive` },
    { id: "mono", label: "Print (mono)", stack: `"Courier New", Courier, monospace` },
  ] as const;
  const PAPERS = [
    { id: "lined", label: "Lined" },
    { id: "grid", label: "Grid" },
    { id: "blank", label: "Blank" },
    { id: "aged", label: "Aged" },
  ] as const;

  const [text, setText] = React.useState("Dear friend,\n\nThis note was written with the handwriting tool.");
  const [ink, setInk] = React.useState("#1a365d");
  const [paper, setPaper] = React.useState("#fffef8");
  const [size, setSize] = React.useState(28);
  const [fontId, setFontId] = React.useState<(typeof FONTS)[number]["id"]>("cursive");
  const [paperStyle, setPaperStyle] = React.useState<(typeof PAPERS)[number]["id"]>("lined");
  const [letterSpacing, setLetterSpacing] = React.useState(0);
  const [lineGap, setLineGap] = React.useState(8);
  const [margin, setMargin] = React.useState(40);
  const [tilt, setTilt] = React.useState(0);
  const [wobble, setWobble] = React.useState(true);
  const [width, setWidth] = React.useState(720);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const urlRef = React.useRef("");

  const fontStack = FONTS.find((f) => f.id === fontId)?.stack ?? FONTS[0].stack;

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const pad = margin;
    const lineHeight = size + lineGap;
    const lines = text.split("\n");
    c.width = width;
    c.height = Math.max(320, pad * 2 + Math.max(lines.length, 4) * lineHeight + 20);
    const bg = paperStyle === "aged" ? "#f3e6c8" : paper;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, c.width, c.height);

    if (paperStyle === "lined" || paperStyle === "aged") {
      ctx.strokeStyle = paperStyle === "aged" ? "rgba(160,120,80,0.28)" : "rgba(90,140,200,0.25)";
      ctx.lineWidth = 1;
      for (let y = pad + lineHeight - 6; y < c.height - 16; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(pad * 0.4, y);
        ctx.lineTo(c.width - pad * 0.4, y);
        ctx.stroke();
      }
      // Left margin rule
      ctx.strokeStyle = paperStyle === "aged" ? "rgba(180,70,70,0.35)" : "rgba(220,90,90,0.35)";
      ctx.beginPath();
      ctx.moveTo(pad - 8, 12);
      ctx.lineTo(pad - 8, c.height - 12);
      ctx.stroke();
    } else if (paperStyle === "grid") {
      ctx.strokeStyle = "rgba(120,140,160,0.18)";
      ctx.lineWidth = 1;
      const step = Math.max(16, Math.round(lineHeight / 2));
      for (let x = pad * 0.3; x < c.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, c.height);
        ctx.stroke();
      }
      for (let y = pad * 0.3; y < c.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(c.width, y);
        ctx.stroke();
      }
    }

    ctx.fillStyle = ink;
    ctx.font = `${size}px ${fontStack}`;
    ctx.textBaseline = "alphabetic";

    lines.forEach((line, i) => {
      const baseY = pad + (i + 1) * lineHeight - 6;
      if (!wobble && tilt === 0) {
        ctx.fillText(line, pad, baseY);
        return;
      }
      let x = pad;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci]!;
        const seed = (i * 97 + ci * 13) % 17;
        const dx = wobble ? ((seed % 5) - 2) * 0.35 : 0;
        const dy = wobble ? ((seed % 7) - 3) * 0.4 : 0;
        const ang = ((tilt + (wobble ? (seed % 5) - 2 : 0)) * Math.PI) / 180;
        ctx.save();
        ctx.translate(x + dx, baseY + dy);
        ctx.rotate(ang);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        x += ctx.measureText(ch).width + letterSpacing;
      }
    });

    c.toBlob((b) => {
      if (!b) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
    }, "image/png");
  }, [text, ink, paper, size, fontStack, paperStyle, letterSpacing, lineGap, margin, tilt, wobble, width]);

  const download = (type: "png" | "jpeg") => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement("a");
    a.download = `handwriting.${type === "png" ? "png" : "jpg"}`;
    a.href = c.toDataURL(type === "png" ? "image/png" : "image/jpeg", 0.92);
    a.click();
  };

  return (
    <div className="space-y-4">
      <Field label="Your text">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Hand style">
          <Select value={fontId} onChange={(e) => setFontId(e.target.value as typeof fontId)}>
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Paper style">
          <Select value={paperStyle} onChange={(e) => setPaperStyle(e.target.value as typeof paperStyle)}>
            {PAPERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ink">
          <input type="color" value={ink} onChange={(e) => setInk(e.target.value)} className="h-11 w-full rounded-xl border border-border" />
        </Field>
        <Field label="Paper color">
          <input
            type="color"
            value={paper}
            onChange={(e) => setPaper(e.target.value)}
            disabled={paperStyle === "aged"}
            className="h-11 w-full rounded-xl border border-border disabled:opacity-50"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={`Size ${size}`}>
          <input type="range" min={16} max={56} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Letter spacing ${letterSpacing}`}>
          <input type="range" min={-2} max={8} value={letterSpacing} onChange={(e) => setLetterSpacing(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Line gap ${lineGap}`}>
          <input type="range" min={0} max={24} value={lineGap} onChange={(e) => setLineGap(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Tilt ${tilt}°`}>
          <input type="range" min={-12} max={12} value={tilt} onChange={(e) => setTilt(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={`Margin ${margin}`}>
          <input type="range" min={20} max={80} value={margin} onChange={(e) => setMargin(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Width ${width}px`}>
          <input type="range" min={480} max={1000} step={20} value={width} onChange={(e) => setWidth(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" checked={wobble} onChange={(e) => setWobble(e.target.checked)} />
          Natural letter wobble
        </label>
      </div>
      <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-4">
        <canvas ref={canvasRef} className="mx-auto max-w-full shadow-sm" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => download("png")}>
          Download PNG
        </Button>
        <Button type="button" variant="secondary" onClick={() => download("jpeg")}>
          Download JPG
        </Button>
      </div>
      <Notice tone="info">Uses system handwriting fonts — look varies by device. Wobble + tilt make it feel more natural.</Notice>
    </div>
  );
}
