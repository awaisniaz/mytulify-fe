import { assertPublicUrl, fetchPublicPageHtml } from "@/lib/seo/fetch-page";

export type IndexingIssue = {
  severity: "error" | "warn" | "ok" | "info";
  code: string;
  message: string;
};

export type IndexingAudit = {
  inputUrl: string;
  finalUrl: string;
  status: number;
  title: string;
  xRobotsTag: string | null;
  metaRobots: string;
  canonical: string | null;
  canonicalMatches: boolean | null;
  robotsTxtUrl: string;
  robotsTxtFound: boolean;
  robotsBlocked: boolean | null;
  sitemapHints: string[];
  issues: IndexingIssue[];
  score: number;
  googleCheckUrl: string;
  bingCheckUrl: string;
};

function extractMetaRobots(html: string): string {
  const m = html.match(
    /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  ) || html.match(
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']robots["'][^>]*>/i,
  );
  return m?.[1]?.trim() ?? "";
}

function extractCanonical(html: string, base: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);
  if (!m?.[1]) return null;
  try {
    return new URL(m[1], base).toString();
  } catch {
    return m[1];
  }
}

function pathBlockedByRobots(robotsTxt: string, path: string): boolean {
  const lines = robotsTxt.split(/\r?\n/);
  let inStar = false;
  const disallows: string[] = [];
  const allows: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const ua = line.match(/^user-agent\s*:\s*(.+)$/i);
    if (ua) {
      inStar = ua[1]!.trim() === "*";
      continue;
    }
    if (!inStar) continue;
    const dis = line.match(/^disallow\s*:\s*(.*)$/i);
    if (dis) {
      disallows.push(dis[1]!.trim());
      continue;
    }
    const all = line.match(/^allow\s*:\s*(.*)$/i);
    if (all) allows.push(all[1]!.trim());
  }
  // Empty Disallow means allow all
  const blocked = disallows.some((rule) => {
    if (rule === "") return false;
    if (rule === "/") return true;
    return path.startsWith(rule);
  });
  if (!blocked) return false;
  // Simple allow override for longer matching prefixes
  const allowed = allows.some((rule) => rule && path.startsWith(rule));
  return !allowed;
}

function sitemapLines(robotsTxt: string): string[] {
  return robotsTxt
    .split(/\r?\n/)
    .map((l) => l.match(/^sitemap\s*:\s*(.+)$/i)?.[1]?.trim())
    .filter((x): x is string => Boolean(x));
}

async function fetchTextQuiet(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "text/plain,*/*",
        "User-Agent": "MytulifySEOBot/1.0 (+https://mytulify.com)",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.text()).slice(0, 200_000);
  } catch {
    return null;
  }
}

function searchLinks(url: string) {
  const q = encodeURIComponent(`site:${url}`);
  return {
    googleCheckUrl: `https://www.google.com/search?q=${q}`,
    bingCheckUrl: `https://www.bing.com/search?q=${q}`,
  };
}

/**
 * Audit whether a public URL looks indexable (robots, meta, canonical, live status).
 * Does not force Google indexing — readiness only.
 */
export async function auditUrlIndexing(rawUrl: string): Promise<IndexingAudit> {
  const input = await assertPublicUrl(rawUrl);
  const page = await fetchPublicPageHtml(input.toString());
  const final = new URL(page.finalUrl);

  // Re-fetch once with header capture via HEAD/GET for x-robots-tag
  let xRobots: string | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);
    const res = await fetch(page.finalUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html",
        "User-Agent": "MytulifySEOBot/1.0 (+https://mytulify.com)",
      },
    });
    clearTimeout(timer);
    xRobots = res.headers.get("x-robots-tag");
  } catch {
    /* ignore */
  }

  const metaRobots = extractMetaRobots(page.html);
  const canonical = extractCanonical(page.html, page.finalUrl);
  let canonicalMatches: boolean | null = null;
  if (canonical) {
    try {
      const c = new URL(canonical);
      canonicalMatches =
        c.origin === final.origin &&
        c.pathname.replace(/\/$/, "") === final.pathname.replace(/\/$/, "");
    } catch {
      canonicalMatches = false;
    }
  }

  const robotsTxtUrl = `${final.origin}/robots.txt`;
  const robotsTxt = await fetchTextQuiet(robotsTxtUrl);
  const robotsTxtFound = robotsTxt != null;
  let robotsBlocked: boolean | null = null;
  if (robotsTxt != null) {
    robotsBlocked = pathBlockedByRobots(robotsTxt, final.pathname || "/");
  }
  const sitemapHints = robotsTxt ? sitemapLines(robotsTxt) : [];

  const issues: IndexingIssue[] = [];
  const robotsCombined = `${metaRobots} ${xRobots ?? ""}`.toLowerCase();

  if (page.status >= 400) {
    issues.push({ severity: "error", code: "http", message: `HTTP ${page.status} — crawlers may not index this URL.` });
  } else {
    issues.push({ severity: "ok", code: "http", message: `Live page returns HTTP ${page.status}.` });
  }

  if (/noindex/.test(robotsCombined)) {
    issues.push({
      severity: "error",
      code: "noindex",
      message: `noindex found (${metaRobots || xRobots}). Search engines should skip this URL.`,
    });
  } else {
    issues.push({ severity: "ok", code: "noindex", message: "No noindex directive detected." });
  }

  if (/nofollow/.test(robotsCombined)) {
    issues.push({ severity: "warn", code: "nofollow", message: "nofollow is set — links on this page may not pass equity." });
  }

  if (robotsBlocked === true) {
    issues.push({
      severity: "error",
      code: "robots-txt",
      message: `robots.txt appears to Disallow ${final.pathname || "/"}.`,
    });
  } else if (robotsBlocked === false) {
    issues.push({ severity: "ok", code: "robots-txt", message: "Path is not blocked by robots.txt User-agent: *." });
  } else {
    issues.push({ severity: "warn", code: "robots-txt", message: "Could not fetch robots.txt." });
  }

  if (!canonical) {
    issues.push({ severity: "warn", code: "canonical", message: "No canonical link tag — duplicates may compete." });
  } else if (canonicalMatches === false) {
    issues.push({
      severity: "warn",
      code: "canonical",
      message: `Canonical points elsewhere: ${canonical}`,
    });
  } else {
    issues.push({ severity: "ok", code: "canonical", message: "Canonical matches this URL." });
  }

  if (!page.title) {
    issues.push({ severity: "warn", code: "title", message: "Missing <title> — hurts discovery & CTR." });
  }

  if (!sitemapHints.length) {
    issues.push({
      severity: "info",
      code: "sitemap",
      message: "No Sitemap: lines in robots.txt — consider adding one and submitting in GSC/Bing.",
    });
  } else {
    issues.push({
      severity: "ok",
      code: "sitemap",
      message: `robots.txt lists ${sitemapHints.length} sitemap(s).`,
    });
  }

  issues.push({
    severity: "info",
    code: "indexnow",
    message: "After fixes, notify Bing/Yandex via IndexNow. Google still relies on crawl + GSC.",
  });

  let score = 100;
  for (const i of issues) {
    if (i.severity === "error") score -= 25;
    else if (i.severity === "warn") score -= 10;
  }
  score = Math.max(0, Math.min(100, score));

  const links = searchLinks(page.finalUrl);
  return {
    inputUrl: input.toString(),
    finalUrl: page.finalUrl,
    status: page.status,
    title: page.title,
    xRobotsTag: xRobots,
    metaRobots,
    canonical,
    canonicalMatches,
    robotsTxtUrl,
    robotsTxtFound,
    robotsBlocked,
    sitemapHints,
    issues,
    score,
    ...links,
  };
}

export type IndexCheckResult = {
  url: string;
  likelyIndexed: boolean | null;
  confidence: "low" | "medium" | "none";
  detail: string;
  googleCheckUrl: string;
  bingCheckUrl: string;
};

/**
 * Soft index presence check via Bing HTML search. Results are best-effort —
 * always confirm with the provided Google/Bing site: links.
 */
export async function softCheckIndexed(rawUrl: string): Promise<IndexCheckResult> {
  const url = await assertPublicUrl(rawUrl);
  const href = url.toString();
  const links = searchLinks(href);
  const query = `url:${href}`;
  const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch(bingUrl, {
      signal: controller.signal,
      headers: {
        Accept: "text/html",
        "User-Agent":
          "Mozilla/5.0 (compatible; MytulifySEOBot/1.0; +https://mytulify.com)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return {
        url: href,
        likelyIndexed: null,
        confidence: "none",
        detail: `Bing search returned HTTP ${res.status}. Use the Google/Bing links to verify manually.`,
        ...links,
      };
    }
    const html = (await res.text()).toLowerCase();
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const hit =
      html.includes(host) &&
      (path === "/" || path === "" || html.includes(path.slice(0, Math.min(path.length, 40))));

    // Bing often shows "No results found" phrasing
    const noResults = /there are no results|no results found for|didn't match any/i.test(html);

    if (noResults) {
      return {
        url: href,
        likelyIndexed: false,
        confidence: "low",
        detail: "Bing search looks empty for this URL. Confirm with the Google site: link (Google is separate).",
        ...links,
      };
    }
    if (hit) {
      return {
        url: href,
        likelyIndexed: true,
        confidence: "low",
        detail: "Bing HTML search appears to mention this URL (soft signal only — confirm manually).",
        ...links,
      };
    }
    return {
      url: href,
      likelyIndexed: null,
      confidence: "none",
      detail: "Could not confidently parse Bing results. Open Google/Bing site: checks below.",
      ...links,
    };
  } catch {
    return {
      url: href,
      likelyIndexed: null,
      confidence: "none",
      detail: "Automatic check unavailable. Use Google/Bing site: links to verify indexing.",
      ...links,
    };
  }
}
