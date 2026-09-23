import { translate as gTranslate } from "@vitalets/google-translate-api";
import { TRANSLATE_LIMITS, TRANSLATE_TARGET_LANGUAGES } from "@/lib/translate/languages";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Body = {
  texts?: unknown;
  from?: unknown;
  to?: unknown;
};

const allowedTargets = new Set(TRANSLATE_TARGET_LANGUAGES.map((l) => l.code));

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateOne(text: string, to: string, from?: string): Promise<string> {
  const opts: { to: string; from?: string } = { to };
  if (from && from !== "auto") opts.from = from;
  const result = await gTranslate(text, opts);
  return result.text;
}

async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]!, i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return out;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const fromRaw = typeof body.from === "string" ? body.from.trim() : "auto";
  const from = fromRaw || "auto";

  if (!to || !allowedTargets.has(to as never)) {
    return json({ error: "Please choose a valid target language." }, 400);
  }
  if (from !== "auto" && !allowedTargets.has(from as never) && from !== to) {
    // allow any known target as source; auto is fine
    if (![...allowedTargets].includes(from as never)) {
      return json({ error: "Please choose a valid source language." }, 400);
    }
  }

  if (!Array.isArray(body.texts)) {
    return json({ error: "texts must be an array of strings." }, 400);
  }

  const texts = body.texts.map((t) => (typeof t === "string" ? t : String(t ?? "")));
  if (texts.length === 0) {
    return json({ error: "No text to translate." }, 400);
  }
  if (texts.length > TRANSLATE_LIMITS.maxTextsPerRequest) {
    return json(
      {
        error: `Too many strings (${texts.length}). Max ${TRANSLATE_LIMITS.maxTextsPerRequest} per request.`,
      },
      400,
    );
  }

  let totalChars = 0;
  for (const t of texts) {
    if (t.length > TRANSLATE_LIMITS.maxCharsPerText) {
      return json(
        {
          error: `One string is too long (${t.length} chars). Max ${TRANSLATE_LIMITS.maxCharsPerText} per string.`,
        },
        400,
      );
    }
    totalChars += t.length;
  }
  if (totalChars > TRANSLATE_LIMITS.maxTotalChars) {
    return json(
      {
        error: `Total text is too large (${totalChars} chars). Max ${TRANSLATE_LIMITS.maxTotalChars}.`,
      },
      400,
    );
  }

  // Deduplicate to reduce API calls
  const unique: string[] = [];
  const indexMap: number[] = [];
  const seen = new Map<string, number>();
  for (const t of texts) {
    const key = t;
    const existing = seen.get(key);
    if (existing != null) {
      indexMap.push(existing);
    } else {
      const idx = unique.length;
      seen.set(key, idx);
      unique.push(t);
      indexMap.push(idx);
    }
  }

  try {
    const uniqueOut = await mapPool(unique, 3, async (text, i) => {
      if (!text.trim()) return text;
      // light spacing to reduce rate-limit hits
      if (i > 0 && i % 8 === 0) await sleep(400);
      try {
        return await translateOne(text, to, from === "auto" ? undefined : from);
      } catch {
        // one retry after short pause
        await sleep(700);
        return await translateOne(text, to, from === "auto" ? undefined : from);
      }
    });

    const translations = indexMap.map((i) => uniqueOut[i] ?? "");
    return json({ translations, uniqueCount: unique.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed.";
    return json(
      {
        error: `Translation service unavailable. ${message} Try again in a moment with a smaller batch.`,
      },
      502,
    );
  }
}
