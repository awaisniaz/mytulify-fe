"use client";

import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Stat, Notice } from "@/components/tools/shared";
import { Textarea } from "@/components/ui/primitives";

/* --------------------- Generic input→output transform ---------------------- */
function TransformTool({
  transform,
  controls,
  defaultText = "",
  placeholder = "Type or paste text…",
  outRows = 8,
}: {
  transform: (input: string) => string;
  controls?: React.ReactNode;
  defaultText?: string;
  placeholder?: string;
  outRows?: number;
}) {
  const [text, setText] = React.useState(defaultText);
  const out = React.useMemo(() => {
    try {
      return transform(text);
    } catch (e) {
      return String(e);
    }
  }, [text, transform]);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Field label="Input">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={outRows} className="font-sans" />
        {controls}
      </Field>
      <Field label="Output">
        <Output value={out} rows={outRows} mono={false} filename="output.txt" />
      </Field>
    </div>
  );
}

/* ------------------------------ Word counter ------------------------------- */
export function WordCounter() {
  const [text, setText] = React.useState("");
  const words = (text.trim().match(/\S+/g) || []).length;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const lines = text === "" ? 0 : text.split(/\n/).length;
  const readMin = Math.max(1, Math.round(words / 200));
  const speakMin = Math.max(1, Math.round(words / 130));
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing or paste your text here…" rows={8} className="font-sans" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Words" value={words} />
        <Stat label="Characters" value={chars} />
        <Stat label="No spaces" value={charsNoSpace} />
        <Stat label="Sentences" value={sentences} />
        <Stat label="Paragraphs" value={paragraphs} />
        <Stat label="Lines" value={lines} />
        <Stat label="Read time" value={`${readMin}m`} />
        <Stat label="Speak time" value={`${speakMin}m`} />
      </div>
    </div>
  );
}

export function CharacterCounter() {
  const [text, setText] = React.useState("");
  const limits = [{ n: 280, l: "Tweet" }, { n: 2200, l: "Instagram" }, { n: 160, l: "SMS" }, { n: 60, l: "SEO title" }];
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type to count characters…" rows={6} className="font-sans" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Characters" value={text.length} />
        <Stat label="No spaces" value={text.replace(/\s/g, "").length} />
        <Stat label="Words" value={(text.trim().match(/\S+/g) || []).length} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {limits.map((x) => (
          <div key={x.l} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
            <span>{x.l} ({x.n})</span>
            <span className={text.length > x.n ? "text-rose-500" : "text-emerald-500"}>
              {x.n - text.length} left
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SentenceCounter() {
  const [text, setText] = React.useState("");
  const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
  const words = (text.trim().match(/\S+/g) || []).length;
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-sans" placeholder="Paste text…" />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sentences" value={sentences} />
        <Stat label="Words" value={words} />
        <Stat label="Avg words/sentence" value={sentences ? Math.round(words / sentences) : 0} />
      </div>
    </div>
  );
}

/* -------------------------------- Case tools ------------------------------- */
function titleCase(s: string) {
  const small = new Set(["a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "by", "of", "in", "with"]);
  return s.toLowerCase().replace(/\w[^\s-]*/g, (w, i) =>
    i !== 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1),
  );
}
export function CaseConverter() {
  const [text, setText] = React.useState("The quick brown fox jumps over the lazy dog.");
  const ops: [string, (s: string) => string][] = [
    ["UPPERCASE", (s) => s.toUpperCase()],
    ["lowercase", (s) => s.toLowerCase()],
    ["Title Case", titleCase],
    ["Sentence case", (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())],
    ["Capitalize Each Word", (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())],
    ["aLtErNaTiNg", (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("")],
    ["InVeRsE", (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("")],
    ["camelCase", (s) => s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())],
    ["snake_case", (s) => s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "")],
    ["kebab-case", (s) => s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")],
  ];
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="font-sans" />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {ops.map(([name, fn]) => (
          <div key={name} className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">{name}</span>
              <span className="block truncate text-sm">{fn(text)}</span>
            </span>
            <CopyButton value={fn(text)} label="" />
          </div>
        ))}
      </div>
    </div>
  );
}
export const TitleCaseConverter = () => (
  <TransformTool transform={titleCase} defaultText="the great gatsby and other works" />
);
export const CapitalizeEachWord = () => (
  <TransformTool transform={(s) => s.replace(/\b\w/g, (c) => c.toUpperCase())} defaultText="capitalize each word here" />
);

/* ------------------------------ Cleaning tools ----------------------------- */
export const RemoveLineBreaks = () => (
  <TransformTool transform={(s) => s.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim()} placeholder="Paste text with line breaks…" />
);
export const RemoveExtraSpaces = () => (
  <TransformTool transform={(s) => s.replace(/[^\S\n]{2,}/g, " ").replace(/ +\n/g, "\n").trim()} />
);
export const WhitespaceRemover = () => (
  <TransformTool transform={(s) => s.replace(/\s+/g, "")} placeholder="All whitespace will be removed…" />
);
export const RemovePunctuation = () => (
  <TransformTool transform={(s) => s.replace(/[!-/:-@[-`{-~]/g, "")} />
);
export const RemoveDuplicateLines = () => (
  <TransformTool
    transform={(s) => {
      const seen = new Set<string>();
      return s.split("\n").filter((l) => (seen.has(l) ? false : (seen.add(l), true))).join("\n");
    }}
    placeholder="Paste a list with duplicate lines…"
  />
);
export const ReverseText = () => (
  <TransformTool transform={(s) => [...s].reverse().join("")} defaultText="Reverse me" />
);
export const AddLineNumbers = () => (
  <TransformTool transform={(s) => s.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n")} />
);

/* ------------------------------ Sort lines --------------------------------- */
export function SortTextLines() {
  const [mode, setMode] = React.useState("az");
  const fn = React.useCallback(
    (s: string) => {
      const lines = s.split("\n");
      switch (mode) {
        case "az": return [...lines].sort((a, b) => a.localeCompare(b)).join("\n");
        case "za": return [...lines].sort((a, b) => b.localeCompare(a)).join("\n");
        case "num": return [...lines].sort((a, b) => parseFloat(a) - parseFloat(b)).join("\n");
        case "len": return [...lines].sort((a, b) => a.length - b.length).join("\n");
        case "rev": return [...lines].reverse().join("\n");
        default: return s;
      }
    },
    [mode],
  );
  return (
    <TransformTool
      transform={fn}
      placeholder="Paste lines to sort…"
      controls={
        <Select className="mt-2" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="num">Numeric</option>
          <option value="len">By length</option>
          <option value="rev">Reverse order</option>
        </Select>
      }
    />
  );
}

/* ------------------------------ Text repeater ------------------------------ */
export function TextRepeater() {
  const [text, setText] = React.useState("Hello ");
  const [count, setCount] = React.useState(5);
  const [sep, setSep] = React.useState("");
  const out = Array.from({ length: Math.max(0, Math.min(10000, count)) }, () => text).join(sep === "\\n" ? "\n" : sep);
  return (
    <div className="space-y-4">
      <Field label="Text to repeat">
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Times">
          <Input type="number" value={count} onChange={(e) => setCount(+e.target.value)} />
        </Field>
        <Field label="Separator" hint="use \n for new line">
          <Input value={sep} onChange={(e) => setSep(e.target.value)} />
        </Field>
      </div>
      <Output value={out} filename="repeated.txt" />
    </div>
  );
}

/* --------------------------- Find and replace ------------------------------ */
export function FindReplace() {
  const [text, setText] = React.useState("");
  const [find, setFind] = React.useState("");
  const [rep, setRep] = React.useState("");
  const [regex, setRegex] = React.useState(false);
  const [ci, setCi] = React.useState(false);
  let out = text;
  try {
    if (find) {
      const flags = "g" + (ci ? "i" : "");
      const re = regex ? new RegExp(find, flags) : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
      out = text.replace(re, rep);
    }
  } catch {
    out = "⚠ Invalid regular expression";
  }
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" placeholder="Paste text…" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Find"><Input value={find} onChange={(e) => setFind(e.target.value)} /></Field>
        <Field label="Replace with"><Input value={rep} onChange={(e) => setRep(e.target.value)} /></Field>
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={regex} onChange={(e) => setRegex(e.target.checked)} /> Regex</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={ci} onChange={(e) => setCi(e.target.checked)} /> Case-insensitive</label>
      </div>
      <Output value={out} filename="result.txt" mono={false} />
    </div>
  );
}

/* --------------------------- Word frequency -------------------------------- */
export function WordFrequency() {
  const [text, setText] = React.useState("");
  const freq = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const w of text.toLowerCase().match(/\b[\w']+\b/g) || []) map.set(w, (map.get(w) || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50);
  }, [text]);
  const max = freq[0]?.[1] || 1;
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" placeholder="Paste text to analyze…" />
      <div className="space-y-1.5">
        {freq.map(([w, c]) => (
          <div key={w} className="flex items-center gap-3 text-sm">
            <span className="w-28 truncate">{w}</span>
            <div className="h-4 flex-1 overflow-hidden rounded bg-surface-2">
              <div className="h-full rounded bg-brand" style={{ width: `${(c / max) * 100}%` }} />
            </div>
            <span className="w-8 text-right text-muted">{c}</span>
          </div>
        ))}
        {!freq.length && <Notice tone="info">Paste some text to see word frequencies.</Notice>}
      </div>
    </div>
  );
}

/* ------------------------------ Slug + binary ------------------------------ */
export function slugify(s: string) {
  return s.toLowerCase().trim().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
export const SlugTool = () => (
  <TransformTool transform={slugify} defaultText="My Awesome Blog Post Title!" placeholder="Enter a title…" outRows={3} />
);

export function BinaryTranslator() {
  const [mode, setMode] = React.useState<"enc" | "dec">("enc");
  const fn = React.useCallback(
    (s: string) => {
      if (mode === "enc")
        return [...s].map((c) => c.charCodeAt(0).toString(2).padStart(8, "0")).join(" ");
      return s.trim().split(/\s+/).map((b) => String.fromCharCode(parseInt(b, 2))).join("");
    },
    [mode],
  );
  return (
    <TransformTool
      transform={fn}
      defaultText={mode === "enc" ? "Hi" : "01001000 01101001"}
      controls={
        <Select className="mt-2" value={mode} onChange={(e) => setMode(e.target.value as "enc")}>
          <option value="enc">Text → Binary</option>
          <option value="dec">Binary → Text</option>
        </Select>
      }
    />
  );
}

const MORSE: Record<string, string> = {
  A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..",
  J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
  S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
  "6": "-....", "7": "--...", "8": "---..", "9": "----.", ".": ".-.-.-", ",": "--..--",
  "?": "..--..", "!": "-.-.--", "/": "-..-.", "@": ".--.-.", "-": "-....-",
};
const REV_MORSE = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
export function MorseTranslator() {
  const [mode, setMode] = React.useState<"enc" | "dec">("enc");
  const fn = React.useCallback(
    (s: string) => {
      if (mode === "enc")
        return s.toUpperCase().split("").map((c) => (c === " " ? "/" : MORSE[c] ?? "")).join(" ").replace(/\s+/g, " ").trim();
      return s.trim().split(" ").map((c) => (c === "/" ? " " : REV_MORSE[c] ?? "")).join("");
    },
    [mode],
  );
  return (
    <TransformTool
      transform={fn}
      defaultText={mode === "enc" ? "SOS" : "... --- ..."}
      controls={
        <Select className="mt-2" value={mode} onChange={(e) => setMode(e.target.value as "enc")}>
          <option value="enc">Text → Morse</option>
          <option value="dec">Morse → Text</option>
        </Select>
      }
    />
  );
}

const NATO: Record<string, string> = {
  A: "Alpha", B: "Bravo", C: "Charlie", D: "Delta", E: "Echo", F: "Foxtrot", G: "Golf",
  H: "Hotel", I: "India", J: "Juliett", K: "Kilo", L: "Lima", M: "Mike", N: "November",
  O: "Oscar", P: "Papa", Q: "Quebec", R: "Romeo", S: "Sierra", T: "Tango", U: "Uniform",
  V: "Victor", W: "Whiskey", X: "X-ray", Y: "Yankee", Z: "Zulu",
};
export const NatoConverter = () => (
  <TransformTool
    transform={(s) => s.toUpperCase().split("").map((c) => NATO[c] ?? (c === " " ? "(space)" : c)).join(" ")}
    defaultText="HELLO"
  />
);

export const BionicReading = () => (
  <div className="space-y-4">
    <Notice tone="info">Bold the first part of each word to read faster. Output is copy-ready as bold Unicode.</Notice>
    <TransformTool
      transform={(s) =>
        s.replace(/\b(\w+)\b/g, (w) => {
          const n = Math.ceil(w.length / 2);
          const bold = [...w.slice(0, n)].map((c) => {
            const u = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c);
            const l = "abcdefghijklmnopqrstuvwxyz".indexOf(c);
            if (u >= 0) return String.fromCodePoint(0x1d400 + u);
            if (l >= 0) return String.fromCodePoint(0x1d41a + l);
            return c;
          }).join("");
          return bold + w.slice(n);
        })
      }
      defaultText="Reading faster with bionic reading is surprisingly effective."
    />
  </div>
);

/* ------------------------------ Diff checker ------------------------------- */
export function DiffChecker() {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const max = Math.max(linesA.length, linesB.length);
  const rows = Array.from({ length: max }, (_, i) => {
    const la = linesA[i] ?? "";
    const lb = linesB[i] ?? "";
    return { la, lb, same: la === lb };
  });
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Original"><Textarea value={a} onChange={(e) => setA(e.target.value)} rows={8} /></Field>
        <Field label="Changed"><Textarea value={b} onChange={(e) => setB(e.target.value)} rows={8} /></Field>
      </div>
      <div className="overflow-hidden rounded-xl border border-border font-mono text-sm">
        {rows.map((r, i) => (
          <div key={i} className={`grid grid-cols-2 gap-px ${r.same ? "" : "bg-amber-500/5"}`}>
            <div className={`px-3 py-1 ${r.same ? "" : "bg-rose-500/10"}`}>{r.la || " "}</div>
            <div className={`px-3 py-1 ${r.same ? "" : "bg-emerald-500/10"}`}>{r.lb || " "}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------- Lorem ipsum --------------------------------- */
const LOREM = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum".split(" ");
export function LoremIpsum() {
  const [count, setCount] = React.useState(3);
  const [unit, setUnit] = React.useState<"paragraphs" | "sentences" | "words">("paragraphs");
  const out = React.useMemo(() => {
    const sentence = () => {
      const len = 8 + Math.floor(Math.random() * 8);
      const w = Array.from({ length: len }, () => LOREM[Math.floor(Math.random() * LOREM.length)]);
      w[0] = w[0][0].toUpperCase() + w[0].slice(1);
      return w.join(" ") + ".";
    };
    if (unit === "words") return Array.from({ length: count }, () => LOREM[Math.floor(Math.random() * LOREM.length)]).join(" ");
    if (unit === "sentences") return Array.from({ length: count }, sentence).join(" ");
    return Array.from({ length: count }, () => Array.from({ length: 4 }, sentence).join(" ")).join("\n\n");
  }, [count, unit]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Amount"><Input type="number" value={count} onChange={(e) => setCount(+e.target.value)} className="w-28" /></Field>
        <Field label="Unit">
          <Select value={unit} onChange={(e) => setUnit(e.target.value as "words")}>
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </Select>
        </Field>
      </div>
      <Output value={out} filename="lorem.txt" mono={false} rows={10} />
    </div>
  );
}

/* ----------------------------- Text to speech ------------------------------ */
export function TextToSpeech() {
  const [text, setText] = React.useState("Hello! This text will be read aloud by your browser.");
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = React.useState("");
  const [rate, setRate] = React.useState(1);
  React.useEffect(() => {
    const load = () => setVoices(speechSynthesis.getVoices());
    load();
    speechSynthesis.onvoiceschanged = load;
  }, []);
  function speak() {
    const u = new SpeechSynthesisUtterance(text);
    const v = voices.find((x) => x.name === voice);
    if (v) u.voice = v;
    u.rate = rate;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  return (
    <div className="space-y-4">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Voice">
          <Select value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">Default</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name}</option>)}
          </Select>
        </Field>
        <Field label={`Speed: ${rate.toFixed(1)}x`}>
          <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button onClick={speak}>▶ Speak</Button>
        <Button variant="secondary" onClick={() => speechSynthesis.cancel()}>■ Stop</Button>
      </div>
    </div>
  );
}
