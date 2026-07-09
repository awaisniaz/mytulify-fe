/** Google official test publisher — safe for local dev until your account is approved. */
const TEST_CLIENT = "ca-pub-3940256099942544";
/** Two different test slots so left + right can both render (AdSense forbids duplicate slots). */
const TEST_SLOT_LEFT = "1033173712";
const TEST_SLOT_RIGHT = "6300978111";

/** Filhal ads off — set true (or NEXT_PUBLIC_ADS_ENABLED=true) when AdSense is ready. */
const ADS_LIVE = false;

const envClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
const envSlot = process.env.NEXT_PUBLIC_AD_SLOT?.trim() || "";

const useTestAds =
  process.env.NEXT_PUBLIC_ADS_ENABLED !== "false" &&
  process.env.NEXT_PUBLIC_ADS_USE_TEST_ADS !== "false" &&
  !envClient &&
  (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ADS_USE_TEST_ADS === "true");

const clientId = envClient || (useTestAds ? TEST_CLIENT : "");

const slotRight =
  process.env.NEXT_PUBLIC_AD_SLOT_SIDE_RIGHT?.trim() ||
  process.env.NEXT_PUBLIC_AD_SLOT_RIGHT?.trim() ||
  envSlot ||
  (useTestAds ? TEST_SLOT_RIGHT : "");

const slotLeft =
  process.env.NEXT_PUBLIC_AD_SLOT_SIDE_LEFT?.trim() ||
  process.env.NEXT_PUBLIC_AD_SLOT_LEFT?.trim() ||
  (useTestAds ? TEST_SLOT_LEFT : "");

/** Same slot ID cannot appear twice on one page (AdSense policy). */
function resolveSideSlot(id: string | undefined, other: string | null): string | null {
  if (!id) return null;
  if (other && id === other) return null;
  return id;
}

export const sideRails = {
  left: resolveSideSlot(slotLeft, slotRight || null),
  right: resolveSideSlot(slotRight, slotLeft || null) || resolveSideSlot(slotRight, null),
} as const;

export const ads = {
  enabled:
    ADS_LIVE &&
    process.env.NEXT_PUBLIC_ADS_ENABLED !== "false" &&
    Boolean(clientId) &&
    Boolean(sideRails.left || sideRails.right),

  clientId,
  isTestMode: useTestAds,
  sideRails,
  bothSides: Boolean(sideRails.left && sideRails.right),

  /** @deprecated */
  slot: slotRight,
  slots: { home: slotRight, listing: slotRight, tool: slotRight },
} as const;

export type AdSide = "left" | "right";

export function slotForSide(side: AdSide): string | null {
  if (!ads.enabled) return null;
  return side === "left" ? sideRails.left : sideRails.right;
}

export type AdPlacement = keyof typeof ads.slots;

export function slotFor(placement: AdPlacement): string | null {
  if (!ads.enabled) return null;
  return ads.slots[placement] || slotRight || null;
}

/** Pages without ads (legal, auth, pricing). Pro users hide ads client-side. */
export const AD_FREE_PATHS = new Set([
  "/privacy",
  "/about",
  "/pricing",
  "/pricing/pay",
  "/login",
  "/signup",
  "/auth/callback",
]);

/** True when side ads must not render on this pathname. */
export function isAdFreePath(path: string): boolean {
  if (AD_FREE_PATHS.has(path)) return true;
  if (path.startsWith("/auth/")) return true;
  if (path.startsWith("/pricing/")) return true;
  return false;
}
