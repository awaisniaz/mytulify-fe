/** Google AdSense — keep simple. Flip ADS_LIVE when your account is ready. */

const ADS_LIVE = false;

const TEST = {
  client: "ca-pub-3940256099942544",
  left: "1033173712",
  right: "6300978111",
} as const;

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || (ADS_LIVE ? "" : TEST.client);
const left = process.env.NEXT_PUBLIC_AD_SLOT_LEFT?.trim() || TEST.left;
const right = process.env.NEXT_PUBLIC_AD_SLOT_RIGHT?.trim() || TEST.right;

export const sideRails = {
  left: left === right ? null : left,
  right,
} as const;

export const ads = {
  enabled: ADS_LIVE && Boolean(clientId) && Boolean(sideRails.left || sideRails.right),
  clientId,
  isTestMode: !process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim(),
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
