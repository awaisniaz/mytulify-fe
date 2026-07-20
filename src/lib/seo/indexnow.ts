import { randomBytes } from "node:crypto";
import { assertPublicUrl } from "@/lib/seo/fetch-page";

/** Official IndexNow endpoints (any one is enough; api.indexnow.org fans out). */
export const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
] as const;

export function generateIndexNowKey(): string {
  return randomBytes(16).toString("hex");
}

export async function normalizeHttpUrl(raw: string): Promise<URL> {
  return assertPublicUrl(raw);
}

export function hostFromUrl(url: URL): string {
  return url.host.toLowerCase();
}

export function defaultKeyLocation(host: string, key: string): string {
  return `https://${host}/${key}.txt`;
}

export type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
};

export async function buildIndexNowPayload(input: {
  urls: string[];
  key: string;
  keyLocation?: string;
}): Promise<IndexNowPayload> {
  if (!input.key.trim()) throw new Error("IndexNow key is required.");
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(input.key.trim())) {
    throw new Error("Key must be 8–128 characters (letters, numbers, hyphens).");
  }
  const urls = input.urls.map((u) => u.trim()).filter(Boolean);
  if (!urls.length) throw new Error("Add at least one URL.");
  if (urls.length > 100) throw new Error("Max 100 URLs per submission.");

  const parsed = await Promise.all(urls.map((u) => normalizeHttpUrl(u)));
  const host = hostFromUrl(parsed[0]!);
  for (const u of parsed) {
    if (hostFromUrl(u) !== host) {
      throw new Error("All URLs must share the same host for one IndexNow request.");
    }
  }

  const key = input.key.trim();
  const keyLocation = (input.keyLocation?.trim() || defaultKeyLocation(host, key)).replace(/\/$/, "");

  return {
    host,
    key,
    keyLocation,
    urlList: parsed.map((u) => u.toString()),
  };
}

export type IndexNowResult = {
  endpoint: string;
  ok: boolean;
  status: number;
  body: string;
};

export async function submitIndexNow(
  payload: IndexNowPayload,
  endpoint: string = INDEXNOW_ENDPOINTS[0],
): Promise<IndexNowResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const body = (await res.text()).slice(0, 2000);
    return {
      endpoint,
      ok: res.status === 200 || res.status === 202,
      status: res.status,
      body,
    };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw new Error("IndexNow request timed out.");
    throw new Error("Failed to reach IndexNow endpoint.");
  } finally {
    clearTimeout(timer);
  }
}
