import { OpenAI } from "@/lib/ai/client";
import { isStudioTtsConfigured, synthesizeStudioVoice } from "@/lib/ai/studio-tts";
import {
  checkAiAllowance,
  incrementUsage,
  usageSetCookieHeader,
} from "@/lib/billing/usage";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function POST(request: Request) {
  if (!isStudioTtsConfigured()) {
    return json(
      { error: "Voiceover is not configured. Set OPENAI_API_KEY or GROQ_API_KEYS on the server." },
      503,
    );
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

  let body: { text?: string; voiceType?: string; speed?: number; tone?: string; instructions?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  try {
    const { audio, provider, contentType, filename } = await synthesizeStudioVoice({
      text: body.text ?? "",
      voiceType: body.voiceType,
      speed: body.speed,
      tone: body.tone,
      instructions: body.instructions,
    });
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
        "X-TTS-Provider": provider,
        "Set-Cookie": usageSetCookieHeader(incrementUsage(request)),
      },
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError && err.status === 401) {
      return json({ error: "The voice API key was rejected. Check OPENAI_API_KEY or GROQ_API_KEYS." }, 502);
    }
    const message = err instanceof Error ? err.message : "Voiceover failed.";
    const status = message.includes("4,000") || message.includes("Enter some text") ? 400 : 502;
    return json({ error: message }, status);
  }
}
