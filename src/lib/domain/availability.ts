import "server-only";

export type DomainStatus = "available" | "taken" | "unknown";

/** Check registration via RDAP, then DNS as fallback. */
export async function checkDomainAvailability(domain: string): Promise<DomainStatus> {
  const name = domain.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(name)) {
    return "unknown";
  }

  try {
    const rdap = await fetch(`https://rdap.org/domain/${encodeURIComponent(name)}`, {
      headers: { Accept: "application/rdap+json, application/json" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (rdap.status === 404) return "available";
    if (rdap.ok) return "taken";
  } catch {
    /* RDAP timeout — try DNS */
  }

  try {
    const dns = await import("node:dns").then((m) => m.promises);
    await dns.resolve(name);
    return "taken";
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOTFOUND" || code === "ENODATA") return "available";
  }

  return "unknown";
}

export async function checkDomainsBatch(
  domains: string[],
  concurrency = 6,
): Promise<Map<string, DomainStatus>> {
  const out = new Map<string, DomainStatus>();
  let i = 0;

  async function worker() {
    while (i < domains.length) {
      const idx = i++;
      const d = domains[idx]!;
      out.set(d, await checkDomainAvailability(d));
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, domains.length) }, () => worker()));
  return out;
}

export function registrarSearchUrl(domain: string): string {
  return `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`;
}
