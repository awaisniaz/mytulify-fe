import { fetchPublicPageHtml } from "@/lib/seo/fetch-page";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Simple in-memory rate limit: 20 fetches / IP / minute. */
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
  const ip = clientIp(request);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many page fetches. Try again in a minute." }, { status: 429 });
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
    const page = await fetchPublicPageHtml(url);
    return Response.json({
      ok: true,
      finalUrl: page.finalUrl,
      status: page.status,
      contentType: page.contentType,
      title: page.title,
      truncated: page.truncated,
      html: page.html,
      bytes: page.html.length,
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Fetch failed." }, { status: 400 });
  }
}
