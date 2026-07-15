import OpenAI from "openai";

export type AiProvider = "groq" | "openai";

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "AI is not configured. Set GROQ_API_KEYS (AI_PROVIDER=groq) or OPENAI_API_KEY (AI_PROVIDER=openai).",
    );
    this.name = "AiNotConfiguredError";
  }
}

/** Groq OpenAI-compatible base URL — used by this Next.js app (frontend) for now. */
const GROQ_BASE_URL = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const DEFAULT_OPENAI_MODEL = "gpt-4o";

/** Round-robin cursor across the key pool (process lifetime). */
let keyCursor = 0;

export function getAiProvider(): AiProvider {
  const raw = (process.env.AI_PROVIDER ?? "groq").trim().toLowerCase();
  return raw === "openai" ? "openai" : "groq";
}

function parseApiKeys(): string[] {
  const provider = getAiProvider();
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY?.trim();
    return key ? [key] : [];
  }
  const raw = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "";
  return raw
    .split(/[,\s,]+/)
    .map((k) => k.trim())
    .filter(Boolean);
}

export function isAiConfigured(): boolean {
  return parseApiKeys().length > 0;
}

export function getChatModel(vision = false): string {
  const provider = getAiProvider();
  if (provider === "openai") {
    return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  }
  if (vision) {
    return process.env.GROQ_VISION_MODEL?.trim() || DEFAULT_GROQ_VISION_MODEL;
  }
  return process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;
}

/** Safe status for UI/ops — never includes API keys. */
export function getAiStatus() {
  const provider = getAiProvider();
  const keys = parseApiKeys();
  return {
    configured: keys.length > 0,
    provider,
    keyCount: keys.length,
    textModel: getChatModel(false),
    visionModel: getChatModel(true),
    /** Where AI runs today (migrate to tools-hub-backend later). */
    runtime: "nextjs-frontend" as const,
  };
}

function makeClient(apiKey: string): OpenAI {
  const provider = getAiProvider();
  if (provider === "groq") {
    return new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  }
  return new OpenAI({ apiKey });
}

function isRateLimited(err: unknown): boolean {
  if (err instanceof OpenAI.RateLimitError) return true;
  if (err instanceof OpenAI.APIError && err.status === 429) return true;
  return false;
}

export function aiConfigErrorMessage(): string {
  const provider = getAiProvider();
  return provider === "openai"
    ? "This AI tool isn't configured yet. Set OPENAI_API_KEY in the frontend .env."
    : "This AI tool isn't configured yet. Set GROQ_API_KEYS in the frontend .env (AI_PROVIDER=groq).";
}

export function aiAuthErrorMessage(): string {
  const provider = getAiProvider();
  return provider === "openai"
    ? "The configured OPENAI_API_KEY is invalid."
    : "A configured GROQ_API_KEY is invalid or revoked.";
}

type ChatCreateParams = Parameters<OpenAI["chat"]["completions"]["create"]>[0];

/**
 * Chat completion via Groq (default) or OpenAI.
 * Runs inside this Next.js app — not tools-hub-backend (for now).
 */
export async function createChatCompletion(
  params: Omit<ChatCreateParams, "model" | "stream"> & { model?: string },
  options?: { vision?: boolean },
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const keys = parseApiKeys();
  if (!keys.length) throw new AiNotConfiguredError();

  const model = params.model ?? getChatModel(Boolean(options?.vision));
  const start = keyCursor % keys.length;
  let lastError: unknown;

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const index = (start + attempt) % keys.length;
    const apiKey = keys[index]!;
    const client = makeClient(apiKey);

    try {
      const completion = await client.chat.completions.create({
        ...params,
        model,
        stream: false,
      });
      keyCursor = index + 1;
      return completion;
    } catch (err) {
      lastError = err;
      if (isRateLimited(err) && attempt < keys.length - 1) continue;
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI request failed.");
}

export { OpenAI };
