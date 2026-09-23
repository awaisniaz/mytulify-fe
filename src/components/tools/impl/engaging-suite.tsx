"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { CopyButton, Field, Output, Notice, Stat } from "@/components/tools/shared";
import { download } from "@/lib/utils";

/* ===================== Decision Wheel ===================== */
const WHEEL_COLORS = [
  "#0d9488",
  "#ea580c",
  "#2563eb",
  "#ca8a04",
  "#db2777",
  "#059669",
  "#dc2626",
  "#4f46e5",
];

export function DecisionWheel() {
  const [raw, setRaw] = React.useState("Pizza\nSushi\nTacos\nBurgers\nSalad\nPasta");
  const [spinning, setSpinning] = React.useState(false);
  const [rotation, setRotation] = React.useState(0);
  const [winner, setWinner] = React.useState<string | null>(null);
  const options = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 24);

  const spin = () => {
    if (options.length < 2 || spinning) return;
    setWinner(null);
    setSpinning(true);
    const idx = Math.floor(Math.random() * options.length);
    const slice = 360 / options.length;
    // Pointer at top; land on center of chosen slice after several turns
    const target = 360 * 6 + (360 - (idx * slice + slice / 2));
    setRotation((prev) => {
      const base = prev % 360;
      return prev + (target - base);
    });
    window.setTimeout(() => {
      setWinner(options[idx]!);
      setSpinning(false);
    }, 4200);
  };

  const size = 280;
  const r = size / 2;
  const slices = options.map((label, i) => {
    const start = (i / options.length) * Math.PI * 2 - Math.PI / 2;
    const end = ((i + 1) / options.length) * Math.PI * 2 - Math.PI / 2;
    const x1 = r + r * Math.cos(start);
    const y1 = r + r * Math.sin(start);
    const x2 = r + r * Math.cos(end);
    const y2 = r + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    const mid = start + (end - start) / 2;
    const tx = r + r * 0.62 * Math.cos(mid);
    const ty = r + r * 0.62 * Math.sin(mid);
    return { label, d: `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, tx, ty, mid, color: WHEEL_COLORS[i % WHEEL_COLORS.length]! };
  });

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Add options (one per line), spin the wheel, and let fate decide — perfect for lunch, chores, or team picks.
      </Notice>
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,320px)]">
        <Field label="Options" hint="2–24 options, one per line">
          <Textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={10} className="font-sans" />
        </Field>
        <div className="flex flex-col items-center gap-4">
          <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[320px]" style={{ aspectRatio: "1" }}>
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
              <div
                className="h-0 w-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent"
                style={{ borderTopColor: "var(--foreground)" }}
              />
            </div>
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="h-full w-full rounded-full shadow-lg ring-4 ring-border"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.75, 0.12, 1)" : "none",
              }}
            >
              {slices.map((s, i) => (
                <g key={i}>
                  <path d={s.d} fill={s.color} stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
                  <text
                    x={s.tx}
                    y={s.ty}
                    fill="#fff"
                    fontSize={options.length > 10 ? 10 : 12}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${(s.mid * 180) / Math.PI}, ${s.tx}, ${s.ty})`}
                  >
                    {s.label.length > 14 ? `${s.label.slice(0, 12)}…` : s.label}
                  </text>
                </g>
              ))}
              <circle cx={r} cy={r} r={28} fill="var(--surface)" stroke="var(--border)" strokeWidth={3} />
            </svg>
          </div>
          <Button onClick={spin} disabled={spinning || options.length < 2} className="min-w-[10rem]">
            {spinning ? "Spinning…" : "Spin the wheel"}
          </Button>
          {winner && !spinning && (
            <div className="w-full rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Winner</p>
              <p className="mt-1 text-2xl font-bold text-brand">{winner}</p>
            </div>
          )}
          <Stat label="Options" value={options.length} />
        </div>
      </div>
    </div>
  );
}

/* ===================== Pomodoro Timer ===================== */
type PomodoroMode = "focus" | "short" | "long";

export function PomodoroTimer() {
  const [focusMin, setFocusMin] = React.useState(25);
  const [shortMin, setShortMin] = React.useState(5);
  const [longMin, setLongMin] = React.useState(15);
  const [mode, setMode] = React.useState<PomodoroMode>("focus");
  const [secondsLeft, setSecondsLeft] = React.useState(25 * 60);
  const [running, setRunning] = React.useState(false);
  const [completed, setCompleted] = React.useState(0);
  const [task, setTask] = React.useState("");

  const durationFor = React.useCallback(
    (m: PomodoroMode) => (m === "focus" ? focusMin : m === "short" ? shortMin : longMin) * 60,
    [focusMin, shortMin, longMin],
  );

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        window.clearInterval(id);
        setRunning(false);
        try {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (Ctx) {
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.08;
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
          }
        } catch {
          /* ignore */
        }
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(mode === "focus" ? "Focus session done — take a break!" : "Break over — back to focus!");
        }
        if (mode === "focus") {
          setCompleted((c) => {
            const nextCount = c + 1;
            const next: PomodoroMode = nextCount % 4 === 0 ? "long" : "short";
            queueMicrotask(() => {
              setMode(next);
              setSecondsLeft(durationFor(next));
            });
            return nextCount;
          });
          return 0;
        }
        queueMicrotask(() => {
          setMode("focus");
          setSecondsLeft(durationFor("focus"));
        });
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode, durationFor]);

  const switchMode = (m: PomodoroMode) => {
    setRunning(false);
    setMode(m);
    setSecondsLeft(durationFor(m));
  };

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const total = durationFor(mode);
  const progress = total ? 1 - secondsLeft / total : 0;

  return (
    <div className="space-y-5">
      <Notice tone="info">
        Classic Pomodoro: focus, short break, long break every 4 sessions. Runs in your browser — optional desktop
        notification when a session ends.
      </Notice>
      <Field label="What are you working on? (optional)">
        <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Write blog draft…" />
      </Field>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["focus", "Focus"],
            ["short", "Short break"],
            ["long", "Long break"],
          ] as const
        ).map(([k, label]) => (
          <Button key={k} variant={mode === k ? "primary" : "secondary"} size="sm" onClick={() => switchMode(k)}>
            {label}
          </Button>
        ))}
      </div>
      <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(progress * 276.46).toFixed(2)} 276.46`}
            className="transition-[stroke-dasharray] duration-1000 linear"
          />
        </svg>
        <div className="text-center">
          <p className="font-mono text-5xl font-bold tracking-tight tabular-nums">
            {mm}:{ss}
          </p>
          <p className="mt-1 text-xs font-bold uppercase text-muted">
            {mode === "focus" ? "Focus" : mode === "short" ? "Short break" : "Long break"}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setRunning(false);
            setSecondsLeft(durationFor(mode));
          }}
        >
          Reset
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (typeof Notification !== "undefined" && Notification.permission === "default") {
              void Notification.requestPermission();
            }
          }}
        >
          Enable alerts
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pomodoros done" value={completed} />
        <Field label="Focus (min)">
          <Input
            type="number"
            min={1}
            max={90}
            value={focusMin}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value) || 25);
              setFocusMin(v);
              if (mode === "focus" && !running) setSecondsLeft(v * 60);
            }}
          />
        </Field>
        <Field label="Short break">
          <Input type="number" min={1} max={30} value={shortMin} onChange={(e) => setShortMin(Math.max(1, Number(e.target.value) || 5))} />
        </Field>
        <Field label="Long break">
          <Input type="number" min={1} max={60} value={longMin} onChange={(e) => setLongMin(Math.max(1, Number(e.target.value) || 15))} />
        </Field>
      </div>
      {task.trim() && (
        <p className="text-center text-sm text-muted">
          Current task: <strong className="text-foreground">{task}</strong>
        </p>
      )}
    </div>
  );
}

/* ===================== Speech to Text (Voice Dictation) ===================== */
type SpeechRecResult = { 0: { transcript: string; confidence?: number }; isFinal: boolean; length: number };
type SpeechRecEvent = { resultIndex: number; results: ArrayLike<SpeechRecResult> & { length: number } };
type SpeechRec = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
};

const STT_LANGS = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-IN", label: "English (India)" },
  { value: "ur-PK", label: "Urdu (Pakistan)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "ar-SA", label: "Arabic" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "es-ES", label: "Spanish" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "tr-TR", label: "Turkish" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
] as const;

function getSpeechRecognitionCtor(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function SpeechToText() {
  const [text, setText] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [listening, setListening] = React.useState(false);
  const [lang, setLang] = React.useState("en-US");
  const [autoRestart, setAutoRestart] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  const recRef = React.useRef<SpeechRec | null>(null);
  const wantListenRef = React.useRef(false);
  const langRef = React.useRef(lang);
  langRef.current = lang;

  const Ctor = React.useMemo(() => getSpeechRecognitionCtor(), []);
  const supported = Boolean(Ctor);

  React.useEffect(() => {
    if (!listening || startedAt == null) return;
    const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [listening, startedAt]);

  React.useEffect(() => {
    return () => {
      wantListenRef.current = false;
      try {
        recRef.current?.abort?.();
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const appendFinal = React.useCallback((chunk: string) => {
    const piece = chunk.trim();
    if (!piece) return;
    setText((prev) => {
      if (!prev.trim()) return piece;
      const needsSpace = !/[\s\n]$/.test(prev) && !/^[,.;:!?]/.test(piece);
      return needsSpace ? `${prev} ${piece}` : `${prev}${piece}`;
    });
  }, []);

  const startRecognition = React.useCallback(() => {
    if (!Ctor) {
      setError("Speech recognition isn’t supported here. Use Chrome or Edge on desktop/Android.");
      return;
    }
    setError(null);
    try {
      recRef.current?.abort?.();
    } catch {
      /* ignore */
    }

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = langRef.current;

    rec.onstart = () => {
      setListening(true);
      setStartedAt((t) => t ?? Date.now());
    };

    rec.onresult = (ev) => {
      let finals = "";
      let inter = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i]!;
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) finals += t;
        else inter += t;
      }
      if (finals) appendFinal(finals);
      setInterim(inter);
    };

    rec.onerror = (ev) => {
      const code = ev.error;
      if (code === "aborted" || code === "no-speech") return;
      const msg =
        code === "not-allowed"
          ? "Microphone permission denied. Allow mic access and try again."
          : code === "audio-capture"
            ? "No microphone found. Plug in a mic and retry."
            : code === "network"
              ? "Network error from the browser speech service. Check your connection."
              : `Speech error: ${code}`;
      setError(msg);
      wantListenRef.current = false;
      setListening(false);
      setInterim("");
    };

    rec.onend = () => {
      setInterim("");
      if (wantListenRef.current && autoRestart) {
        window.setTimeout(() => {
          if (!wantListenRef.current) return;
          try {
            startRecognition();
          } catch {
            setListening(false);
            wantListenRef.current = false;
          }
        }, 250);
        return;
      }
      setListening(false);
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone. Click Start again.");
      wantListenRef.current = false;
      setListening(false);
    }
  }, [Ctor, appendFinal, autoRestart]);

  const start = () => {
    wantListenRef.current = true;
    setStartedAt(Date.now());
    setElapsed(0);
    startRecognition();
  };

  const stop = () => {
    wantListenRef.current = false;
    setInterim("");
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const insertAtEnd = (s: string) => {
    setText((prev) => (prev ? `${prev}${s}` : s.trimStart()));
    setInterim("");
  };

  const display = text + (interim ? (text && !/[\s\n]$/.test(text) ? " " : "") + interim : "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Voice dictation: speak into your mic and get editable text instantly. Runs in your browser (Web Speech API) —
        best in <strong>Chrome</strong> or <strong>Edge</strong>. Pick Urdu or English below.
      </Notice>
      {!supported && (
        <Notice tone="error">
          This browser doesn’t support speech recognition. Open this page in Chrome or Edge (desktop / Android).
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-2/40 p-6">
        <button
          type="button"
          disabled={!supported}
          onClick={() => (listening ? stop() : start())}
          className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl shadow-md transition focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${
            listening
              ? "bg-rose-500 text-white animate-pulse"
              : "bg-brand text-white hover:opacity-90"
          }`}
          aria-label={listening ? "Stop dictation" : "Start dictation"}
        >
          {listening ? "■" : "🎤"}
        </button>
        <p className="text-sm font-medium">
          {listening ? (
            <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
              Listening… {mm}:{ss}
            </span>
          ) : (
            <span className="text-muted">Tap the mic, allow permission, then speak</span>
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Dictation language">
          <Select
            value={lang}
            disabled={listening}
            onChange={(e) => setLang(e.target.value)}
          >
            {STT_LANGS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Continuous listening">
          <Select
            value={autoRestart ? "on" : "off"}
            disabled={listening}
            onChange={(e) => setAutoRestart(e.target.value === "on")}
          >
            <option value="on">On — keep listening until you stop</option>
            <option value="off">Off — stop when the browser pauses</option>
          </Select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            [". ", "Period"],
            [", ", "Comma"],
            ["? ", "?"],
            ["! ", "!"],
            ["\n\n", "New para"],
          ] as const
        ).map(([v, label]) => (
          <Button key={label} type="button" variant="secondary" size="sm" onClick={() => insertAtEnd(v)}>
            {label}
          </Button>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setText("");
            setInterim("");
          }}
        >
          Clear all
        </Button>
      </div>

      <Field label="Transcript" hint={interim ? "Gray text = still listening (not final yet)" : undefined}>
        <Textarea
          value={display}
          onChange={(e) => {
            setText(e.target.value);
            setInterim("");
          }}
          rows={12}
          className="font-sans text-base leading-relaxed"
          placeholder="Your spoken words will appear here as text…"
          dir={lang.startsWith("ur") || lang.startsWith("ar") ? "rtl" : "ltr"}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Words" value={words} />
        <Stat label="Characters" value={chars} />
        <Stat label="Session" value={listening || elapsed ? `${mm}:${ss}` : "—"} />
      </div>

      <div className="flex flex-wrap gap-2">
        <CopyButton value={text} label="Copy text" />
        <Button type="button" variant="secondary" size="sm" disabled={!text} onClick={() => download(text, "dictation.txt")}>
          Download .txt
        </Button>
      </div>
      <Output value={text} rows={4} filename="dictation.txt" mono={false} empty="Final text ready to copy or download…" />
    </div>
  );
}

/* ===================== Debt Payoff ===================== */
type Debt = { id: string; name: string; balance: string; rate: string; min: string };

function parseDebt(d: Debt) {
  return {
    name: d.name || "Debt",
    balance: Math.max(0, parseFloat(d.balance) || 0),
    rate: Math.max(0, parseFloat(d.rate) || 0),
    min: Math.max(0, parseFloat(d.min) || 0),
  };
}

function simulatePayoff(debtsIn: ReturnType<typeof parseDebt>[], extra: number, method: "snowball" | "avalanche") {
  const debts = debtsIn.map((d) => ({ ...d })).filter((d) => d.balance > 0);
  if (!debts.length) return null;
  const schedule: { month: number; totalPaid: number; interest: number; remaining: number }[] = [];
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const order = () =>
    [...debts].sort((a, b) => (method === "snowball" ? a.balance - b.balance : b.rate - a.rate));

  while (debts.some((d) => d.balance > 0.01) && month < 600) {
    month++;
    let interestThis = 0;
    for (const d of debts) {
      if (d.balance <= 0) continue;
      const i = (d.balance * d.rate) / 100 / 12;
      d.balance += i;
      interestThis += i;
    }
    totalInterest += interestThis;
    let budget = debts.reduce((s, d) => s + (d.balance > 0 ? d.min : 0), 0) + extra;
    // pay minimums
    for (const d of debts) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.balance, d.min);
      d.balance -= pay;
      budget -= pay;
      totalPaid += pay;
    }
    // avalanche/snowball extra on target
    for (const d of order()) {
      if (budget <= 0.01) break;
      if (d.balance <= 0) continue;
      const pay = Math.min(d.balance, budget);
      d.balance -= pay;
      budget -= pay;
      totalPaid += pay;
    }
    const remaining = debts.reduce((s, d) => s + Math.max(0, d.balance), 0);
    if (month <= 36 || month % 6 === 0 || remaining < 1) {
      schedule.push({ month, totalPaid, interest: totalInterest, remaining });
    }
    if (remaining < 0.5) break;
  }
  return { months: month, totalInterest, totalPaid, schedule, years: month / 12 };
}

export function DebtPayoffCalculator() {
  const [debts, setDebts] = React.useState<Debt[]>([
    { id: "1", name: "Credit card", balance: "3200", rate: "22", min: "90" },
    { id: "2", name: "Personal loan", balance: "5000", rate: "11", min: "150" },
    { id: "3", name: "Store card", balance: "800", rate: "27", min: "40" },
  ]);
  const [extra, setExtra] = React.useState("200");
  const [method, setMethod] = React.useState<"snowball" | "avalanche">("avalanche");

  const result = React.useMemo(() => {
    return simulatePayoff(
      debts.map(parseDebt),
      Math.max(0, parseFloat(extra) || 0),
      method,
    );
  }, [debts, extra, method]);

  const other = React.useMemo(() => {
    const alt = method === "avalanche" ? "snowball" : "avalanche";
    return simulatePayoff(debts.map(parseDebt), Math.max(0, parseFloat(extra) || 0), alt);
  }, [debts, extra, method]);

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Compare <strong>avalanche</strong> (highest interest first — usually cheaper) vs <strong>snowball</strong>{" "}
        (smallest balance first — faster wins). Add extra monthly payment to see months saved.
      </Notice>
      <div className="space-y-3">
        {debts.map((d, i) => (
          <div key={d.id} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-4">
            <Field label="Name">
              <Input
                value={d.name}
                onChange={(e) => setDebts((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              />
            </Field>
            <Field label="Balance">
              <Input
                type="number"
                value={d.balance}
                onChange={(e) => setDebts((arr) => arr.map((x, j) => (j === i ? { ...x, balance: e.target.value } : x)))}
              />
            </Field>
            <Field label="APR %">
              <Input
                type="number"
                value={d.rate}
                onChange={(e) => setDebts((arr) => arr.map((x, j) => (j === i ? { ...x, rate: e.target.value } : x)))}
              />
            </Field>
            <Field label="Min payment">
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={d.min}
                  onChange={(e) => setDebts((arr) => arr.map((x, j) => (j === i ? { ...x, min: e.target.value } : x)))}
                />
                {debts.length > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDebts((arr) => arr.filter((_, j) => j !== i))}
                  >
                    ✕
                  </Button>
                )}
              </div>
            </Field>
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setDebts((arr) => [
              ...arr,
              { id: String(Date.now()), name: `Debt ${arr.length + 1}`, balance: "1000", rate: "15", min: "50" },
            ])
          }
        >
          + Add debt
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Extra monthly payment">
          <Input type="number" value={extra} onChange={(e) => setExtra(e.target.value)} />
        </Field>
        <Field label="Strategy">
          <Select value={method} onChange={(e) => setMethod(e.target.value as "snowball" | "avalanche")}>
            <option value="avalanche">Avalanche (highest APR first)</option>
            <option value="snowball">Snowball (smallest balance first)</option>
          </Select>
        </Field>
      </div>
      {result && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Debt-free in" value={`${result.months} mo`} />
            <Stat label="Years" value={result.years.toFixed(1)} />
            <Stat label="Total interest" value={result.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
            <Stat label="Total paid" value={result.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })} />
          </div>
          {other && (
            <Notice tone="success">
              {method === "avalanche" ? "Avalanche" : "Snowball"} vs{" "}
              {method === "avalanche" ? "Snowball" : "Avalanche"}: interest difference{" "}
              <strong>
                {Math.abs(result.totalInterest - other.totalInterest).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </strong>{" "}
              · time difference <strong>{Math.abs(result.months - other.months)} months</strong>
            </Notice>
          )}
          <div className="max-h-56 overflow-y-auto rounded-xl border border-border text-sm">
            <table className="w-full">
              <thead className="sticky top-0 bg-surface-2 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">Paid</th>
                  <th className="px-3 py-2 text-left">Interest</th>
                  <th className="px-3 py-2 text-left">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((row) => (
                  <tr key={row.month} className="border-t border-border">
                    <td className="px-3 py-1.5">{row.month}</td>
                    <td className="px-3 py-1.5">{row.totalPaid.toFixed(0)}</td>
                    <td className="px-3 py-1.5">{row.interest.toFixed(0)}</td>
                    <td className="px-3 py-1.5">{row.remaining.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ===================== JSON Diff ===================== */
type DiffRow = { path: string; type: "added" | "removed" | "changed"; left?: string; right?: string };

function flattenJson(value: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (value === null || typeof value !== "object") {
    out[prefix || "(root)"] = JSON.stringify(value);
    return out;
  }
  if (Array.isArray(value)) {
    if (!value.length) out[prefix || "(root)"] = "[]";
    value.forEach((v, i) => Object.assign(out, flattenJson(v, prefix ? `${prefix}[${i}]` : `[${i}]`)));
    return out;
  }
  const keys = Object.keys(value as object);
  if (!keys.length) out[prefix || "(root)"] = "{}";
  for (const k of keys) {
    const path = prefix ? `${prefix}.${k}` : k;
    Object.assign(out, flattenJson((value as Record<string, unknown>)[k], path));
  }
  return out;
}

export function JsonDiffChecker() {
  const [left, setLeft] = React.useState('{\n  "name": "Ada",\n  "role": "engineer",\n  "level": 2\n}');
  const [right, setRight] = React.useState('{\n  "name": "Ada",\n  "role": "staff",\n  "team": "platform"\n}');

  const report = React.useMemo(() => {
    let a: unknown;
    let b: unknown;
    try {
      a = JSON.parse(left);
    } catch (e) {
      return { error: `Left JSON: ${(e as Error).message}`, rows: [] as DiffRow[] };
    }
    try {
      b = JSON.parse(right);
    } catch (e) {
      return { error: `Right JSON: ${(e as Error).message}`, rows: [] as DiffRow[] };
    }
    const fa = flattenJson(a);
    const fb = flattenJson(b);
    const paths = new Set([...Object.keys(fa), ...Object.keys(fb)]);
    const rows: DiffRow[] = [];
    for (const p of [...paths].sort()) {
      const lv = fa[p];
      const rv = fb[p];
      if (lv === undefined) rows.push({ path: p, type: "added", right: rv });
      else if (rv === undefined) rows.push({ path: p, type: "removed", left: lv });
      else if (lv !== rv) rows.push({ path: p, type: "changed", left: lv, right: rv });
    }
    return { error: null as string | null, rows };
  }, [left, right]);

  const counts = {
    added: report.rows.filter((r) => r.type === "added").length,
    removed: report.rows.filter((r) => r.type === "removed").length,
    changed: report.rows.filter((r) => r.type === "changed").length,
  };

  return (
    <div className="space-y-4">
      <Notice tone="info">
        Paste two JSON documents to see path-level additions, removals, and value changes — great for API payloads and
        config reviews.
      </Notice>
      <div className="grid gap-3 lg:grid-cols-2">
        <Field label="Original (left)">
          <Textarea value={left} onChange={(e) => setLeft(e.target.value)} rows={12} className="font-mono text-xs" />
        </Field>
        <Field label="Updated (right)">
          <Textarea value={right} onChange={(e) => setRight(e.target.value)} rows={12} className="font-mono text-xs" />
        </Field>
      </div>
      {report.error && <Notice tone="error">{report.error}</Notice>}
      {!report.error && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Added" value={counts.added} />
            <Stat label="Removed" value={counts.removed} />
            <Stat label="Changed" value={counts.changed} />
          </div>
          {report.rows.length === 0 ? (
            <Notice tone="success">No differences — JSON values match at every path.</Notice>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border text-sm">
              <table className="w-full">
                <thead className="sticky top-0 bg-surface-2 text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Path</th>
                    <th className="px-3 py-2 text-left">Change</th>
                    <th className="px-3 py-2 text-left">Left</th>
                    <th className="px-3 py-2 text-left">Right</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((r) => (
                    <tr key={r.path} className="border-t border-border">
                      <td className="px-3 py-1.5 font-mono text-xs">{r.path}</td>
                      <td
                        className={`px-3 py-1.5 font-medium ${
                          r.type === "added"
                            ? "text-emerald-600"
                            : r.type === "removed"
                              ? "text-rose-600"
                              : "text-amber-600"
                        }`}
                      >
                        {r.type}
                      </td>
                      <td className="max-w-[10rem] truncate px-3 py-1.5 font-mono text-xs">{r.left ?? "—"}</td>
                      <td className="max-w-[10rem] truncate px-3 py-1.5 font-mono text-xs">{r.right ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ===================== Inflation calculator ===================== */
export { InflationCalculator } from "./finance-calcs";
