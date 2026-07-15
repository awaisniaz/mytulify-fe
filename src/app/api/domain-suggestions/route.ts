import {
  OpenAI,
  aiAuthErrorMessage,
  isAiConfigured,
} from "@/lib/ai/client";
import {
  checkDomainsBatch,
  registrarSearchUrl,
  type DomainStatus,
} from "@/lib/domain/availability";
import {
  expandToDomains,
  generateNameIdeas,
  heuristicNames,
  parseTlds,
} from "@/lib/domain/suggest";
import {
  checkAiAllowance,
  incrementUsage,
  usageSetCookieHeader,
} from "@/lib/billing/usage";
import { FREE_AI_DAILY_LIMIT } from "@/lib/billing/plans";

export const maxDuration = 90;
export const dynamic = "force-dynamic";

type ResultRow = {
  domain: string;
  base: string;
  style: string;
  reason: string;
  status: DomainStatus;
  registerUrl: string;
};

export async function POST(request: Request) {
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

  let body: { description?: string; keywords?: string; style?: string; tlds?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const description = body.description?.trim() ?? "";
  if (description.length < 10) {
    return Response.json({ error: "Please describe your project in at least 10 characters." }, { status: 400 });
  }

  const tlds = parseTlds(body.tlds);
  const keywords = body.keywords?.trim() ?? "";
  const style = body.style ?? "mixed";

  let bases = heuristicNames(description, keywords);
  const aiConfigured = isAiConfigured();
  let aiUsed = false;

  if (aiConfigured) {
    try {
      const aiBases = await generateNameIdeas({ description, keywords, style });
      if (aiBases.length) {
        aiUsed = true;
        const seen = new Set(bases.map((b) => b.base));
        bases = [...bases, ...aiBases.filter((b) => !seen.has(b.base) && seen.add(b.base))];
      }
    } catch (err) {
      if (err instanceof OpenAI.AuthenticationError) {
        return Response.json({ error: aiAuthErrorMessage() }, { status: 502 });
      }
      /* fall back to heuristic names only */
    }
  }

  bases = bases.slice(0, 18);
  const candidates = expandToDomains(bases, tlds);
  const uniqueDomains = [...new Set(candidates.map((c) => c.domain))];
  const statusMap = await checkDomainsBatch(uniqueDomains, 8);

  const allChecked: ResultRow[] = candidates.map((c) => ({
    ...c,
    status: statusMap.get(c.domain) ?? "unknown",
    registerUrl: registrarSearchUrl(c.domain),
  }));

  const availableOnly = allChecked
    .filter((r) => r.status === "available")
    .sort((a, b) => a.domain.localeCompare(b.domain));

  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (!allowance.isPro) {
    headers["Set-Cookie"] = usageSetCookieHeader(incrementUsage(request));
  }

  return new Response(
    JSON.stringify({
      results: availableOnly.map(({ domain, base, style, reason, registerUrl }) => ({
        domain,
        base,
        style,
        reason,
        registerUrl,
      })),
      summary: {
        available: availableOnly.length,
        checked: allChecked.length,
        aiUsed,
        tlds,
      },
    }),
    { status: 200, headers },
  );
}
