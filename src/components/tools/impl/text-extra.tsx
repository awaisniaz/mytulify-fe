"use client";

import * as React from "react";
import { Input, Textarea, Button } from "@/components/ui/primitives";
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
  const [text, setText] = React.useState("Dear friend,\n\nThis note was written with the handwriting tool.");
  const [ink, setInk] = React.useState("#1a365d");
  const [paper, setPaper] = React.useState("#fffef8");
  const [size, setSize] = React.useState(28);
  const [lined, setLined] = React.useState(true);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const urlRef = React.useRef("");

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const pad = 40;
    const lineHeight = size + 8;
    const lines = text.split("\n");
    c.width = 720;
    c.height = Math.max(320, pad * 2 + lines.length * lineHeight);
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, c.width, c.height);
    if (lined) {
      ctx.strokeStyle = "rgba(90,140,200,0.25)";
      for (let y = pad + lineHeight - 6; y < c.height - 20; y += lineHeight) {
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(c.width - pad, y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = ink;
    ctx.font = `${size}px "Segoe Script", "Brush Script MT", cursive`;
    ctx.textBaseline = "top";
    lines.forEach((line, i) => ctx.fillText(line, pad, pad + i * lineHeight));
    c.toBlob((b) => {
      if (!b) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
    }, "image/png");
  }, [text, ink, paper, size, lined]);

  return (
    <div className="space-y-4">
      <Field label="Your text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} /></Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Ink"><input type="color" value={ink} onChange={(e) => setInk(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
        <Field label="Paper"><input type="color" value={paper} onChange={(e) => setPaper(e.target.value)} className="h-11 w-full rounded-xl border border-border" /></Field>
        <Field label={`Size ${size}`}><input type="range" min={16} max={48} value={size} onChange={(e) => setSize(+e.target.value)} className="w-full accent-[var(--brand)]" /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={lined} onChange={(e) => setLined(e.target.checked)} /> Lined paper</label>
      </div>
      <div className="overflow-auto rounded-xl border border-border bg-surface-2 p-4">
        <canvas ref={canvasRef} className="mx-auto max-w-full shadow-sm" />
      </div>
      <Button
        onClick={() => {
          if (!urlRef.current) return;
          const a = document.createElement("a");
          a.href = urlRef.current;
          a.download = "handwriting.png";
          a.click();
        }}
      >
        Download PNG
      </Button>
      <Notice tone="info">Uses a cursive system font — results vary by device.</Notice>
    </div>
  );
}
