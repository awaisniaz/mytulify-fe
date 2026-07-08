import OpenAI from "openai";

export type NameIdea = {
  base: string;
  style: string;
  reason: string;
};

const DEFAULT_TLDS = ["com", "io", "app", "dev", "co", "net", "org", "pk"];

export function parseTlds(raw?: string): string[] {
  if (!raw?.trim()) return DEFAULT_TLDS;
  const list = raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^\./, "").toLowerCase())
    .filter((t) => /^[a-z]{2,24}$/.test(t));
  return list.length ? [...new Set(list)] : DEFAULT_TLDS;
}

/** Fallback when OpenAI is unavailable — keyword mashups from description. */
export function heuristicNames(description: string, keywords: string): NameIdea[] {
  const text = `${description} ${keywords}`.toLowerCase();
  const words = [...new Set(text.match(/[a-z]{3,12}/g) ?? [])].slice(0, 12);
  const ideas: NameIdea[] = [];

  for (let i = 0; i < words.length && ideas.length < 8; i++) {
    for (let j = i + 1; j < words.length && ideas.length < 12; j++) {
      ideas.push({
        base: `${words[i]}${words[j]}`.slice(0, 15),
        style: "descriptive",
        reason: `Combines "${words[i]}" and "${words[j]}" from your description`,
      });
      if (words[i]!.length <= 6) {
        ideas.push({
          base: `${words[i]}hub`.slice(0, 15),
          style: "brandable",
          reason: `Short brand around "${words[i]}"`,
        });
      }
    }
  }

  for (const w of words.slice(0, 6)) {
    ideas.push({ base: `get${w}`.slice(0, 15), style: "action", reason: `Action-oriented "${w}" name` });
    ideas.push({ base: `${w}ly`.slice(0, 15), style: "brandable", reason: `Brandable twist on "${w}"` });
  }

  const seen = new Set<string>();
  return ideas.filter((n) => {
    const b = n.base.replace(/[^a-z0-9]/g, "");
    if (b.length < 3 || seen.has(b)) return false;
    seen.add(b);
    n.base = b;
    return true;
  }).slice(0, 14);
}

export async function generateNameIdeas(input: {
  description: string;
  keywords?: string;
  style?: string;
  apiKey: string;
}): Promise<NameIdea[]> {
  const client = new OpenAI({ apiKey: input.apiKey });
  const styleHint =
    input.style === "short"
      ? "Prefer very short names (4–8 letters)."
      : input.style === "descriptive"
        ? "Prefer clear, descriptive names that explain the product."
        : "Mix brandable coined names and descriptive names.";

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You suggest domain name BASES (no TLD) for startups and projects.
Return JSON: {"names":[{"base":"example","style":"brandable|descriptive|short","reason":"why it fits"}]}
Rules: lowercase letters and numbers only, 3–15 chars, no hyphens, must relate to the project, 14 unique names.`,
      },
      {
        role: "user",
        content: `Project description:\n${input.description}\n\nExtra keywords: ${input.keywords || "none"}\n\n${styleHint}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
  let parsed: { names?: NameIdea[] };
  try {
    parsed = JSON.parse(raw) as { names?: NameIdea[] };
  } catch {
    return heuristicNames(input.description, input.keywords ?? "");
  }

  const seen = new Set<string>();
  return (parsed.names ?? [])
    .map((n) => ({
      base: String(n.base ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""),
      style: String(n.style ?? "brandable"),
      reason: String(n.reason ?? ""),
    }))
    .filter((n) => n.base.length >= 3 && n.base.length <= 15 && !seen.has(n.base) && seen.add(n.base));
}

export function expandToDomains(bases: NameIdea[], tlds: string[]): { domain: string; base: string; style: string; reason: string }[] {
  const rows: { domain: string; base: string; style: string; reason: string }[] = [];
  for (const idea of bases) {
    for (const tld of tlds) {
      rows.push({
        domain: `${idea.base}.${tld}`,
        base: idea.base,
        style: idea.style,
        reason: idea.reason,
      });
    }
  }
  return rows;
}
