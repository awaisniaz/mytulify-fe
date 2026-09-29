import {
  AiNotConfiguredError,
  OpenAI,
  aiAuthErrorMessage,
  aiConfigErrorMessage,
  createAudioTranscription,
  createChatCompletion,
  isAiConfigured,
} from "@/lib/ai/client";
import {
  checkAiAllowance,
  incrementUsage,
  usageSetCookieHeader,
} from "@/lib/billing/usage";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

const SYSTEM = `You are an expert YouTube/TikTok remake producer and scriptwriter.
Given optional speech transcript + sampled video frames, produce a complete remake package.

Return ONLY valid JSON (no markdown fences) with this shape:
{
  "title": "suggested remake title",
  "detectedLanguage": "en",
  "summary": "2-4 sentence summary of the original",
  "transcriptClean": "cleaned full transcript (or reconstructed narration if silent)",
  "fullVoiceoverScript": "ready-to-read voiceover for the remake, natural spoken style",
  "hooks": ["3 alternate opening hooks"],
  "cta": "end CTA line",
  "hashtags": ["5-12 hashtags without # symbol preferred as plain words"],
  "voiceStyle": {
    "tone": one of "natural|tutorial|energetic|deep|friendly|dramatic|news|calm|excited|soft|professional|storyteller",
    "pace": "slow|medium|fast",
    "genderHint": "male|female|neutral",
    "energy": "low|medium|high",
    "notes": "how the original VO/style felt — for matching"
  },
  "scenes": [
    {
      "index": 1,
      "startSec": 0,
      "endSec": 8,
      "timecode": "0:00–0:08",
      "visual": "what to show on screen",
      "narration": "exact VO line for this beat",
      "onScreenText": "optional caption/title or empty string",
      "searchKeywords": ["2-4 English stock-search phrases"],
      "brollTips": "how to shoot or pick B-roll",
      "mood": "mood/lighting word"
    }
  ]
}

Rules:
- Prefer the transcript for spoken words; use frames for visuals, pacing, and scene breaks.
- If transcript is missing/weak, reconstruct a plausible narration matching the visuals (label honestly in summary).
- 5–14 scenes depending on length; keep narration speakable.
- searchKeywords must be concrete stock-footage phrases (e.g. "drone shot coastal city sunset"), not abstract topics.
- Match voiceStyle.tone to the original energy when possible.
- Write fullVoiceoverScript as continuous VO the user can paste into TTS.`;

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return json({ error: aiConfigErrorMessage() }, 503);
  }

  const allowance = await checkAiAllowance(request);
  if (!allowance.ok) {
    return json(
      {
        error: `Daily AI limit reached (${FREE_AI_DAILY_LIMIT}/day on Free). Upgrade to Pro for unlimited runs.`,
        code: "LIMIT_REACHED",
        ...allowance.snapshot,
        upgradeUrl: "/pricing",
      },
      429,
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid form data." }, 400);
  }

  const metaRaw = String(form.get("meta") || "{}");
  let meta: {
    duration?: number;
    language?: string;
    outputLang?: string;
    platform?: string;
    pastedTranscript?: string;
    titleHint?: string;
  } = {};
  try {
    meta = JSON.parse(metaRaw) as typeof meta;
  } catch {
    /* ignore */
  }

  const frames: string[] = [];
  for (const [key, value] of form.entries()) {
    if (key.startsWith("frame") && typeof value === "string" && value.startsWith("data:image")) {
      frames.push(value);
    }
  }
  // Cap frames for payload/token safety
  const limitedFrames = frames.slice(0, 10);

  const audioEntry = form.get("audio");
  let transcript = (meta.pastedTranscript || "").trim();
  let transcriptSource: "whisper" | "paste" | "none" = transcript ? "paste" : "none";

  if (audioEntry instanceof File && audioEntry.size > 0) {
    // ~25MB soft cap
    if (audioEntry.size > 28 * 1024 * 1024) {
      return json({ error: "Audio is too large. Trim the video or paste a transcript instead." }, 400);
    }
    try {
      const named =
        audioEntry.name && audioEntry.name.includes(".")
          ? audioEntry
          : new File([audioEntry], "audio.webm", { type: audioEntry.type || "audio/webm" });
      const lang = meta.language && meta.language !== "auto" ? meta.language : undefined;
      const text = await createAudioTranscription(named, lang);
      if (text) {
        transcript = text;
        transcriptSource = "whisper";
      }
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        return json({ error: aiConfigErrorMessage() }, 503);
      }
      if (err instanceof OpenAI.AuthenticationError) {
        return json({ error: aiAuthErrorMessage() }, 502);
      }
      // Continue with frames-only if whisper fails and we have frames or paste
      if (!transcript && limitedFrames.length === 0) {
        return json(
          {
            error:
              "Could not transcribe audio. Try pasting a transcript, or use a shorter clip with clearer speech.",
          },
          502,
        );
      }
    }
  }

  if (!transcript && limitedFrames.length === 0) {
    return json({ error: "Provide a video (frames/audio) or paste a transcript." }, 400);
  }

  const platform = meta.platform || "YouTube";
  const outputLang = meta.outputLang || "same as source";
  const duration = meta.duration ?? 0;

  const userText = `Platform target: ${platform}
Video duration (seconds): ${duration || "unknown"}
Source language hint: ${meta.language || "auto"}
Write scripts / narration in: ${outputLang}
Title hint: ${meta.titleHint || "(none)"}
Transcript source: ${transcriptSource}
Transcript:
${transcript || "(none — reconstruct from visuals)"}

Analyze the attached frames in time order and return the JSON remake package.`;

  const userContent: OpenAI.Chat.Completions.ChatCompletionUserMessageParam["content"] =
    limitedFrames.length > 0
      ? [
          { type: "text", text: userText },
          ...limitedFrames.map((url) => ({
            type: "image_url" as const,
            image_url: { url, detail: "low" as const },
          })),
        ]
      : userText;

  try {
    const completion = await createChatCompletion(
      {
        max_tokens: 6000,
        temperature: 0.35,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
      },
      { vision: limitedFrames.length > 0 },
    );

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseJsonObject(raw);
    if (!parsed) {
      return json({ error: "AI returned an unreadable response. Please try again.", raw }, 502);
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (!allowance.isPro) {
      headers["Set-Cookie"] = usageSetCookieHeader(incrementUsage(request));
    }

    return new Response(
      JSON.stringify({
        ...parsed,
        transcriptSource,
        rawTranscript: transcript,
      }),
      { status: 200, headers },
    );
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return json({ error: aiConfigErrorMessage() }, 503);
    }
    if (err instanceof OpenAI.AuthenticationError) {
      return json({ error: aiAuthErrorMessage() }, 502);
    }
    if (err instanceof OpenAI.RateLimitError) {
      return json({ error: "Rate limit reached. Please try again in a moment." }, 429);
    }
    if (err instanceof OpenAI.APIError) {
      return json({ error: `AI service error (${err.status ?? "unknown"}). Please try again.` }, 502);
    }
    return json({ error: "Something went wrong generating the script package." }, 500);
  }
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence?.[1]) {
      try {
        return JSON.parse(fence[1].trim()) as Record<string, unknown>;
      } catch {
        /* fall through */
      }
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    return null;
  }
}
