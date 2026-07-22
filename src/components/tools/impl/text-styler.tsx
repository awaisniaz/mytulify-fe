"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/primitives";
import { CopyButton, Field } from "@/components/tools/shared";

/* ------------------------ Unicode styling primitives ----------------------- */
const UP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOW = "abcdefghijklmnopqrstuvwxyz";
const DIG = "0123456789";

/** Map A-Z, a-z, 0-9 onto a contiguous unicode block via code-point offset. */
function mapBlock(upStart?: number, lowStart?: number, digStart?: number) {
  return (s: string) =>
    [...s]
      .map((ch) => {
        const u = UP.indexOf(ch);
        if (u >= 0 && upStart) return String.fromCodePoint(upStart + u);
        const l = LOW.indexOf(ch);
        if (l >= 0 && lowStart) return String.fromCodePoint(lowStart + l);
        const d = DIG.indexOf(ch);
        if (d >= 0 && digStart) return String.fromCodePoint(digStart + d);
        return ch;
      })
      .join("");
}

function combine(s: string, marks: string[]) {
  return [...s].map((ch) => (/\s/.test(ch) ? ch : ch + marks.join(""))).join("");
}

export const STYLES: Record<string, (s: string) => string> = {
  "Bold (Serif)": mapBlock(0x1d400, 0x1d41a, 0x1d7ce),
  "Bold Italic": mapBlock(0x1d468, 0x1d482),
  Italic: mapBlock(0x1d434, 0x1d44e),
  "Bold Sans": mapBlock(0x1d5d4, 0x1d5ee, 0x1d7ec),
  Script: mapBlock(0x1d49c, 0x1d4b6),
  "Bold Script": mapBlock(0x1d4d0, 0x1d4ea),
  Fraktur: mapBlock(0x1d504, 0x1d51e),
  "Bold Fraktur": mapBlock(0x1d56c, 0x1d586),
  "Double-Struck": mapBlock(0x1d538, 0x1d552, 0x1d7d8),
  Monospace: mapBlock(0x1d670, 0x1d68a, 0x1d7f6),
  "Circled": mapBlock(0x24b6, 0x24d0),
  "Squared": mapBlock(0x1f130),
  "Fullwidth": mapBlock(0xff21, 0xff41, 0xff10),
  "Small Caps": (s) =>
    [...s.toLowerCase()]
      .map((ch) => {
        const map: Record<string, string> = {
          a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
          j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
          s: "s", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
        };
        return map[ch] ?? ch;
      })
      .join(""),
  "Superscript": (s) =>
    [...s.toLowerCase()]
      .map((ch) => {
        const map: Record<string, string> = {
          a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ",
          j: "ʲ", k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", q: " q", r: "ʳ",
          s: "ˢ", t: "ᵗ", u: "ᵘ", v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
          "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶",
          "7": "⁷", "8": "⁸", "9": "⁹",
        };
        return map[ch] ?? ch;
      })
      .join(""),
  Strikethrough: (s) => combine(s, ["̶"]),
  Underline: (s) => combine(s, ["̲"]),
  "Double Underline": (s) => combine(s, ["̳"]),
  Slashed: (s) => combine(s, ["̷"]),
  "Upside Down": (s) => {
    const map: Record<string, string> = {
      a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ", i: "ᴉ", j: "ɾ",
      k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d", q: "b", r: "ɹ", s: "s", t: "ʇ",
      u: "n", v: "ʌ", w: "ʍ", x: "x", y: "ʎ", z: "z", "?": "¿", "!": "¡", ".": "˙",
      ",": "'", "'": ",", "(": ")", ")": "(", "[": "]", "]": "[", "<": ">", ">": "<",
    };
    return [...s.toLowerCase()].map((c) => map[c] ?? c).reverse().join("");
  },
  Glitch: (s) => {
    const z = ["̀", "́", "̂", "̃", "̈", "̊", "̧", "҉", "̴"];
    return [...s]
      .map((ch) => (/\s/.test(ch) ? ch : ch + z.slice(0, 3 + ((ch.charCodeAt(0) % 4))).join("")))
      .join("");
  },
};

const AESTHETIC_DECOR = ["✦", "✧", "❀", "♡", "˚", "·", "✿", "☆", "⋆", "✩", "ꨄ", "❥"];

/* ------------------------------ Generic tool UI ---------------------------- */
export function MultiStyler({
  styleNames,
  placeholder = "Type or paste your text…",
  defaultText = "Hello World",
  charLimit,
  platformLabel,
}: {
  styleNames?: string[];
  placeholder?: string;
  defaultText?: string;
  charLimit?: number;
  platformLabel?: string;
}) {
  const [text, setText] = React.useState(defaultText);
  const names = styleNames ?? Object.keys(STYLES);
  return (
    <div className="space-y-5">
      <Field label="Your text">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="font-sans"
        />
      </Field>
      {charLimit && (
        <p className={`text-xs ${text.length > charLimit ? "text-rose-500" : "text-muted"}`}>
          {platformLabel ? `${platformLabel}: ` : ""}{text.length}/{charLimit} characters
        </p>
      )}
      <div className="space-y-2.5">
        {names.map((name) => {
          const out = STYLES[name]?.(text) ?? text;
          return (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-xs font-medium text-muted">{name}</p>
                <p className="break-words text-lg leading-snug">{out || <span className="text-muted">…</span>}</p>
              </div>
              <CopyButton value={out} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Single-style generator (e.g. dedicated bold / cursive tools). */
export function SingleStyler({
  styleName,
  styleNames,
  defaultText = "Hello World",
}: {
  styleName?: string;
  styleNames?: string[];
  defaultText?: string;
}) {
  return <MultiStyler styleNames={styleNames ?? (styleName ? [styleName] : undefined)} defaultText={defaultText} />;
}

/** Small caps + superscript combined tool */
export function SmallTextGenerator() {
  const [mode, setMode] = React.useState<"Small Caps" | "Superscript">("Small Caps");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["Small Caps", "Superscript"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg px-3 py-1.5 text-sm ${mode === m ? "bg-brand text-brand-fg" : "bg-surface-2"}`}>{m}</button>
        ))}
      </div>
      <MultiStyler styleNames={[mode]} defaultText="small text" />
    </div>
  );
}

/** Glitch with intensity control */
export function GlitchTextGenerator() {
  const [text, setText] = React.useState("GLITCH");
  const [intensity, setIntensity] = React.useState(3);
  const z = ["̀", "́", "̂", "̃", "̈", "̊", "̧", "҉", "̴"];
  const out = [...text].map((ch) => (/\s/.test(ch) ? ch : ch + z.slice(0, intensity).join(""))).join("");
  return (
    <div className="space-y-4">
      <Field label="Text"><Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="font-sans" /></Field>
      <Field label={`Intensity (${intensity})`}>
        <input type="range" min={1} max={6} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full" />
      </Field>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-4">
        <p className="min-w-0 flex-1 break-all text-2xl">{out}</p>
        <CopyButton value={out} />
      </div>
    </div>
  );
}

/* --------------------------- Aesthetic usernames --------------------------- */
export function AestheticUsername() {
  const [text, setText] = React.useState("luna");
  const [platform, setPlatform] = React.useState("instagram");
  const limits: Record<string, number> = { instagram: 30, twitter: 15, tiktok: 24, discord: 32, twitch: 25 };
  const maxLen = limits[platform] ?? 30;
  const fonts = ["Script", "Bold Script", "Fullwidth", "Double-Struck", "Small Caps", "Italic", "Monospace", "Circled"];
  const results = React.useMemo(() => {
    const base = text || "name";
    const out: string[] = [];
    for (const f of fonts) {
      const styled = STYLES[f]?.(base) ?? base;
      const d1 = AESTHETIC_DECOR[base.length % AESTHETIC_DECOR.length];
      const d2 = AESTHETIC_DECOR[(base.length + 3) % AESTHETIC_DECOR.length];
      out.push(`${d1} ${styled} ${d1}`);
      out.push(`˗ˏˋ ${styled} ´ˎ˗`);
      out.push(`${d2}°｡ ${styled} ｡°${d2}`);
      out.push(`· ${styled} ·`);
    }
    return out;
  }, [text]);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Base username">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} className="font-sans" />
        </Field>
        <Field label="Platform limit">
          <select className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="instagram">Instagram (30)</option>
            <option value="twitter">X / Twitter (15)</option>
            <option value="tiktok">TikTok (24)</option>
            <option value="discord">Discord (32)</option>
            <option value="twitch">Twitch (25)</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {results.map((r, i) => (
          <div key={i} className={`flex items-center gap-2 rounded-xl border p-3 ${r.length > maxLen ? "border-rose-500/30 bg-rose-500/5" : "border-border bg-surface-2"}`}>
            <div className="min-w-0 flex-1">
              <p className="break-words text-base">{r}</p>
              <p className="text-xs text-muted">{r.length}/{maxLen}</p>
            </div>
            <CopyButton value={r} />
          </div>
        ))}
      </div>
    </div>
  );
}
