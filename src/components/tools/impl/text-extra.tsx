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
  const out = toAsciiArt(text);
  return (
    <div className="space-y-4">
      <Field label="Text"><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a word or phrase" /></Field>
      <Output value={out} rows={6} filename="ascii-art.txt" />
    </div>
  );
}

export function TextToHandwriting() {
  const [text, setText] = React.useState("Dear friend,\n\nThis note was written with the handwriting tool.");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const urlRef = React.useRef("");

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const pad = 40;
    const lineHeight = 36;
    const lines = text.split("\n");
    c.width = 720;
    c.height = Math.max(320, pad * 2 + lines.length * lineHeight);
    ctx.fillStyle = "#fffef8";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#1a365d";
    ctx.font = '28px "Segoe Script", "Brush Script MT", cursive';
    ctx.textBaseline = "top";
    lines.forEach((line, i) => ctx.fillText(line, pad, pad + i * lineHeight));
    c.toBlob((b) => {
      if (!b) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
    }, "image/png");
  }, [text]);

  return (
    <div className="space-y-4">
      <Field label="Your text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} /></Field>
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
