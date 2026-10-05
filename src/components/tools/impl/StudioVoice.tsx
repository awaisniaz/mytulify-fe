"use client";

import * as React from "react";
import { Button, Select } from "@/components/ui/primitives";
import { Field, Notice } from "@/components/tools/shared";
import { AiUsageBanner, notifyUsageUpdated } from "@/components/billing/AiUsageBanner";
import { proHeaders } from "@/lib/billing/client";
import { download } from "@/lib/utils";
import type { ToneKey } from "./tts-data";

const VOICES = [
  { id: "natural", label: "Natural" },
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
  { id: "deep", label: "Deep" },
  { id: "child", label: "Youthful" },
] as const;

type VoiceId = (typeof VOICES)[number]["id"];

/**
 * Neural voiceover using the same presets Creo uses: a voice plus a tone
 * direction, returned as an audio file you can play and download.
 */
export function StudioVoice({
  text,
  tone = "natural",
  speed = 1,
  defaultVoice = "natural",
}: {
  text: string;
  tone?: ToneKey | string;
  speed?: number;
  defaultVoice?: VoiceId;
}) {
  const [voiceType, setVoiceType] = React.useState<VoiceId>(defaultVoice);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState("");
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [provider, setProvider] = React.useState("");
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  async function generate() {
    const script = text.trim();
    if (!script) {
      setError("Enter a script first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...proHeaders() },
        body: JSON.stringify({ text: script, voiceType, speed, tone }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Voiceover failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setProvider(res.headers.get("X-TTS-Provider") || "");
      notifyUsageUpdated();
      window.setTimeout(() => audioRef.current?.play().catch(() => undefined), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voiceover failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-brand/30 bg-brand/5 p-4">
      <AiUsageBanner />
      <div>
        <p className="text-sm font-semibold">Studio voiceover</p>
        <p className="text-xs text-muted">
          Same voice presets Creo uses for narration — natural, male, female, deep, and youthful — with the selected
          tone spoken into an audio file. Counts as one AI run.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Voice">
          <Select value={voiceType} onChange={(e) => setVoiceType(e.target.value as VoiceId)}>
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tone used for delivery">
          <p className="pt-2 text-sm capitalize text-foreground">{tone}</p>
        </Field>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void generate()} disabled={busy || !text.trim()}>
          {busy ? "Generating voiceover…" : "Generate voiceover"}
        </Button>
        {audioUrl && (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              audioBlob &&
              download(
                audioBlob,
                audioBlob.type.includes("wav") ? "voiceover.wav" : "voiceover.mp3",
                audioBlob.type || "audio/mpeg",
              )
            }
          >
            Download
          </Button>
        )}
      </div>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} controls className="w-full" />
      )}
      {provider && (
        <p className="text-[11px] text-muted">
          Engine: {provider === "openai-tts" ? "OpenAI neural voice" : "Orpheus studio voice"}
        </p>
      )}
    </div>
  );
}
