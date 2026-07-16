import {
  AiNotConfiguredError,
  OpenAI,
  aiConfigErrorMessage,
  createChatCompletion,
  isAiConfigured,
} from "@/lib/ai/client";
import { parseJsonLoose } from "@/lib/ai/parse-json";
import {
  checkAiAllowance,
  incrementUsage,
  usageSetCookieHeader,
} from "@/lib/billing/usage";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { parseFormSchema } from "@/lib/forms/schema";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SYSTEM = `You are an expert form designer for Mytulify. Users worldwide need printable and fillable forms for any country, language, and purpose (legal, business, education, medical, government, housing, employment).

Return ONLY valid JSON (no markdown) matching this shape:
{
  "title": "Form title in the requested language",
  "description": "Brief purpose of the form",
  "language": "language code",
  "fields": [
    {
      "id": "unique_snake_case_id",
      "type": "text|textarea|email|number|date|phone|cnic|select|checkbox|radio|signature",
      "label": "Field label in the requested language",
      "required": true|false,
      "placeholder": "optional hint",
      "options": ["only for select/radio"]
    }
  ]
}

Rules:
- Include the important fields a user needs (aim for 8–22 fields — complete but not huge).
- Use ONLY these type values: text, textarea, email, number, date, phone, cnic, select, checkbox, radio, signature.
- Use culturally appropriate labels (e.g. CNIC for Pakistan, Aadhaar for India, SSN/EIN for US, Emirates ID for UAE).
- For legal/business forms include declarations, dates, and a signature field when appropriate.
- Labels and placeholders must be in the language the user requested.
- ids must be unique lowercase snake_case English (not translated).
- Output one complete JSON object only.`;

type Body = {
  mode?: "generate" | "scan";
  requirements?: string;
  language?: string;
  context?: string;
  image?: string;
};

function friendlyAiError(err: unknown): string {
  if (err instanceof AiNotConfiguredError) return aiConfigErrorMessage();
  if (err instanceof OpenAI.APIError) {
    if (err.status === 429) {
      return "AI rate limit hit. Wait a minute and try again.";
    }
    if (err.status === 401 || err.status === 403) {
      return "AI API key is invalid. Check GROQ_API_KEYS in the server .env.";
    }
    return err.message || "AI provider error.";
  }
  if (err instanceof SyntaxError || (err instanceof Error && /JSON|parse/i.test(err.message))) {
    return "Could not parse form structure. Try a shorter description and generate again.";
  }
  return err instanceof Error ? err.message : "Generation failed.";
}

export async function POST(request: Request) {
  if (!isAiConfigured()) {
    return Response.json({ error: aiConfigErrorMessage() }, { status: 503 });
  }

  const allowance = await checkAiAllowance(request);
  if (!allowance.ok) {
    return Response.json(
      {
        error: `Daily AI limit reached (${FREE_AI_DAILY_LIMIT}/day on Free). Upgrade to Pro for unlimited runs.`,
        code: "LIMIT_REACHED",
        upgradeUrl: "/pricing",
      },
      { status: 429 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mode = body.mode ?? "generate";
  const language = body.language?.trim() || "en";

  try {
    let raw: string | undefined;

    if (mode === "scan") {
      if (!body.image?.startsWith("data:")) {
        return Response.json({ error: "Please upload a form image." }, { status: 400 });
      }
      const completion = await createChatCompletion(
        {
          temperature: 0.2,
          max_tokens: 8192,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                SYSTEM +
                "\n\nExtract every field from the uploaded form image. Preserve labels as shown. Infer field types from layout.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Recreate this form digitally. Target language for any missing labels: ${language}. Return the JSON schema.`,
                },
                { type: "image_url", image_url: { url: body.image } },
              ],
            },
          ],
        },
        { vision: true },
      );
      raw = completion.choices[0]?.message?.content?.trim();
    } else {
      const requirements = body.requirements?.trim();
      if (!requirements) {
        return Response.json({ error: "Please describe what form you need." }, { status: 400 });
      }
      const context = body.context?.trim();
      const completion = await createChatCompletion({
        temperature: 0.3,
        max_tokens: 8192,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Create a complete form.

Language for all labels: ${language}
User requirements: ${requirements}
${context ? `Additional context: ${context}` : ""}

Generate all necessary fields as valid JSON.`,
          },
        ],
      });
      raw = completion.choices[0]?.message?.content?.trim();
    }

    if (!raw) return Response.json({ error: "Empty AI response." }, { status: 502 });

    let parsed;
    try {
      parsed = parseFormSchema(parseJsonLoose(raw));
    } catch (firstErr) {
      // One retry with a stricter, shorter prompt when JSON is broken/truncated
      if (mode !== "generate") throw firstErr;
      const requirements = body.requirements?.trim() || "contact form";
      const retry = await createChatCompletion({
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return ONLY a JSON object: {"title":"...","description":"...","language":"' +
              language +
              '","fields":[{"id":"name","type":"text","label":"...","required":true}]}. Use 6-14 fields. Types: text,textarea,email,number,date,phone,cnic,select,checkbox,radio,signature.',
          },
          {
            role: "user",
            content: `Language: ${language}. Form: ${requirements}`,
          },
        ],
      });
      const retryRaw = retry.choices[0]?.message?.content?.trim();
      if (!retryRaw) throw firstErr;
      parsed = parseFormSchema(parseJsonLoose(retryRaw));
    }

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (!allowance.isPro) {
      headers["Set-Cookie"] = usageSetCookieHeader(incrementUsage(request));
    }

    return new Response(JSON.stringify({ schema: parsed }), { status: 200, headers });
  } catch (err) {
    if (err instanceof AiNotConfiguredError) {
      return Response.json({ error: aiConfigErrorMessage() }, { status: 503 });
    }
    return Response.json({ error: friendlyAiError(err) }, { status: 502 });
  }
}
