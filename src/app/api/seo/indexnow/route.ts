import { buildIndexNowPayload, submitIndexNow, INDEXNOW_ENDPOINTS } from "@/lib/seo/indexnow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const buckets = new Map<string, { count: number; reset: number }>();

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimit(ip: string, max = 10): boolean {
  const now = Date.now();
  const hit = buckets.get(ip);
  if (!hit || now > hit.reset) {
    buckets.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (hit.count >= max) return false;
  hit.count += 1;
  return true;
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!rateLimit(ip)) {
    return Response.json({ error: "Too many IndexNow submissions. Try again in a minute." }, { status: 429 });
  }

  let body: { urls?: string[]; key?: string; keyLocation?: string; endpoint?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const endpoint =
      body.endpoint && (INDEXNOW_ENDPOINTS as readonly string[]).includes(body.endpoint)
        ? body.endpoint
        : INDEXNOW_ENDPOINTS[0];
    const payload = await buildIndexNowPayload({
      urls: body.urls ?? [],
      key: body.key ?? "",
      keyLocation: body.keyLocation,
    });
    const result = await submitIndexNow(payload, endpoint);
    return Response.json({
      ok: result.ok,
      status: result.status,
      endpoint: result.endpoint,
      body: result.body,
      payload: {
        host: payload.host,
        keyLocation: payload.keyLocation,
        count: payload.urlList.length,
        urlList: payload.urlList,
      },
      hint: result.ok
        ? "Accepted by IndexNow (Bing/Yandex ecosystem). Google is separate — use GSC + readiness fixes."
        : result.status === 422
          ? "Key validation failed — host a key file at keyLocation (plain text = your key)."
          : `IndexNow returned HTTP ${result.status}.`,
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message || "IndexNow failed." }, { status: 400 });
  }
}
