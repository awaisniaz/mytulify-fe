import OpenAI from "openai";

/** Same presets Creo maps onto a neural voice. */
export const STUDIO_VOICE_TYPES = ["natural", "male", "female", "deep", "child"] as const;
export type StudioVoiceType = (typeof STUDIO_VOICE_TYPES)[number];

const OPENAI_VOICES: Record<StudioVoiceType, string> = {
  natural: "alloy",
  male: "onyx",
  female: "nova",
  deep: "echo",
  child: "shimmer",
};

/** Groq Orpheus English voices. PlayAI was removed. */
const ORPHEUS_EN: Record<StudioVoiceType, string> = {
  natural: "diana",
  male: "austin",
  female: "hannah",
  deep: "troy",
  child: "autumn",
};

const ORPHEUS_AR: Record<StudioVoiceType, string> = {
  natural: "noura",
  male: "fahad",
  female: "lulwa",
  deep: "sultan",
  child: "aisha",
};

/** Short vocal directions Orpheus understands. They count toward the 200-character cap. */
const TONE_DIRECTION: Record<string, string> = {
  natural: "",
  tutorial: "[clear] ",
  energetic: "[cheerful] ",
  deep: "[authoritatively] ",
  friendly: "[warm] ",
  dramatic: "[dramatic] ",
  news: "[professionally] ",
  calm: "[calm] ",
  excited: "[excited] ",
  soft: "[whisper] ",
  professional: "[professionally] ",
  storyteller: "[warm] ",
};

/** Delivery direction, same idea as Creo's voiceInstructions on gpt-4o-mini-tts. */
const TONE_INSTRUCTIONS: Record<string, string> = {
  natural: "Speak as a clear, engaging narrator with a natural conversational pace.",
  tutorial: "Speak slowly and clearly, like a patient teacher explaining each step.",
  energetic: "Speak with bright, upbeat energy suited to a short social video.",
  deep: "Speak in a deep, measured documentary voice with calm authority.",
  friendly: "Speak warmly and casually, like a friendly vlogger talking to the camera.",
  dramatic: "Speak with cinematic drama, controlled intensity, and storytelling weight.",
  news: "Speak like a professional news anchor: crisp, confident, and even.",
  calm: "Speak softly and slowly, calm and reassuring, like a wellness guide.",
  excited: "Speak with high energy and excitement, still clear and not shouting.",
  soft: "Speak gently and quietly, close and intimate.",
  professional: "Speak as a polished corporate narrator, confident and precise.",
  storyteller: "Speak as a warm audiobook narrator, measured pace, expressive but natural.",
};

const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";

export function studioVoiceType(value: unknown): StudioVoiceType {
  return STUDIO_VOICE_TYPES.includes(value as StudioVoiceType) ? (value as StudioVoiceType) : "natural";
}

function openaiKey(): string {
  return process.env.OPENAI_API_KEY?.trim() || process.env.OPENAI_TTS_API_KEY?.trim() || "";
}

function groqKey(): string {
  const raw = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  return raw.split(/[,\s]+/).map((k) => k.trim()).find(Boolean) ?? "";
}

export function isStudioTtsConfigured(): boolean {
  return Boolean(openaiKey() || groqKey());
}

/**
 * Neural voiceover. OpenAI gpt-4o-mini-tts (Creo's model) when a key exists;
 * otherwise Groq PlayAI with the same voice presets.
 */
export async function synthesizeStudioVoice(input: {
  text: string;
  voiceType?: string;
  speed?: number;
  tone?: string;
  instructions?: string;
}): Promise<{ audio: Buffer; contentType: string; filename: string; provider: "openai-tts" | "groq-tts" }> {
  const text = input.text.trim();
  if (!text) throw new Error("Enter some text to speak.");
  if (text.length > 4000) throw new Error("Keep the script under 4,000 characters for one voiceover.");

  const voiceType = studioVoiceType(input.voiceType);
  const speed = Math.min(2, Math.max(0.5, Number.isFinite(input.speed) ? Number(input.speed) : 1));
  const instructions =
    (input.instructions?.trim() || TONE_INSTRUCTIONS[input.tone ?? ""] || TONE_INSTRUCTIONS.natural).slice(0, 300);

  const openai = openaiKey();
  if (openai) {
    const client = new OpenAI({ apiKey: openai });
    const model = process.env.OPENAI_TTS_MODEL?.trim() || "gpt-4o-mini-tts";
    const res = await client.audio.speech.create({
      model,
      voice: OPENAI_VOICES[voiceType],
      input: text,
      response_format: "mp3",
      speed,
      instructions,
    } as OpenAI.Audio.SpeechCreateParams);
    const audio = Buffer.from(await res.arrayBuffer());
    if (!audio.length) throw new Error("The voice model returned no audio.");
    return { audio, contentType: "audio/mpeg", filename: "voiceover.mp3", provider: "openai-tts" };
  }

  const groq = groqKey();
  if (!groq) {
    throw new Error("Voiceover is not configured. Set OPENAI_API_KEY or GROQ_API_KEYS on the server.");
  }

  const arabic = mostlyArabic(text);
  const voice = arabic ? ORPHEUS_AR[voiceType] : ORPHEUS_EN[voiceType];
  const model = arabic ? "canopylabs/orpheus-arabic-saudi" : "canopylabs/orpheus-v1-english";
  const direction = arabic ? "" : TONE_DIRECTION[input.tone ?? ""] ?? "";
  const chunks = chunkForOrpheus(text, 200 - direction.length);
  const client = new OpenAI({ apiKey: groq, baseURL: GROQ_BASE_URL });
  const parts: Buffer[] = [];
  for (const chunk of chunks) {
    let audio: Buffer;
    try {
      const res = await client.audio.speech.create({
        model,
        voice,
        input: `${direction}${chunk}`,
        response_format: "wav",
      });
      audio = Buffer.from(await res.arrayBuffer());
    } catch (err) {
      const detail = err instanceof OpenAI.APIError ? err.message : err instanceof Error ? err.message : "Unknown error";
      if (/terms acceptance/i.test(detail)) {
        throw new Error("Arabic studio voice is not enabled on this server yet. Preview Arabic with the device voice, or use an English script.");
      }
      const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
      throw new Error(`Voice request failed. ${detail} ${cause}`.trim());
    }
    if (!audio.length) throw new Error("The voice model returned no audio.");
    parts.push(audio);
  }
  return {
    audio: concatWav(parts),
    contentType: "audio/wav",
    filename: "voiceover.wav",
    provider: "groq-tts",
  };
}

function mostlyArabic(text: string): boolean {
  const arabic = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  const letters = text.match(/\p{L}/gu)?.length ?? 0;
  return letters > 0 && arabic / letters > 0.4;
}

/** Orpheus accepts at most 200 characters per request, including the direction tag. */
function chunkForOrpheus(text: string, budget: number): string[] {
  const limit = Math.max(40, budget);
  const sentences = text.split(/(?<=[.!?۔؟\n])\s+/).map((s) => s.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  const push = (part: string) => {
    const bit = part.trim();
    if (bit) chunks.push(bit);
  };
  for (const sentence of sentences.length ? sentences : [text]) {
    if (sentence.length <= limit) {
      if (`${current} ${sentence}`.trim().length <= limit) current = `${current} ${sentence}`.trim();
      else {
        push(current);
        current = sentence;
      }
      continue;
    }
    push(current);
    current = "";
    for (let i = 0; i < sentence.length; i += limit) push(sentence.slice(i, i + limit));
  }
  push(current);
  if (chunks.length > 24) throw new Error("That script is too long for one voiceover. Shorten it and generate again.");
  return chunks;
}

function concatWav(parts: Buffer[]): Buffer {
  if (parts.length === 1) return parts[0]!;
  const pcm: Buffer[] = [];
  let rate = 24000;
  let channels = 1;
  let bits = 16;
  for (const [index, wav] of parts.entries()) {
    const parsed = readWav(wav);
    if (index === 0) {
      rate = parsed.sampleRate;
      channels = parsed.channels;
      bits = parsed.bits;
    }
    pcm.push(parsed.pcm);
  }
  const data = Buffer.concat(pcm);
  const header = Buffer.alloc(44);
  const byteRate = (rate * channels * bits) / 8;
  const blockAlign = (channels * bits) / 8;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

function readWav(wav: Buffer): { pcm: Buffer; sampleRate: number; channels: number; bits: number } {
  if (wav.length < 44 || wav.toString("ascii", 0, 4) !== "RIFF") {
    return { pcm: wav, sampleRate: 24000, channels: 1, bits: 16 };
  }
  const channels = wav.readUInt16LE(22);
  const sampleRate = wav.readUInt32LE(24);
  const bits = wav.readUInt16LE(34);
  const dataAt = wav.indexOf("data");
  if (dataAt < 0) return { pcm: wav.subarray(44), sampleRate, channels, bits };
  const size = wav.readUInt32LE(dataAt + 4);
  const start = dataAt + 8;
  return { pcm: wav.subarray(start, start + size), sampleRate, channels, bits };
}
