"use client";

import * as React from "react";
import { Button, Input, Select, Textarea } from "@/components/ui/primitives";
import { Field, FileDrop, Notice, CopyButton } from "@/components/tools/shared";
import { AiUsageBanner, notifyUsageUpdated } from "@/components/billing/AiUsageBanner";
import { proHeaders } from "@/lib/billing/client";
import { Icon } from "@/components/ui/Icon";
import { cn, download } from "@/lib/utils";
import { FREE_STOCK_SOURCES, stockLinksForKeywords } from "@/lib/stock-footage";
import {
  TONE_PRESETS,
  type ToneKey,
  pickBestVoice,
  speakUtterance,
  voicesForLanguage,
  detectTextLanguage,
  inferGender,
  cleanActorName,
  type VoiceGender,
} from "@/components/tools/impl/tts-data";
import { StudioVoice } from "@/components/tools/impl/StudioVoice";

/* ---------------------------------- types --------------------------------- */

type Scene = {
  index: number;
  startSec: number;
  endSec: number;
  timecode: string;
  visual: string;
  narration: string;
  onScreenText: string;
  searchKeywords: string[];
  brollTips: string;
  mood: string;
};

type VoiceStyle = {
  tone: string;
  pace: string;
  genderHint: string;
  energy: string;
  notes: string;
};

type StudioResult = {
  title: string;
  detectedLanguage: string;
  summary: string;
  transcriptClean: string;
  fullVoiceoverScript: string;
  hooks: string[];
  cta: string;
  hashtags: string[];
  voiceStyle: VoiceStyle;
  scenes: Scene[];
  transcriptSource?: string;
  rawTranscript?: string;
};

type Tab = "script" | "scenes" | "voice" | "export";

const LANGS = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "tr", label: "Turkish" },
  { value: "id", label: "Indonesian" },
];

const PLATFORMS = ["YouTube", "YouTube Shorts", "TikTok", "Instagram Reels", "Facebook Reels", "LinkedIn"];

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function isToneKey(v: string): v is ToneKey {
  return v in TONE_PRESETS;
}

function seekVideo(video: HTMLVideoElement, time: number) {
  return new Promise<void>((resolve) => {
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    try {
      video.currentTime = Math.min(Math.max(0, time), Math.max(0, (video.duration || 1) - 0.05));
    } catch {
      resolve();
    }
  });
}

async function extractFrames(video: HTMLVideoElement, count: number, maxEdge = 720): Promise<string[]> {
  const duration = video.duration || 0;
  if (!duration || !Number.isFinite(duration)) return [];
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  const frames: string[] = [];
  const n = Math.max(3, Math.min(count, 10));
  for (let i = 0; i < n; i++) {
    const t = duration * ((i + 0.5) / n);
    await seekVideo(video, t);
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const scale = Math.min(1, maxEdge / Math.max(vw, vh));
    canvas.width = Math.max(2, Math.round(vw * scale));
    canvas.height = Math.max(2, Math.round(vh * scale));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg", 0.72));
  }
  return frames;
}

/** Record audio from the video element (first maxSeconds). */
async function extractAudioBlob(video: HTMLVideoElement, maxSeconds: number): Promise<Blob | null> {
  const anyVideo = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  const capture = anyVideo.captureStream?.bind(video) || anyVideo.mozCaptureStream?.bind(video);
  if (!capture) return null;

  const prevMuted = video.muted;
  const prevVol = video.volume;
  video.muted = false;
  video.volume = 1;

  await seekVideo(video, 0);
  let stream: MediaStream;
  try {
    stream = capture();
  } catch {
    video.muted = prevMuted;
    video.volume = prevVol;
    return null;
  }

  const audioTracks = stream.getAudioTracks();
  if (!audioTracks.length) {
    video.muted = prevMuted;
    video.volume = prevVol;
    return null;
  }

  const audioOnly = new MediaStream(audioTracks);
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";
  if (!mime) {
    video.muted = prevMuted;
    video.volume = prevVol;
    return null;
  }

  const chunks: BlobPart[] = [];
  const rec = new MediaRecorder(audioOnly, { mimeType: mime });
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };

  const stopped = new Promise<Blob>((resolve) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: "audio/webm" }));
  });

  rec.start(200);
  try {
    await video.play();
  } catch {
    rec.stop();
    video.muted = prevMuted;
    video.volume = prevVol;
    return null;
  }

  const limitMs = Math.min((video.duration || maxSeconds) * 1000, maxSeconds * 1000);
  await new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => {
      video.pause();
      resolve();
    }, limitMs + 80);
    video.onended = () => {
      window.clearTimeout(timer);
      resolve();
    };
  });

  if (rec.state !== "inactive") rec.stop();
  video.pause();
  video.muted = prevMuted;
  video.volume = prevVol;
  audioTracks.forEach((t) => t.stop());

  const blob = await stopped;
  return blob.size > 1000 ? blob : null;
}

function packageToMarkdown(r: StudioResult): string {
  const lines: string[] = [
    `# ${r.title}`,
    "",
    `## Summary`,
    r.summary,
    "",
    `## Voice style`,
    `- Tone: ${r.voiceStyle?.tone}`,
    `- Pace: ${r.voiceStyle?.pace}`,
    `- Energy: ${r.voiceStyle?.energy}`,
    `- Notes: ${r.voiceStyle?.notes}`,
    "",
    `## Full voiceover`,
    r.fullVoiceoverScript,
    "",
    `## Hooks`,
    ...(r.hooks || []).map((h) => `- ${h}`),
    "",
    `## CTA`,
    r.cta || "",
    "",
    `## Scenes`,
  ];
  for (const s of r.scenes || []) {
    lines.push(
      "",
      `### Scene ${s.index} (${s.timecode || `${fmt(s.startSec)}–${fmt(s.endSec)}`})`,
      `**Visual:** ${s.visual}`,
      `**VO:** ${s.narration}`,
      s.onScreenText ? `**On-screen:** ${s.onScreenText}` : "",
      `**Stock search:** ${(s.searchKeywords || []).join(", ")}`,
      `**B-roll tip:** ${s.brollTips}`,
      `**Mood:** ${s.mood}`,
    );
  }
  lines.push("", "## Hashtags", (r.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "));
  lines.push("", "## Clean transcript", r.transcriptClean || r.rawTranscript || "");
  return lines.filter((l) => l !== undefined).join("\n");
}

function normalizeResult(data: Record<string, unknown>): StudioResult {
  const vs = (data.voiceStyle || {}) as Record<string, string>;
  const scenesRaw = Array.isArray(data.scenes) ? data.scenes : [];
  return {
    title: String(data.title || "Remake script"),
    detectedLanguage: String(data.detectedLanguage || "en"),
    summary: String(data.summary || ""),
    transcriptClean: String(data.transcriptClean || data.rawTranscript || ""),
    fullVoiceoverScript: String(data.fullVoiceoverScript || ""),
    hooks: Array.isArray(data.hooks) ? data.hooks.map(String) : [],
    cta: String(data.cta || ""),
    hashtags: Array.isArray(data.hashtags) ? data.hashtags.map(String) : [],
    voiceStyle: {
      tone: String(vs.tone || "natural"),
      pace: String(vs.pace || "medium"),
      genderHint: String(vs.genderHint || "neutral"),
      energy: String(vs.energy || "medium"),
      notes: String(vs.notes || ""),
    },
    scenes: scenesRaw.map((s, i) => {
      const o = s as Record<string, unknown>;
      return {
        index: Number(o.index) || i + 1,
        startSec: Number(o.startSec) || 0,
        endSec: Number(o.endSec) || 0,
        timecode: String(o.timecode || ""),
        visual: String(o.visual || ""),
        narration: String(o.narration || ""),
        onScreenText: String(o.onScreenText || ""),
        searchKeywords: Array.isArray(o.searchKeywords) ? o.searchKeywords.map(String) : [],
        brollTips: String(o.brollTips || ""),
        mood: String(o.mood || ""),
      };
    }),
    transcriptSource: data.transcriptSource ? String(data.transcriptSource) : undefined,
    rawTranscript: data.rawTranscript ? String(data.rawTranscript) : undefined,
  };
}

/* -------------------------------- component ------------------------------- */

export function VideoScriptStudio() {
  const [fileName, setFileName] = React.useState("");
  const [videoUrl, setVideoUrl] = React.useState("");
  const [duration, setDuration] = React.useState(0);
  const [language, setLanguage] = React.useState("auto");
  const [outputLang, setOutputLang] = React.useState("same as source");
  const [platform, setPlatform] = React.useState("YouTube");
  const [titleHint, setTitleHint] = React.useState("");
  const [pastedTranscript, setPastedTranscript] = React.useState("");
  const [frameCount, setFrameCount] = React.useState(8);
  const [audioMinutes, setAudioMinutes] = React.useState(8);
  const [skipAudio, setSkipAudio] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [phase, setPhase] = React.useState("");
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<StudioResult | null>(null);
  const [tab, setTab] = React.useState<Tab>("script");
  const [previewFrames, setPreviewFrames] = React.useState<string[]>([]);

  /* VO */
  const [voText, setVoText] = React.useState("");
  const [tone, setTone] = React.useState<ToneKey>("natural");
  const [rate, setRate] = React.useState(1);
  const [pitch, setPitch] = React.useState(1);
  const [volume, setVolume] = React.useState(1);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = React.useState("");
  const [genderFilter, setGenderFilter] = React.useState<"all" | VoiceGender>("all");
  const [speaking, setSpeaking] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices([...speechSynthesis.getVoices()]);
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  React.useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      speechSynthesis.cancel();
    };
  }, [videoUrl]);

  const detected = React.useMemo(() => detectTextLanguage(voText || result?.fullVoiceoverScript || ""), [voText, result]);
  const langVoices = React.useMemo(() => {
    let list = voicesForLanguage(voices, detected || "en");
    if (genderFilter !== "all") list = list.filter((v) => inferGender(v) === genderFilter);
    return list;
  }, [voices, detected, genderFilter]);

  React.useEffect(() => {
    if (!langVoices.length) return;
    if (!langVoices.some((v) => v.name === voiceName)) {
      const best = pickBestVoice(voices, detected || "en", voiceName);
      setVoiceName(best?.name || langVoices[0]!.name);
    }
  }, [langVoices, voiceName, voices, detected]);

  async function onVideoFiles(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError("");
    setResult(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
    setFileName(f.name);
    setPreviewFrames([]);
  }

  function onVideoMeta() {
    const v = videoRef.current;
    if (!v) return;
    setDuration(Number.isFinite(v.duration) ? v.duration : 0);
  }

  async function analyze() {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      setError("Upload a video first.");
      return;
    }
    setError("");
    setLoading(true);
    setPhase("Sampling frames…");
    try {
      const frames = await extractFrames(video, frameCount);
      setPreviewFrames(frames);
      if (!frames.length && !pastedTranscript.trim() && skipAudio) {
        throw new Error("Could not sample frames. Try another video or paste a transcript.");
      }

      let audioBlob: Blob | null = null;
      if (!skipAudio) {
        setPhase("Extracting audio for transcription…");
        audioBlob = await extractAudioBlob(video, audioMinutes * 60);
        if (!audioBlob && !pastedTranscript.trim() && !frames.length) {
          throw new Error("Could not extract audio. Paste a transcript or enable frame-only mode.");
        }
      }

      setPhase("AI writing script + scene breakdown…");
      const form = new FormData();
      form.set(
        "meta",
        JSON.stringify({
          duration,
          language,
          outputLang,
          platform,
          pastedTranscript,
          titleHint,
        }),
      );
      frames.forEach((dataUrl, i) => form.set(`frame${i}`, dataUrl));
      if (audioBlob) {
        form.set("audio", new File([audioBlob], "track.webm", { type: audioBlob.type || "audio/webm" }));
      }

      const res = await fetch("/api/ai/video-script-studio", {
        method: "POST",
        headers: { ...proHeaders() },
        body: form,
      });
      const data = (await res.json()) as Record<string, unknown> & { error?: string };
      if (!res.ok || data.error) {
        throw new Error(data.error || "Analysis failed");
      }

      const normalized = normalizeResult(data);
      setResult(normalized);
      setVoText(normalized.fullVoiceoverScript);
      const t = normalized.voiceStyle?.tone;
      if (t && isToneKey(t)) {
        setTone(t);
        const preset = TONE_PRESETS[t];
        setRate(preset.rate);
        setPitch(preset.pitch);
        setVolume(preset.volume);
      }
      if (normalized.voiceStyle?.genderHint === "male" || normalized.voiceStyle?.genderHint === "female") {
        setGenderFilter(normalized.voiceStyle.genderHint);
      }
      setTab("script");
      notifyUsageUpdated();
      setPhase("");
    } catch (e) {
      setError((e as Error).message || "Something went wrong");
      setPhase("");
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    if (!text.trim()) return;
    const voice = voices.find((v) => v.name === voiceName) || pickBestVoice(voices, detected || "en");
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    if (voice?.lang) u.lang = voice.lang;
    setSpeaking(true);
    speakUtterance(
      u,
      () => setSpeaking(false),
      () => setSpeaking(false),
    );
  }

  function stopSpeak() {
    speechSynthesis.cancel();
    setSpeaking(false);
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "script", label: "Script", icon: "FileText" },
    { id: "scenes", label: "Scenes + stock", icon: "Film" },
    { id: "voice", label: "Voiceover", icon: "Mic" },
    { id: "export", label: "Export", icon: "Download" },
  ];

  return (
    <div className="space-y-4">
      <AiUsageBanner />
      <Notice tone="info">
        Upload any short or long video → extract speech script, scene-by-scene remake plan, free B-roll search links
        (Pexels, Pixabay, Mixkit…), and a matching voiceover you can play in-browser. Counts as 1 AI run.
      </Notice>

      {!videoUrl ? (
        <FileDrop
          accept="video/*,.mp4,.webm,.mov,.mkv"
          onFiles={(files) => void onVideoFiles(files)}
          label="Drop a video (short or long) or click to upload"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-black">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="max-h-[320px] w-full"
                onLoadedMetadata={onVideoMeta}
              />
            </div>
            <p className="text-xs text-muted">
              {fileName} · {fmt(duration)}
              {duration > audioMinutes * 60 && !skipAudio
                ? ` · audio will use first ${audioMinutes} min for transcription`
                : ""}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                URL.revokeObjectURL(videoUrl);
                setVideoUrl("");
                setFileName("");
                setResult(null);
                setPreviewFrames([]);
              }}
            >
              Replace video
            </Button>
            {previewFrames.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {previewFrames.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover ring-1 ring-border" />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Speech language">
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Script output language">
                <Select value={outputLang} onChange={(e) => setOutputLang(e.target.value)}>
                  <option value="same as source">Same as source</option>
                  <option value="English">English</option>
                  <option value="Urdu">Urdu</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Arabic">Arabic</option>
                  <option value="Spanish">Spanish</option>
                </Select>
              </Field>
              <Field label="Target platform">
                <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Title / niche hint (optional)">
                <Input value={titleHint} onChange={(e) => setTitleHint(e.target.value)} placeholder="e.g. fitness tips remake" />
              </Field>
              <Field label={`Scene frames ${frameCount}`}>
                <input
                  type="range"
                  min={4}
                  max={10}
                  value={frameCount}
                  onChange={(e) => setFrameCount(+e.target.value)}
                  className="w-full accent-[var(--brand)]"
                />
              </Field>
              <Field label={`Audio length ${audioMinutes} min`}>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={audioMinutes}
                  disabled={skipAudio}
                  onChange={(e) => setAudioMinutes(+e.target.value)}
                  className="w-full accent-[var(--brand)] disabled:opacity-40"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={skipAudio} onChange={(e) => setSkipAudio(e.target.checked)} />
              Frames-only (no speech transcription — useful for silent / music videos)
            </label>
            <Field label="Paste transcript (optional fallback)">
              <Textarea
                rows={3}
                value={pastedTranscript}
                onChange={(e) => setPastedTranscript(e.target.value)}
                placeholder="If audio extraction fails, paste captions/transcript here…"
              />
            </Field>
            <Button type="button" disabled={loading} onClick={() => void analyze()}>
              <Icon name={loading ? "Loader2" : "Sparkles"} className={cn("h-4 w-4", loading && "animate-spin")} />
              {loading ? phase || "Working…" : "Extract script + scenes + VO plan"}
            </Button>
          </div>
        </div>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {result && (
        <>
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
          </div>

          {tab === "script" && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">{result.title}</h3>
                  <p className="mt-1 text-sm text-muted">{result.summary}</p>
                  <p className="mt-1 text-xs text-muted">
                    Lang: {result.detectedLanguage}
                    {result.transcriptSource ? ` · transcript via ${result.transcriptSource}` : ""}
                  </p>
                </div>
                <CopyButton value={result.fullVoiceoverScript} />
              </div>
              <Field label="Full voiceover script">
                <Textarea
                  rows={10}
                  value={result.fullVoiceoverScript}
                  onChange={(e) => {
                    const v = e.target.value;
                    setResult({ ...result, fullVoiceoverScript: v });
                    setVoText(v);
                  }}
                />
              </Field>
              {result.hooks?.length > 0 && (
                <div>
                  <p className="mb-1 text-sm font-semibold">Alternate hooks</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {result.hooks.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.cta && (
                <p className="text-sm">
                  <span className="font-semibold">CTA:</span> {result.cta}
                </p>
              )}
              <Field label="Clean transcript">
                <Textarea rows={6} value={result.transcriptClean} readOnly className="font-sans" />
              </Field>
            </div>
          )}

          {tab === "scenes" && (
            <div className="space-y-4">
              <Notice tone="info">
                Free stock sources (no signup required for most downloads — always check each site&apos;s license):{" "}
                {FREE_STOCK_SOURCES.map((s) => s.name).join(", ")}.
              </Notice>
              {(result.scenes || []).map((scene) => {
                const links = stockLinksForKeywords(scene.searchKeywords?.length ? scene.searchKeywords : [scene.visual]);
                return (
                  <article key={scene.index} className="rounded-2xl border border-border bg-surface p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                        Scene {scene.index}
                      </span>
                      <span className="font-mono text-xs text-muted">
                        {scene.timecode || `${fmt(scene.startSec)}–${fmt(scene.endSec)}`}
                      </span>
                      {scene.mood && <span className="text-xs text-muted">· {scene.mood}</span>}
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">Visual:</span> {scene.visual}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-semibold">VO:</span> {scene.narration}
                    </p>
                    {scene.onScreenText ? (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">On-screen:</span> {scene.onScreenText}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-muted">{scene.brollTips}</p>
                    <p className="mt-2 text-xs font-semibold text-muted">
                      Search: {(scene.searchKeywords || []).join(" · ") || "general b-roll"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {links.slice(0, 8).map(({ source, url }) => (
                        <a
                          key={source.id}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-muted transition-colors hover:border-brand/40 hover:text-brand"
                          title={`${source.note} · ${source.license}`}
                        >
                          {source.name}
                          <Icon name="ExternalLink" className="h-3 w-3" />
                        </a>
                      ))}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setVoText(scene.narration);
                          setTab("voice");
                        }}
                      >
                        VO this scene
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {tab === "voice" && (
            <div className="space-y-4 rounded-2xl border border-border bg-surface p-4">
              <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
                <p className="font-semibold">Matched from original video</p>
                <p className="mt-1 text-muted">
                  Tone <strong>{result.voiceStyle.tone}</strong> · Pace {result.voiceStyle.pace} · Energy{" "}
                  {result.voiceStyle.energy} · {result.voiceStyle.genderHint}
                </p>
                {result.voiceStyle.notes && <p className="mt-1 text-muted">{result.voiceStyle.notes}</p>}
              </div>
              <Field label="Voiceover text">
                <Textarea rows={8} value={voText} onChange={(e) => setVoText(e.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(TONE_PRESETS) as ToneKey[]).map((k) => (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant={tone === k ? "primary" : "secondary"}
                    onClick={() => {
                      setTone(k);
                      setRate(TONE_PRESETS[k].rate);
                      setPitch(TONE_PRESETS[k].pitch);
                      setVolume(TONE_PRESETS[k].volume);
                    }}
                  >
                    {TONE_PRESETS[k].label}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Actor">
                  <Select value={voiceName} onChange={(e) => setVoiceName(e.target.value)}>
                    {langVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {cleanActorName(v.name)} ({v.lang})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Gender filter">
                  <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as typeof genderFilter)}>
                    <option value="all">All</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </Select>
                </Field>
                <Field label={`Rate ${rate.toFixed(2)}`}>
                  <input
                    type="range"
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    value={rate}
                    onChange={(e) => setRate(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
                <Field label={`Pitch ${pitch.toFixed(2)}`}>
                  <input
                    type="range"
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    value={pitch}
                    onChange={(e) => setPitch(+e.target.value)}
                    className="w-full accent-[var(--brand)]"
                  />
                </Field>
              </div>
              <StudioVoice
                text={voText}
                tone={tone}
                speed={rate}
                defaultVoice={
                  result.voiceStyle.genderHint === "male"
                    ? "male"
                    : result.voiceStyle.genderHint === "female"
                      ? "female"
                      : tone === "deep"
                        ? "deep"
                        : "natural"
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => speak(voText)} disabled={speaking || !voText.trim()}>
                  <Icon name="Play" className="h-4 w-4" />
                  Play voiceover
                </Button>
                <Button type="button" variant="secondary" onClick={stopSpeak}>
                  Stop
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setVoText(result.fullVoiceoverScript);
                  }}
                >
                  Load full script
                </Button>
                <CopyButton value={voText} />
              </div>
              <p className="text-xs text-muted">
                Studio voiceover returns an audio file. Play voiceover below still uses a device voice for a quick preview.
              </p>
            </div>
          )}

          {tab === "export" && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    download(packageToMarkdown(result), `${result.title.slice(0, 40).replace(/\W+/g, "-")}.md`, "text/markdown")
                  }
                >
                  <Icon name="Download" className="h-4 w-4" />
                  Download Markdown pack
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    download(
                      result.fullVoiceoverScript,
                      "voiceover-script.txt",
                      "text/plain;charset=utf-8",
                    )
                  }
                >
                  Download VO .txt
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    download(
                      JSON.stringify(result, null, 2),
                      "video-script-studio.json",
                      "application/json",
                    )
                  }
                >
                  Download JSON
                </Button>
                <CopyButton value={(result.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ")} label="Copy hashtags" />
              </div>
              <p className="text-sm text-muted">
                Next: grab free B-roll from the Scenes tab → record VO → assemble in the{" "}
                <a href="/content-creator-tools/online-video-editor" className="font-semibold text-brand hover:underline">
                  Online Video Editor
                </a>
                .
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
