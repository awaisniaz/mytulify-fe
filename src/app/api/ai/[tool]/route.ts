import OpenAI from "openai";
import { getAiTool, type AiInput } from "@/lib/ai/tools";
import {
  checkAiAllowance,
  incrementUsage,
  usageSetCookieHeader,
} from "@/lib/billing/usage";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";

/** Generation can take a while on longer tools; give the function headroom. */
export const maxDuration = 60;
/** Always run on-demand — never cache AI responses. */
export const dynamic = "force-dynamic";

/** Overridable without a code change; gpt-4o is a safe, widely-available default. */
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/ai/[tool]">,
) {
  const { tool: slug } = await ctx.params;
  const tool = getAiTool(slug);
  if (!tool) return json({ error: "Unknown tool." }, 404);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(
      {
        error:
          "This AI tool isn't configured yet. Set the OPENAI_API_KEY environment variable on the server to enable it.",
      },
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

  let input: AiInput;
  try {
    input = (await request.json()) as AiInput;
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  // Validate required fields.
  for (const field of tool.fields) {
    if ("required" in field && field.required && !input[field.name]?.trim()) {
      return json({ error: `Please fill in "${field.label}".` }, 400);
    }
  }

  const client = new OpenAI({ apiKey });

  // Vision: if the tool has image fields with data-URL values, attach them.
  const images = tool.fields
    .filter((f) => f.type === "image")
    .map((f) => input[f.name])
    .filter((v): v is string => !!v && v.startsWith("data:"));

  const userContent: OpenAI.Chat.Completions.ChatCompletionUserMessageParam["content"] =
    images.length > 0
      ? [
          { type: "text", text: tool.buildUser(input) },
          ...images.map((url) => ({ type: "image_url" as const, image_url: { url } })),
        ]
      : tool.buildUser(input);

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: tool.maxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: tool.system(input) },
        { role: "user", content: userContent },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";

    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (!allowance.isPro) {
      headers["Set-Cookie"] = usageSetCookieHeader(incrementUsage(request));
    }

    return new Response(JSON.stringify({ text }), { status: 200, headers });
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) {
      return json({ error: "The configured OPENAI_API_KEY is invalid." }, 502);
    }
    if (err instanceof OpenAI.RateLimitError) {
      return json({ error: "Rate limit reached. Please try again in a moment." }, 429);
    }
    if (err instanceof OpenAI.APIError) {
      return json({ error: `AI service error (${err.status ?? "unknown"}). Please try again.` }, 502);
    }
    return json({ error: "Something went wrong generating the result." }, 500);
  }
}
