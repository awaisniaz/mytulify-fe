import { createHmac, timingSafeEqual } from "crypto";
import { validateLicenseKey } from "./keys";
import { verifyAuthToken } from "@/lib/auth/server";
import { FREE_AI_DAILY_LIMIT } from "./plans";

const SECRET = process.env.USAGE_SECRET || "mytulify-dev-usage-secret";

export type UsagePayload = { d: string; n: number };

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

export function encodeUsageCookie(payload: UsagePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function parseUsageCookie(raw: string | undefined): UsagePayload {
  const fresh = { d: todayUtc(), n: 0 };
  if (!raw) return fresh;

  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return fresh;

  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(body);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return fresh;
  } catch {
    return fresh;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as UsagePayload;
    if (payload.d !== todayUtc()) return fresh;
    if (typeof payload.n !== "number" || payload.n < 0) return fresh;
    return payload;
  } catch {
    return fresh;
  }
}

function legacyProKeys(): string[] {
  return (process.env.PRO_ACCESS_KEYS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Validate Pro — JWT user, license key (DB), or legacy env keys. */
export async function isProKey(key: string | null | undefined): Promise<boolean> {
  const k = key?.trim();
  if (!k) return false;
  if (legacyProKeys().includes(k)) return true;
  return validateLicenseKey(k);
}

export async function isProRequest(request: Request): Promise<boolean> {
  const jwtUser = await verifyAuthToken(request);
  if (jwtUser?.isPro) return true;

  const key = request.headers.get("x-pro-key");
  if (key && (await isProKey(key))) return true;

  return false;
}

export type UsageSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  isPro: boolean;
  resetsAt: string;
};

export function buildUsageSnapshot(request: Request, isPro: boolean): UsageSnapshot {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)tv_ai_usage=([^;]+)/);
  const payload = parseUsageCookie(match?.[1] ? decodeURIComponent(match[1]) : undefined);

  const remaining = isPro ? Infinity : Math.max(0, FREE_AI_DAILY_LIMIT - payload.n);

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  return {
    used: isPro ? 0 : payload.n,
    limit: isPro ? -1 : FREE_AI_DAILY_LIMIT,
    remaining: isPro ? -1 : remaining,
    isPro,
    resetsAt: tomorrow.toISOString(),
  };
}

export async function getUsageFromRequest(request: Request): Promise<UsageSnapshot> {
  const isPro = await isProRequest(request);
  return buildUsageSnapshot(request, isPro);
}

export async function checkAiAllowance(
  request: Request,
): Promise<{ ok: true; isPro: boolean } | { ok: false; snapshot: UsageSnapshot }> {
  const isPro = await isProRequest(request);
  const snapshot = buildUsageSnapshot(request, isPro);
  if (isPro) return { ok: true, isPro: true };
  if (snapshot.remaining <= 0) return { ok: false, snapshot };
  return { ok: true, isPro: false };
}

export function incrementUsage(request: Request): UsagePayload {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)tv_ai_usage=([^;]+)/);
  const payload = parseUsageCookie(match?.[1] ? decodeURIComponent(match[1]) : undefined);
  return { d: todayUtc(), n: payload.n + 1 };
}

export function usageSetCookieHeader(payload: UsagePayload): string {
  const value = encodeURIComponent(encodeUsageCookie(payload));
  const maxAge = 60 * 60 * 24 * 2;
  return `tv_ai_usage=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; HttpOnly`;
}
