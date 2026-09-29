import { tracePublicRedirects } from "@/lib/seo/fetch-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const buckets = new Map<string, { count: number; reset: number }>();

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const hit = buckets.get(ip);
  if (!hit || now > hit.reset) {
    buckets.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (hit.count >= 20) return false;
  hit.count += 1;
  return true;
}

export async function POST(request: Request) {
  if (!rateLimit(clientIp(request))) {
    return Response.json({ error: "Too many redirect checks. Try again in a minute." }, { status: 429 });
  }

  let body: { url?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = body.url?.trim() ?? "";
  if (!url) return Response.json({ error: "URL is required." }, { status: 400 });
  if (url.length > 2048) return Response.json({ error: "URL is too long." }, { status: 400 });

  try {
    const trace = await tracePublicRedirects(url);
    return Response.json({ ok: true, ...trace });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Redirect check failed." }, { status: 400 });
  }
}
