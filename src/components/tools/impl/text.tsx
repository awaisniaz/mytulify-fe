"use client";

import * as React from "react";
import { Input, Select, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Stat, Notice, ToolBar, TextStatBar, useToolText } from "@/components/tools/shared";
import { Textarea } from "@/components/ui/primitives";
import { PLATFORM_LIMITS, splitTwitterThread, twitterWeightedLength } from "@/lib/social-tools";

const DEFAULT_SAMPLE =
  "The quick brown fox jumps over the lazy dog.\nLine two with extra   spaces.\nLine two with extra   spaces.\nHELLO world!";

/* --------------------- Generic input→output transform ---------------------- */
function TransformTool({
  transform,
  controls,
  defaultText = "",
  sample,
  placeholder = "Type or paste text…",
  outRows = 8,
  filename = "output.txt",
}: {
  transform: (input: string) => string;
  controls?: React.ReactNode;
  defaultText?: string;
  sample?: string;
  placeholder?: string;
  outRows?: number;
  filename?: string;
}) {
  const [text, setText] = React.useState(defaultText);
  const [hist, setHist] = React.useState<string[]>([]);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  const out = React.useMemo(() => {
    try {
      return transform(text);
    } catch (e) {
      return String(e);
    }
  }, [text, transform]);
  return (
    <div className="space-y-3">
      <ToolBar
        onSample={() => snapshot(sample ?? DEFAULT_SAMPLE)}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
        extra={
          out && out !== text ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => snapshot(out)}>
              Use output as input
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Input">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} rows={outRows} className="font-sans" />
          {controls}
        </Field>
        <Field label="Output">
          <Output value={out} rows={outRows} mono={false} filename={filename} />
        </Field>
      </div>
      <TextStatBar input={text} output={out} />
    </div>
  );
}

/* ------------------------------ Word counter ------------------------------- */
export function WordCounter() {
  const [text, setText] = React.useState("");
  const [hist, setHist] = React.useState<string[]>([]);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  const words = (text.trim().match(/\S+/g) || []).length;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const lines = text === "" ? 0 : text.split(/\n/).length;
  const readMin = Math.max(1, Math.round(words / 200));
  const speakMin = Math.max(1, Math.round(words / 130));
  const pages = (words / 250).toFixed(1);
  const unique = new Set((text.toLowerCase().match(/\b[\w']+\b/g) || [])).size;
  const summary = [
    `Words: ${words}`,
    `Characters: ${chars}`,
    `Characters (no spaces): ${charsNoSpace}`,
    `Sentences: ${sentences}`,
    `Paragraphs: ${paragraphs}`,
    `Lines: ${lines}`,
    `Unique words: ${unique}`,
    `Reading time: ${readMin} min`,
    `Speaking time: ${speakMin} min`,
    `Est. pages (250 wpp): ${pages}`,
  ].join("\n");
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => snapshot(DEFAULT_SAMPLE)}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Start typing or paste your text here…" rows={8} className="font-sans" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Words" value={words} />
        <Stat label="Characters" value={chars} />
        <Stat label="No spaces" value={charsNoSpace} />
        <Stat label="Sentences" value={sentences} />
        <Stat label="Paragraphs" value={paragraphs} />
        <Stat label="Lines" value={lines} />
        <Stat label="Unique words" value={unique} />
        <Stat label="Est. pages" value={pages} />
        <Stat label="Read time" value={`${readMin}m`} />
        <Stat label="Speak time" value={`${speakMin}m`} />
      </div>
      <Output value={summary} rows={6} filename="word-count.txt" />
    </div>
  );
}

export function CharacterCounter() {
  const [text, setText] = React.useState("");
  const [weighted, setWeighted] = React.useState(true);
  const [showThread, setShowThread] = React.useState(false);
  const twitterLen = weighted ? twitterWeightedLength(text) : text.length;
  const limits = [
    { n: PLATFORM_LIMITS.twitter.chars, l: "X / Twitter", val: twitterLen, weighted: true },
    { n: PLATFORM_LIMITS.twitterPremium.chars, l: "X Premium", val: text.length },
    { n: PLATFORM_LIMITS.instagram.chars, l: "Instagram", val: text.length },
    { n: PLATFORM_LIMITS.threads.chars, l: "Threads", val: text.length },
    { n: PLATFORM_LIMITS.linkedin.chars, l: "LinkedIn", val: text.length },
    { n: PLATFORM_LIMITS.tiktok.chars, l: "TikTok", val: text.length },
    { n: PLATFORM_LIMITS.bioInstagram.chars, l: "IG bio", val: text.length },
    { n: PLATFORM_LIMITS.bioTwitter.chars, l: "X bio", val: text.length },
    { n: PLATFORM_LIMITS.sms.chars, l: "SMS", val: text.length },
    { n: PLATFORM_LIMITS.seoTitle.chars, l: "SEO title", val: text.length },
    { n: PLATFORM_LIMITS.seoDesc.chars, l: "SEO meta", val: text.length },
  ];
  const thread = splitTwitterThread(text, 280);
  const urlCount = (text.match(/https?:\/\/[^\s]+/gi) || []).length;
  const emojiCount = [...text].filter((c) => (c.codePointAt(0) ?? 0) > 0x1f300).length;

  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => setText("Just launched a new tool — try it at https://mytulify.com 🚀")}
        onClear={() => setText("")}
        onFileText={(t) => setText(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type to count characters…" rows={6} className="font-sans" />
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} /> X weighted count (URLs=23, emoji=2)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={showThread} onChange={(e) => setShowThread(e.target.checked)} /> Thread splitter preview</label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Characters" value={text.length} />
        <Stat label="X weighted" value={twitterLen} />
        <Stat label="Words" value={(text.trim().match(/\S+/g) || []).length} />
        <Stat label="URLs / emoji" value={`${urlCount} / ${emojiCount}`} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {limits.map((x) => {
          const len = x.val ?? text.length;
          return (
            <div key={x.l} className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm">
              <span>{x.l} ({x.n}){x.weighted && weighted ? " ⚖" : ""}</span>
              <span className={len > x.n ? "text-rose-500" : "text-emerald-500"}>{x.n - len} left</span>
            </div>
          );
        })}
      </div>
      {showThread && text.trim() && (
        <div className="space-y-2">
          <Notice tone="info">Thread preview — {thread.length} tweet{thread.length !== 1 ? "s" : ""}</Notice>
          {thread.map((t, i) => (
            <div key={i} className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-3">
              <span className="text-xs font-bold text-muted">{i + 1}/{thread.length}</span>
              <p className="min-w-0 flex-1 text-sm">{t}</p>
              <CopyButton value={t} label="" />
            </div>
          ))}
          <Output value={thread.map((t, i) => `${i + 1}/${thread.length}\n${t}`).join("\n\n---\n\n")} rows={8} mono={false} />
        </div>
      )}
    </div>
  );
}

export function SentenceCounter() {
  const [text, setText] = React.useState("");
  const [hist, setHist] = React.useState<string[]>([]);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  const list = (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || []).map((s) => s.trim()).filter(Boolean);
  const sentences = list.length;
  const words = (text.trim().match(/\S+/g) || []).length;
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => snapshot("Hello there. How are you? This is a third sentence!")}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} className="font-sans" placeholder="Paste text…" />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sentences" value={sentences} />
        <Stat label="Words" value={words} />
        <Stat label="Avg words/sentence" value={sentences ? Math.round(words / sentences) : 0} />
      </div>
      <Output value={list.map((s, i) => `${i + 1}. ${s}`).join("\n")} rows={8} filename="sentences.txt" mono={false} />
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
  const { text, setText, snapshot, undo, canUndo } = useToolText("The quick brown fox jumps over the lazy dog.");
  const ops: [string, (s: string) => string][] = [
    ["UPPERCASE", (s) => s.toUpperCase()],
    ["lowercase", (s) => s.toLowerCase()],
    ["Title Case", titleCase],
    ["Sentence case", (s) => s.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())],
    ["Capitalize Each Word", (s) => s.replace(/\b\w/g, (c) => c.toUpperCase())],
    ["aLtErNaTiNg", (s) => [...s].map((c, i) => (i % 2 ? c.toUpperCase() : c.toLowerCase())).join("")],
    ["InVeRsE", (s) => [...s].map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("")],
    ["camelCase", (s) => s.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())],
    ["PascalCase", (s) => s.toLowerCase().replace(/(^|[^a-z0-9]+)(.)/g, (_, __, c) => c.toUpperCase())],
    ["snake_case", (s) => s.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "")],
    ["CONSTANT_CASE", (s) => s.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^\w]/g, "")],
    ["kebab-case", (s) => s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")],
  ];
  const all = ops.map(([name, fn]) => `${name}: ${fn(text)}`).join("\n");
  return (
    <div className="space-y-4">
      <ToolBar onSample={() => snapshot("The quick brown fox jumps over the lazy dog.")} onClear={() => snapshot("")} onUndo={undo} canUndo={canUndo} onFileText={(t) => snapshot(t)} />
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
      <CopyButton value={all} label="Copy all cases" />
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
  const [ignoreCase, setIgnoreCase] = React.useState(false);
  const [trimLines, setTrimLines] = React.useState(false);
  const [dropEmpty, setDropEmpty] = React.useState(false);
  const fn = React.useCallback(
    (s: string) => {
      let lines = s.split("\n");
      if (trimLines) lines = lines.map((l) => l.trim());
      if (dropEmpty) lines = lines.filter((l) => l.length > 0);
      const key = (l: string) => (ignoreCase ? l.toLowerCase() : l);
      switch (mode) {
        case "az": return [...lines].sort((a, b) => key(a).localeCompare(key(b))).join("\n");
        case "za": return [...lines].sort((a, b) => key(b).localeCompare(key(a))).join("\n");
        case "num": return [...lines].sort((a, b) => parseFloat(a) - parseFloat(b)).join("\n");
        case "len": return [...lines].sort((a, b) => a.length - b.length).join("\n");
        case "rev": return [...lines].reverse().join("\n");
        case "shuffle": {
          const copy = [...lines];
          for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
          }
          return copy.join("\n");
        }
        default: return lines.join("\n");
      }
    },
    [mode, ignoreCase, trimLines, dropEmpty],
  );
  return (
    <TransformTool
      transform={fn}
      placeholder="Paste lines to sort…"
      sample={"zebra\nApple\nbanana\n\n10\n2\napple"}
      filename="sorted.txt"
      controls={
        <div className="mt-2 space-y-2">
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
            <option value="num">Numeric</option>
            <option value="len">By length</option>
            <option value="rev">Reverse order</option>
            <option value="shuffle">Shuffle</option>
          </Select>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} /> Ignore case</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={trimLines} onChange={(e) => setTrimLines(e.target.checked)} /> Trim lines</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={dropEmpty} onChange={(e) => setDropEmpty(e.target.checked)} /> Drop empty</label>
          </div>
        </div>
      }
    />
  );
}

/* ------------------------------ Text repeater ------------------------------ */
export function TextRepeater() {
  const [text, setText] = React.useState("Hello ");
  const [count, setCount] = React.useState(5);
  const [sep, setSep] = React.useState("");
  const [limit, setLimit] = React.useState(false);
  const n = Math.max(0, Math.min(limit ? 100 : 10000, count || 0));
  const out = Array.from({ length: n }, () => text).join(sep === "\\n" ? "\n" : sep);
  return (
    <div className="space-y-4">
      <Field label="Text to repeat">
        <Input value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Times">
          <Input type="number" min={0} max={10000} value={count} onChange={(e) => setCount(+e.target.value)} />
        </Field>
        <Field label="Separator" hint="use \n for new line">
          <Input value={sep} onChange={(e) => setSep(e.target.value)} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={limit} onChange={(e) => setLimit(e.target.checked)} /> Cap at 100 (preview)
      </label>
      <TextStatBar input={text} output={out} />
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
  const [whole, setWhole] = React.useState(false);
  const [hist, setHist] = React.useState<string[]>([]);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  let out = text;
  let count = 0;
  let error = "";
  try {
    if (find) {
      const flags = "g" + (ci ? "i" : "");
      let pattern = regex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (whole) pattern = `\\b${pattern}\\b`;
      const re = new RegExp(pattern, flags);
      count = (text.match(re) || []).length;
      out = text.replace(re, rep);
    }
  } catch {
    error = "Invalid regular expression";
    out = text;
  }
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => {
          snapshot("The cat sat on the catalog. Cat and cats.");
          setFind("cat");
          setRep("dog");
        }}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
        extra={
          find && out !== text ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => snapshot(out)}>
              Apply to input
            </Button>
          ) : null
        }
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" placeholder="Paste text…" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Find"><Input value={find} onChange={(e) => setFind(e.target.value)} /></Field>
        <Field label="Replace with"><Input value={rep} onChange={(e) => setRep(e.target.value)} /></Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={regex} onChange={(e) => setRegex(e.target.checked)} /> Regex</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={ci} onChange={(e) => setCi(e.target.checked)} /> Case-insensitive</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} /> Whole word</label>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : <Notice tone="info">{count} replacement{count !== 1 ? "s" : ""}</Notice>}
      <TextStatBar input={text} output={out} />
      <Output value={out} filename="result.txt" mono={false} />
    </div>
  );
}

/* --------------------------- Word frequency -------------------------------- */
export function WordFrequency() {
  const [text, setText] = React.useState("");
  const [stop, setStop] = React.useState(false);
  const [hist, setHist] = React.useState<string[]>([]);
  const snapshot = (next: string) => {
    setHist((h) => [...h.slice(-19), text]);
    setText(next);
  };
  const STOP = new Set("a an the and or but is are was were to of in on for with at by from it this that".split(" "));
  const freq = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const w of text.toLowerCase().match(/\b[\w']+\b/g) || []) {
      if (stop && STOP.has(w)) continue;
      map.set(w, (map.get(w) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100);
  }, [text, stop]);
  const max = freq[0]?.[1] || 1;
  const csv = ["word,count", ...freq.map(([w, c]) => `${w},${c}`)].join("\n");
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => snapshot(DEFAULT_SAMPLE)}
        onClear={() => snapshot("")}
        onUndo={() => {
          const prev = hist[hist.length - 1];
          if (prev === undefined) return;
          setHist(hist.slice(0, -1));
          setText(prev);
        }}
        canUndo={hist.length > 0}
        onFileText={(t) => snapshot(t)}
      />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" placeholder="Paste text to analyze…" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={stop} onChange={(e) => setStop(e.target.checked)} /> Ignore common stop words
      </label>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Unique" value={freq.length} />
        <Stat label="Top word" value={freq[0]?.[0] || "—"} />
        <Stat label="Top count" value={freq[0]?.[1] || 0} />
      </div>
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
      {freq.length > 0 && <Output value={csv} rows={6} filename="word-frequency.csv" />}
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
  const [ignoreWs, setIgnoreWs] = React.useState(false);
  const norm = (s: string) => (ignoreWs ? s.replace(/\s+/g, " ").trim() : s);
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const max = Math.max(linesA.length, linesB.length);
  const rows = Array.from({ length: max }, (_, i) => {
    const la = linesA[i] ?? "";
    const lb = linesB[i] ?? "";
    return { la, lb, same: norm(la) === norm(lb) };
  });
  const changed = rows.filter((r) => !r.same).length;
  const added = rows.filter((r) => !r.same && !r.la && r.lb).length;
  const removed = rows.filter((r) => !r.same && r.la && !r.lb).length;
  return (
    <div className="space-y-4">
      <ToolBar
        onSample={() => {
          setA("hello world\nsecond line\nunchanged");
          setB("hello world!\nsecond line edited\nunchanged\nnew line");
        }}
        onClear={() => { setA(""); setB(""); }}
        extra={
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={ignoreWs} onChange={(e) => setIgnoreWs(e.target.checked)} /> Ignore whitespace
          </label>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Changed lines" value={changed} />
        <Stat label="Added" value={added} />
        <Stat label="Removed" value={removed} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Original">
          <Textarea value={a} onChange={(e) => setA(e.target.value)} rows={8} />
        </Field>
        <Field label="Changed">
          <Textarea value={b} onChange={(e) => setB(e.target.value)} rows={8} />
        </Field>
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
  const [html, setHtml] = React.useState(false);
  const [startLorem, setStartLorem] = React.useState(true);
  const [tick, setTick] = React.useState(0);
  const out = React.useMemo(() => {
    const sentence = (first?: boolean) => {
      if (first && startLorem) return "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
      const len = 8 + Math.floor(Math.random() * 8);
      const w = Array.from({ length: len }, () => LOREM[Math.floor(Math.random() * LOREM.length)]);
      w[0] = w[0][0].toUpperCase() + w[0].slice(1);
      return w.join(" ") + ".";
    };
    let raw: string;
    if (unit === "words") raw = (startLorem ? "lorem ipsum " : "") + Array.from({ length: Math.max(0, count) }, () => LOREM[Math.floor(Math.random() * LOREM.length)]).join(" ");
    else if (unit === "sentences") raw = Array.from({ length: Math.max(0, count) }, (_, i) => sentence(i === 0)).join(" ");
    else raw = Array.from({ length: Math.max(0, count) }, (_, i) => Array.from({ length: 4 }, (_, j) => sentence(i === 0 && j === 0)).join(" ")).join("\n\n");
    if (html && unit === "paragraphs") return raw.split("\n\n").map((p) => `<p>${p}</p>`).join("\n");
    return raw;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, unit, html, startLorem, tick]);
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
        <Button type="button" variant="secondary" onClick={() => setTick((t) => t + 1)}>Regenerate</Button>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={startLorem} onChange={(e) => setStartLorem(e.target.checked)} /> Start with “Lorem ipsum”</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={html} onChange={(e) => setHtml(e.target.checked)} /> Wrap in &lt;p&gt; tags</label>
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
  const [pitch, setPitch] = React.useState(1);
  const [vol, setVol] = React.useState(1);
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
    u.pitch = pitch;
    u.volume = vol;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  return (
    <div className="space-y-4">
      <ToolBar onSample={() => setText("Hello! This text will be read aloud by your browser.")} onClear={() => setText("")} onFileText={(t) => setText(t)} />
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="font-sans" />
      <p className="text-xs text-muted">{text.length} characters · ~{Math.max(1, Math.round((text.trim().match(/\S+/g) || []).length / 130))} min spoken</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Voice">
          <Select value={voice} onChange={(e) => setVoice(e.target.value)}>
            <option value="">Default</option>
            {voices.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
          </Select>
        </Field>
        <Field label={`Speed: ${rate.toFixed(1)}x`}>
          <input type="range" min={0.5} max={2} step={0.1} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Pitch: ${pitch.toFixed(1)}`}>
          <input type="range" min={0.5} max={2} step={0.1} value={pitch} onChange={(e) => setPitch(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Volume: ${Math.round(vol * 100)}%`}>
          <input type="range" min={0} max={1} step={0.05} value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button onClick={speak}>▶ Speak</Button>
        <Button variant="secondary" onClick={() => speechSynthesis.pause()}>Pause</Button>
        <Button variant="secondary" onClick={() => speechSynthesis.resume()}>Resume</Button>
        <Button variant="secondary" onClick={() => speechSynthesis.cancel()}>■ Stop</Button>
      </div>
    </div>
  );
}
