/** Google AdSense — one publisher, one script load. */

const LIVE_CLIENT = "ca-pub-7509015640782855";

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || LIVE_CLIENT;
const left = process.env.NEXT_PUBLIC_AD_SLOT_LEFT?.trim() || "";
const right = process.env.NEXT_PUBLIC_AD_SLOT_RIGHT?.trim() || "";

/** Skip AdSense on `next dev` to avoid invalid traffic; production (or ADS_LIVE=1) loads it. */
const scriptEnabled =
  Boolean(clientId) &&
  (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ADS_LIVE === "1");

export const sideRails = {
  left: left && left !== right ? left : null,
  right: right || null,
} as const;

export const ads = {
  clientId,
  scriptEnabled,
  /** Manual rail units — only when you create ad units and set slot env vars. */
  enabled: scriptEnabled && Boolean(sideRails.left || sideRails.right),
  isTestMode: false,
  sideRails,
  bothSides: Boolean(sideRails.left && sideRails.right),
  /** @deprecated */
  slot: right,
  slots: { home: right, listing: right, tool: right },
} as const;

export type AdSide = "left" | "right";

export function slotForSide(side: AdSide): string | null {
  if (!ads.enabled) return null;
  return side === "left" ? sideRails.left : sideRails.right;
}

export type AdPlacement = keyof typeof ads.slots;

export function slotFor(placement: AdPlacement): string | null {
  if (!ads.enabled) return null;
  return ads.slots[placement] || right || null;
}

export const AD_FREE_PATHS = new Set([
  "/privacy",
  "/about",
  "/press",
  "/link-to-us",
  "/pricing",
  "/pricing/pay",
  "/login",
  "/signup",
  "/auth/callback",
]);

export function isAdFreePath(path: string): boolean {
  if (AD_FREE_PATHS.has(path)) return true;
  if (path.startsWith("/auth/") || path.startsWith("/pricing/")) return true;
  return false;
}
