/** Google AdSense — one publisher script, separate display + in-feed units. */

const LIVE_CLIENT = "ca-pub-7509015640782855";
const DISPLAY_SLOT = "8994099823";
const INFEED_SLOT = "3104488051";
const INFEED_LAYOUT_KEY = "-6t+ed+2i-1n-4w";
const IN_ARTICLE_SLOT = "8819849163";
const MULTIPLEX_SLOT = "5539079700";

const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || LIVE_CLIENT;
const displaySlot = process.env.NEXT_PUBLIC_AD_SLOT_DISPLAY?.trim() || DISPLAY_SLOT;
const inFeedSlot = process.env.NEXT_PUBLIC_AD_SLOT_INFEED?.trim() || INFEED_SLOT;
const inFeedLayoutKey = process.env.NEXT_PUBLIC_AD_LAYOUT_KEY_INFEED?.trim() || INFEED_LAYOUT_KEY;
const inArticleSlot = process.env.NEXT_PUBLIC_AD_SLOT_IN_ARTICLE?.trim() || IN_ARTICLE_SLOT;
const multiplexSlot = process.env.NEXT_PUBLIC_AD_SLOT_MULTIPLEX?.trim() || MULTIPLEX_SLOT;
const left = process.env.NEXT_PUBLIC_AD_SLOT_LEFT?.trim() || "";
const right = process.env.NEXT_PUBLIC_AD_SLOT_RIGHT?.trim() || "";

export const sideRails = {
  left: left && left !== right ? left : null,
  right: right || null,
} as const;

export const ads = {
  clientId,
  displaySlot,
  inFeedSlot,
  inFeedLayoutKey,
  inArticleSlot,
  multiplexSlot,
  enabled: Boolean(clientId && (displaySlot || inFeedSlot || inArticleSlot || multiplexSlot)),
  railsEnabled: Boolean(clientId && (left || right)),
  isTestMode: false,
  sideRails,
  bothSides: Boolean(sideRails.left && sideRails.right),
  /** @deprecated use displaySlot */
  slot: displaySlot,
  slots: { home: displaySlot, listing: displaySlot, tool: displaySlot },
} as const;

export type AdSide = "left" | "right";

export function slotForSide(side: AdSide): string | null {
  if (!ads.railsEnabled) return null;
  return side === "left" ? sideRails.left : sideRails.right;
}

export type AdPlacement = keyof typeof ads.slots;

export function slotFor(placement: AdPlacement): string | null {
  if (!ads.enabled) return null;
  return ads.slots[placement] || displaySlot || null;
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
