"use client";

import * as React from "react";
import { Input, Select, Textarea, Button } from "@/components/ui/primitives";
import { Field, Notice, Stat, CopyButton } from "@/components/tools/shared";
import { download } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  TONE_PRESETS,
  type ToneKey,
  sampleForLang,
  previewForLang,
  langFamilyLabel,
  langLocaleLabel,
  inferGender,
  cleanActorName,
  detectTextLanguage,
  voicesForLanguage,
  pickBestVoice,
  speakUtterance,
  type VoiceGender,
} from "./tts-data";

/* ── Caption export ─────────────────────────────────────────────────────── */

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatSrtTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms).padStart(3, "0")}`;
}

function estimateDuration(text: string, rate: number, wpm = 140) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, (words / (wpm * rate)) * 60);
}

function textToSrt(text: string, rate: number): string {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim());
  if (sentences.length === 0) return "";
  let t = 0;
  const blocks: string[] = [];
  sentences.forEach((sentence, i) => {
    const dur = estimateDuration(sentence, rate);
    blocks.push(`${i + 1}\n${formatSrtTime(t)} --> ${formatSrtTime(t + dur)}\n${sentence.trim()}\n`);
    t += dur + 0.3;
  });
  return blocks.join("\n");
}

function textToVtt(text: string, rate: number): string {
  return `WEBVTT\n\n${textToSrt(text, rate).replace(/^\d+\n/gm, "").replace(/,/g, ".")}`;
}

/* ── Voice catalog ────────────────────────────────────────────────────────── */

type LangFamily = { base: string; label: string; locales: { code: string; label: string; voices: SpeechSynthesisVoice[] }[] };

function buildCatalog(voices: SpeechSynthesisVoice[]): LangFamily[] {
  const byBase = new Map<string, Map<string, SpeechSynthesisVoice[]>>();
  for (const v of voices) {
    const base = (v.lang.split("-")[0] ?? v.lang).toLowerCase();
    if (!byBase.has(base)) byBase.set(base, new Map());
    const locales = byBase.get(base)!;
    const list = locales.get(v.lang) ?? [];
    list.push(v);
    locales.set(v.lang, list);
  }
  return [...byBase.entries()]
    .map(([base, locales]) => ({
      base,
      label: langFamilyLabel(base),
      locales: [...locales.entries()]
        .map(([code, vs]) => ({
          code,
          label: langLocaleLabel(code),
          voices: vs.sort((a, b) => a.name.localeCompare(b.name)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function useSpeechVoices() {
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const load = () => {
      const list = speechSynthesis.getVoices();
      if (list.length) setVoices([...list]);
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    const timers = [100, 400, 1000, 2500].map((ms) => window.setTimeout(load, ms));
    return () => {
      timers.forEach(clearTimeout);
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const catalog = React.useMemo(() => buildCatalog(voices), [voices]);
  const familyCount = catalog.length;
  const actorCount = voices.length;
  const localeCount = catalog.reduce((n, f) => n + f.locales.length, 0);

  return { voices, supported, catalog, familyCount, actorCount, localeCount };
}

/* ── Main tool ──────────────────────────────────────────────────────────── */

export function ContentCreatorTextToSpeech() {
  const { voices, supported, catalog, familyCount, actorCount, localeCount } = useSpeechVoices();

  const [text, setText] = React.useState(sampleForLang("en-US"));
  const [langSearch, setLangSearch] = React.useState("");
  const [familyBase, setFamilyBase] = React.useState("");
  const [locale, setLocale] = React.useState("");
  const [voiceName, setVoiceName] = React.useState("");
  const [genderFilter, setGenderFilter] = React.useState<"all" | VoiceGender>("all");
  const [tone, setTone] = React.useState<ToneKey>("natural");
  const [rate, setRate] = React.useState(1);
  const [pitch, setPitch] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [speaking, setSpeaking] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [paragraphMode, setParagraphMode] = React.useState(false);
  const [previewingTone, setPreviewingTone] = React.useState<ToneKey | null>(null);
  const [speakError, setSpeakError] = React.useState("");
  const queueRef = React.useRef<string[]>([]);
  const activeVoiceRef = React.useRef<SpeechSynthesisVoice | undefined>(undefined);

  const detectedLang = React.useMemo(() => detectTextLanguage(text), [text]);
  const detectedVoices = React.useMemo(
    () => (detectedLang ? voicesForLanguage(voices, detectedLang) : []),
    [voices, detectedLang],
  );

  const filteredFamilies = React.useMemo(() => {
    const q = langSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (f) =>
        f.label.toLowerCase().includes(q) ||
        f.base.includes(q) ||
        f.locales.some((l) => l.label.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)),
    );
  }, [catalog, langSearch]);

  React.useEffect(() => {
    if (!familyBase && filteredFamilies.length) setFamilyBase(filteredFamilies[0]!.base);
  }, [filteredFamilies, familyBase]);

  const currentFamily = catalog.find((f) => f.base === familyBase) ?? filteredFamilies[0];

  React.useEffect(() => {
    if (currentFamily && !currentFamily.locales.some((l) => l.code === locale)) {
      setLocale(currentFamily.locales[0]?.code ?? "");
    }
  }, [currentFamily, locale]);

  React.useEffect(() => {
    if (!detectedLang || !catalog.length) return;
    const family = catalog.find((f) => f.base === detectedLang);
    if (!family) return;
    setFamilyBase(detectedLang);
    const best = pickBestVoice(voices, detectedLang, voiceName);
    const bestLocale = best?.lang ?? family.locales[0]?.code ?? "";
    if (bestLocale) setLocale(bestLocale);
    if (best) setVoiceName(best.name);
  }, [detectedLang, catalog, voices]); // eslint-disable-line react-hooks/exhaustive-deps

  const localeVoices = React.useMemo(() => {
    const base = familyBase || (locale.split("-")[0] ?? locale);
    let raw = voicesForLanguage(voices, base);
    if (locale && raw.some((v) => v.lang === locale)) {
      raw = raw.filter((v) => v.lang === locale);
    }
    if (genderFilter === "all") return raw;
    return raw.filter((v) => inferGender(v) === genderFilter);
  }, [voices, locale, familyBase, genderFilter]);

  React.useEffect(() => {
    if (localeVoices.length && !localeVoices.some((v) => v.name === voiceName)) {
      const pick = localeVoices.find((v) => v.localService) ?? localeVoices[0];
      setVoiceName(pick?.name ?? "");
    }
  }, [localeVoices, voiceName]);

  const selectedVoice = voices.find((v) => v.name === voiceName);

  function applyTone(key: ToneKey) {
    setTone(key);
    const p = TONE_PRESETS[key];
    setRate(p.rate);
    setPitch(p.pitch);
    setVolume(p.volume);
  }

  function buildUtterance(chunk: string, voice?: SpeechSynthesisVoice, toneKey?: ToneKey) {
    const u = new SpeechSynthesisUtterance(chunk);
    const v = voice ?? activeVoiceRef.current ?? selectedVoice;
    const t = toneKey ? TONE_PRESETS[toneKey] : { rate, pitch, volume };
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = locale || "en-US";
    }
    u.rate = t.rate;
    u.pitch = t.pitch;
    u.volume = t.volume;
    return u;
  }

  function preview(voice: SpeechSynthesisVoice, toneKey: ToneKey) {
    speechSynthesis.cancel();
    setSpeakError("");
    setPreviewingTone(toneKey);
    const u = buildUtterance(previewForLang(voice.lang), voice, toneKey);
    speakUtterance(
      u,
      () => setPreviewingTone(null),
      () => setPreviewingTone(null),
    );
  }

  function speakNext() {
    const next = queueRef.current.shift();
    if (!next) {
      setSpeaking(false);
      setPaused(false);
      activeVoiceRef.current = undefined;
      return;
    }
    const u = buildUtterance(next);
    speakUtterance(
      u,
      () => speakNext(),
      (err) => {
        setSpeakError(`Speech failed (${err}). Try another voice or refresh the page.`);
        setSpeaking(false);
        setPaused(false);
        queueRef.current = [];
      },
    );
  }

  function resolveVoiceForText(): SpeechSynthesisVoice | undefined {
    const langBase = detectedLang ?? familyBase;
    if (!langBase) return selectedVoice;
    return pickBestVoice(voices, langBase, voiceName) ?? selectedVoice;
  }

  function speak() {
    if (!text.trim()) return;
    setSpeakError("");

    const voice = resolveVoiceForText();
    if (!voice) {
      const label = detectedLang ? langFamilyLabel(detectedLang) : "selected language";
      setSpeakError(
        `No ${label} voice found on your device. Install a speech pack (see instructions below) and refresh this page.`,
      );
      return;
    }

    if (voice.name !== voiceName) setVoiceName(voice.name);
    if (voice.lang !== locale) setLocale(voice.lang);
    const base = voice.lang.split("-")[0];
    if (base && base !== familyBase) setFamilyBase(base);

    activeVoiceRef.current = voice;
    speechSynthesis.cancel();
    setPaused(false);
    const chunks = paragraphMode
      ? text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : [text.trim()];
    queueRef.current = chunks;
    setSpeaking(true);
    speakNext();
  }

  function stop() {
    speechSynthesis.cancel();
    queueRef.current = [];
    activeVoiceRef.current = undefined;
    setSpeaking(false);
    setPaused(false);
    setPreviewingTone(null);
  }

  const voiceMismatch =
    detectedLang &&
    selectedVoice &&
    !voicesForLanguage(voices, detectedLang).some((v) => v.name === selectedVoice.name);
  const noVoiceForDetected = Boolean(detectedLang && detectedVoices.length === 0);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estSeconds = Math.round(estimateDuration(text, rate));
  const srt = textToSrt(text, rate);
  const vtt = textToVtt(text, rate);
  const toneKeys = Object.keys(TONE_PRESETS) as ToneKey[];

  if (!supported) {
    return (
      <Notice tone="error">
        Text-to-speech is not supported in this browser. Try Chrome or Edge on desktop for the most voices.
      </Notice>
    );
  }

  return (
    <div className="space-y-4">
      <Notice tone="info">
        <strong>{actorCount} voice actors</strong> across <strong>{familyCount} languages</strong> ({localeCount}{" "}
        regional variants) — all from your device, no AI, unlimited &amp; private. Click any actor, try every tone,
        then speak your full script.
      </Notice>

      {voices.length === 0 && (
        <Notice tone="info">Loading voices… Chrome/Edge on Windows or Mac typically offer 100+ actors.</Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Languages" value={familyCount} />
        <Stat label="Voice actors" value={actorCount} />
        <Stat label="Regional variants" value={localeCount} />
        <Stat label="Tone presets" value={toneKeys.length} />
      </div>

      <Field label="Your script">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          className="font-sans text-sm leading-relaxed"
          placeholder="Paste your video script, narration, or caption…"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Words" value={wordCount} />
        <Stat label="Characters" value={text.length} />
        <Stat label="Est. duration" value={`~${estSeconds}s`} />
      </div>

      {detectedLang && (
        <Notice tone={noVoiceForDetected ? "error" : "info"}>
          Detected script: <strong>{langFamilyLabel(detectedLang)}</strong>
          {noVoiceForDetected ? (
            <>
              {" "}
              — no {langFamilyLabel(detectedLang)} voice on this device.{" "}
              {detectedLang === "ur" ? (
                <>
                  Windows: Settings → Time &amp; language → Speech → Add voices → Urdu (Pakistan). Linux: install{" "}
                  <code className="text-xs">speech-dispatcher</code> and Urdu voices, or use Chrome on Windows/Mac.
                </>
              ) : (
                <>Install the language in your OS speech settings, then refresh.</>
              )}
            </>
          ) : (
            <> — {detectedVoices.length} voice{detectedVoices.length !== 1 ? "s" : ""} available. Speak will auto-pick the best match.</>
          )}
        </Notice>
      )}

      {voiceMismatch && !noVoiceForDetected && (
        <Notice tone="info">
          Your selected voice does not match {langFamilyLabel(detectedLang!)} text. Click &quot;Speak&quot; — we will
          switch to a matching voice automatically.
        </Notice>
      )}

      {speakError && <Notice tone="error">{speakError}</Notice>}

      {/* ── Language picker ── */}
      <Section title={`1. Choose language (${familyCount} languages on your device)`}>
        <Field label="Search languages">
          <Input
            value={langSearch}
            onChange={(e) => setLangSearch(e.target.value)}
            placeholder="Search Urdu, English, Hindi, Arabic, Spanish…"
          />
        </Field>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {filteredFamilies.map((f) => {
            const count = f.locales.reduce((n, l) => n + l.voices.length, 0);
            return (
              <button
                key={f.base}
                type="button"
                onClick={() => {
                  setFamilyBase(f.base);
                  setLocale(f.locales[0]?.code ?? "");
                }}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition",
                  familyBase === f.base
                    ? "border-brand bg-brand/10 text-brand font-medium"
                    : "border-border bg-surface-2 hover:border-brand/40",
                )}
              >
                {f.label}
                <span className="ml-1.5 text-xs text-muted">({count})</span>
              </button>
            );
          })}
        </div>
        {currentFamily && currentFamily.locales.length > 1 && (
          <Field label="Regional variant">
            <Select value={locale} onChange={(e) => setLocale(e.target.value)}>
              {currentFamily.locales.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} — {l.voices.length} actor{l.voices.length !== 1 ? "s" : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {currentFamily && currentFamily.locales.length === 1 && (
          <p className="text-xs text-muted">
            Variant: {currentFamily.locales[0]?.label} · {localeVoices.length} actor
            {localeVoices.length !== 1 ? "s" : ""}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setText(sampleForLang(locale))}>
            Load sample script ({langFamilyLabel(familyBase)})
          </Button>
        </div>
      </Section>

      {/* ── Actor grid with tone previews ── */}
      <Section title={`2. Pick a voice actor — ${localeVoices.length} available · try every tone`}>
        <div className="flex flex-wrap gap-2">
          {(["all", "female", "male", "neutral"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenderFilter(g)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs capitalize transition",
                genderFilter === g ? "border-brand bg-brand text-brand-fg" : "border-border bg-surface-2",
              )}
            >
              {g === "all" ? "All actors" : g}
            </button>
          ))}
        </div>

        {localeVoices.length === 0 ? (
          <Notice tone="info">
            No voices match this filter. Try &quot;All actors&quot; or install more voices in your OS speech settings.
          </Notice>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {localeVoices.map((v, idx) => {
              const gender = inferGender(v);
              const selected = voiceName === v.name;
              return (
                <div
                  key={v.name}
                  className={cn(
                    "rounded-xl border p-3 transition",
                    selected ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-border bg-surface-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        Actor {idx + 1}: {cleanActorName(v.name)}
                      </p>
                      <p className="text-xs text-muted capitalize">
                        {gender}
                        {v.localService ? " · offline" : " · online"}
                        {v.default ? " · default ★" : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={selected ? "primary" : "secondary"}
                      onClick={() => setVoiceName(v.name)}
                    >
                      {selected ? "Selected" : "Select"}
                    </Button>
                  </div>

                  <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted">Try each tone</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {toneKeys.map((tk) => {
                      const p = TONE_PRESETS[tk];
                      const busy = previewingTone === tk && selected;
                      return (
                        <button
                          key={tk}
                          type="button"
                          title={p.desc}
                          disabled={previewingTone !== null && !busy}
                          onClick={() => {
                            setVoiceName(v.name);
                            applyTone(tk);
                            preview(v, tk);
                          }}
                          className={cn(
                            "rounded-md border px-1.5 py-0.5 text-[10px] transition hover:border-brand",
                            tone === tk && selected ? "border-brand bg-brand/10" : "border-border bg-surface-1",
                            busy && "animate-pulse",
                          )}
                        >
                          {p.emoji} {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Active tone for full script ── */}
      <Section title="3. Tone for full script playback">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {toneKeys.map((key) => {
            const p = TONE_PRESETS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyTone(key)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition",
                  tone === key ? "border-brand bg-brand/10 text-brand" : "border-border bg-surface-2 hover:border-brand/40",
                )}
              >
                <span className="font-medium">
                  {p.emoji} {p.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">{p.desc}</span>
              </button>
            );
          })}
        </div>
        {selectedVoice && (
          <p className="text-xs text-muted">
            Selected: <strong>{cleanActorName(selectedVoice.name)}</strong> · {langLocaleLabel(selectedVoice.lang)} ·
            tone <strong>{TONE_PRESETS[tone].label}</strong>
          </p>
        )}
      </Section>

      <Section title="Fine-tune speed, pitch & volume">
        <Field label={`Speed: ${rate.toFixed(2)}×`}>
          <input type="range" min={0.5} max={2} step={0.05} value={rate} onChange={(e) => setRate(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Pitch: ${pitch.toFixed(2)}`}>
          <input type="range" min={0.5} max={2} step={0.05} value={pitch} onChange={(e) => setPitch(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <Field label={`Volume: ${Math.round(volume * 100)}%`}>
          <input type="range" min={0.1} max={1} step={0.05} value={volume} onChange={(e) => setVolume(+e.target.value)} className="w-full accent-[var(--brand)]" />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={paragraphMode} onChange={(e) => setParagraphMode(e.target.checked)} className="accent-[var(--brand)]" />
          Speak paragraph-by-paragraph (blank lines)
        </label>
      </Section>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={speak} disabled={!text.trim() || speaking || noVoiceForDetected}>
          ▶ Speak full script
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (speechSynthesis.speaking && !speechSynthesis.paused) {
              speechSynthesis.pause();
              setPaused(true);
            }
          }}
          disabled={!speaking || paused}
        >
          ⏸ Pause
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            if (speechSynthesis.paused) {
              speechSynthesis.resume();
              setPaused(false);
            }
          }}
          disabled={!paused}
        >
          ⏵ Resume
        </Button>
        <Button type="button" variant="secondary" onClick={stop} disabled={!speaking && !paused && !previewingTone}>
          ■ Stop
        </Button>
        {selectedVoice && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => preview(selectedVoice, tone)}
            disabled={!!previewingTone}
          >
            Preview selected actor + tone
          </Button>
        )}
      </div>

      <Section title="Export for video editors">
        <p className="text-xs text-muted">SRT/VTT timings estimated from word count — adjust in CapCut, Premiere, or DaVinci.</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => download(srt, "captions.srt", "text/plain")}>
            Download SRT
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => download(vtt, "captions.vtt", "text/vtt")}>
            Download VTT
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => download(text, "script.txt", "text/plain")}>
            Download script
          </Button>
          <CopyButton value={srt} label="Copy SRT" size="sm" />
        </div>
      </Section>

      <Notice tone="info">
        <strong>Need more languages?</strong> Windows: Settings → Time &amp; language → Speech → Manage voices. Mac:
        System Settings → Accessibility → Spoken Content → System voice → Manage voices. Then refresh this page.
      </Notice>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface-1 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
