import { getUsageFromRequest } from "@/lib/billing/usage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const usage = await getUsageFromRequest(request);
  return Response.json({
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    isPro: usage.isPro,
    resetsAt: usage.resetsAt,
  });
}
