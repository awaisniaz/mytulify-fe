import OpenAI from "openai";
import {
  checkAiAllowance,
  incrementUsage,
  usageSetCookieHeader,
} from "@/lib/billing/usage";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";
import { parseFormSchema } from "@/lib/forms/schema";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

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
- Include ALL fields a user would realistically need for the described purpose and country.
- Use culturally appropriate labels (e.g. CNIC for Pakistan, Aadhaar for India, SSN/EIN for US, Emirates ID for UAE, NIN for Nigeria, PESEL for Poland).
- For legal/business forms include standard sections (declarations, dates, signatures).
- Add a "signature" field when the form would normally be signed.
- Labels and placeholders must be in the language the user requested.
- ids must be unique lowercase snake_case English (not translated).`;

type Body = {
  mode?: "generate" | "scan";
  requirements?: string;
  language?: string;
  context?: string;
  image?: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI form builder is not configured. Set OPENAI_API_KEY on the server." },
      { status: 503 },
    );
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
  const client = new OpenAI({ apiKey });

  try {
    let completion: OpenAI.Chat.Completions.ChatCompletion;

    if (mode === "scan") {
      if (!body.image?.startsWith("data:")) {
        return Response.json({ error: "Please upload a form image." }, { status: 400 });
      }
      completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM + "\n\nExtract every field from the uploaded form image. Preserve labels as shown. Infer field types from layout." },
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
      });
    } else {
      const requirements = body.requirements?.trim();
      if (!requirements) {
        return Response.json({ error: "Please describe what form you need." }, { status: 400 });
      }
      const context = body.context?.trim();
      completion = await client.chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Create a complete form.

Language for all labels: ${language}
User requirements: ${requirements}
${context ? `Additional context: ${context}` : ""}

Generate all necessary fields.`,
          },
        ],
      });
    }

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return Response.json({ error: "Empty AI response." }, { status: 502 });

    const parsed = parseFormSchema(JSON.parse(raw));

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (!allowance.isPro) {
      headers["Set-Cookie"] = usageSetCookieHeader(incrementUsage(request));
    }

    return new Response(JSON.stringify({ schema: parsed }), { status: 200, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed.";
    return Response.json({ error: msg.includes("JSON") ? "Could not parse form structure. Try again." : msg }, { status: 502 });
  }
}
