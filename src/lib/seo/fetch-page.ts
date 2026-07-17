import dns from "node:dns/promises";
import net from "node:net";

const MAX_BYTES = 1_500_000; // ~1.5 MB HTML cap
const TIMEOUT_MS = 12_000;
const MAX_REDIRECTS = 3;
const USER_AGENT =
  "MytulifySEOBot/1.0 (+https://mytulify.com; page analysis; contact: support@mytulify.com)";

function isPrivateOrReservedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (!family) return true;

  if (family === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === undefined || b === undefined) return true;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local
  if (normalized.startsWith("ff")) return true; // multicast
  // IPv4-mapped IPv6
  const mapped = normalized.match(/^:ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped?.[1]) return isPrivateOrReservedIp(mapped[1]);
  return false;
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const host = hostname.replace(/\.$/, "").toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    throw new Error("Localhost and local hostnames are not allowed.");
  }
  if (host.endsWith(".internal") || host.endsWith(".intranet") || host === "metadata.google.internal") {
    throw new Error("Internal hostnames are not allowed.");
  }

  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) throw new Error("Private or reserved IP addresses are not allowed.");
    return;
  }

  let addresses: string[] = [];
  try {
    const result = await dns.lookup(host, { all: true, verbatim: true });
    addresses = result.map((r) => r.address);
  } catch {
    throw new Error("Could not resolve hostname.");
  }
  if (!addresses.length) throw new Error("Could not resolve hostname.");
  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr)) {
      throw new Error("Hostname resolves to a private or reserved address.");
    }
  }
}

function normalizePageUrl(raw: string): URL {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error("URL is required.");
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) throw new Error("URLs with credentials are not allowed.");
  return url;
}

export type FetchedPage = {
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
  title: string;
  truncated: boolean;
};

async function readLimitedText(res: Response): Promise<{ text: string; truncated: boolean }> {
  const len = Number(res.headers.get("content-length") || 0);
  if (len > MAX_BYTES) {
    throw new Error("Page is larger than the 1.5 MB fetch limit.");
  }
  if (!res.body) {
    const text = await res.text();
    if (text.length > MAX_BYTES) return { text: text.slice(0, MAX_BYTES), truncated: true };
    return { text, truncated: false };
  }
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      const remain = MAX_BYTES - (total - value.byteLength);
      if (remain > 0) chunks.push(value.slice(0, remain));
      truncated = true;
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
      break;
    }
    chunks.push(value);
  }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  return { text: buf.toString("utf8"), truncated };
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m?.[1]?.replace(/\s+/g, " ").trim().slice(0, 200) ?? "";
}

/**
 * Fetch a public page HTML with SSRF guards: public DNS only, limited redirects,
 * timeout, and response size cap.
 */
export async function fetchPublicPageHtml(rawUrl: string): Promise<FetchedPage> {
  let current = normalizePageUrl(rawUrl);
  await assertPublicHostname(current.hostname);

  let lastStatus = 0;
  let lastType = "";
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "User-Agent": USER_AGENT,
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } catch (e) {
      clearTimeout(timer);
      if ((e as Error).name === "AbortError") throw new Error("Request timed out.");
      throw new Error("Failed to fetch the URL.");
    } finally {
      clearTimeout(timer);
    }

    lastStatus = res.status;
    lastType = res.headers.get("content-type") ?? "";

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect without Location header.");
      const next = new URL(loc, current);
      if (next.protocol !== "http:" && next.protocol !== "https:") {
        throw new Error("Redirect used a non-http scheme.");
      }
      await assertPublicHostname(next.hostname);
      current = next;
      continue;
    }

    if (!res.ok) {
      throw new Error(`Page returned HTTP ${res.status}.`);
    }

    const ct = lastType.toLowerCase();
    if (
      ct &&
      !ct.includes("text/html") &&
      !ct.includes("application/xhtml") &&
      !ct.includes("text/plain") &&
      !ct.includes("application/xml") &&
      !ct.includes("text/xml") &&
      !ct.includes("application/json")
    ) {
      throw new Error(`Unsupported content type: ${ct.split(";")[0]}`);
    }

    const { text, truncated } = await readLimitedText(res);
    return {
      finalUrl: current.toString(),
      status: lastStatus,
      contentType: lastType,
      html: text,
      title: extractTitle(text),
      truncated,
    };
  }

  throw new Error("Too many redirects.");
}
