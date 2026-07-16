/** Pull the first JSON object/array from model text (handles fences & chatter). */
export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("Empty AI response.");

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  if (candidate.startsWith("{") || candidate.startsWith("[")) {
    return trimToBalancedJson(candidate);
  }

  const startObj = candidate.indexOf("{");
  const startArr = candidate.indexOf("[");
  const start =
    startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);
  if (start === -1) throw new Error("No JSON found in AI response.");
  return trimToBalancedJson(candidate.slice(start));
}

function trimToBalancedJson(text: string): string {
  const open = text[0];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(0, i + 1);
    }
  }
  return text;
}

export function parseJsonLoose<T = unknown>(raw: string): T {
  const text = extractJsonText(raw);
  try {
    return JSON.parse(text) as T;
  } catch {
    // Trailing commas / smart quotes from some models
    const repaired = text
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    return JSON.parse(repaired) as T;
  }
}
