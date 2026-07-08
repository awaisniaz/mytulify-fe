import { site } from "./site";

/** Single source for app-wide branding — import instead of hardcoding. */
export const brand = {
  name: site.name,
  url: site.url,
  supportEmail: site.supportEmail,
  proProduct: `${site.name} Pro`,
  licensePrefix: "mt_pro_",
} as const;

/** Pre-rename localStorage keys (Toolverse / ToolStack → Mytulify migration). */
export const LEGACY_STORAGE = {
  accessToken: ["toolverse_access_token", "toolstack_access_token"],
  refreshToken: ["toolverse_refresh_token", "toolstack_refresh_token"],
  user: ["toolverse_user", "toolstack_user"],
  proKey: ["toolverse_pro_key", "toolstack_pro_key"],
} as const;

const CURRENT_STORAGE = {
  accessToken: "mytulify_access_token",
  refreshToken: "mytulify_refresh_token",
  user: "mytulify_user",
  proKey: "mytulify_pro_key",
} as const;

/** Move legacy keys to current keys once (safe for existing browser sessions). */
export function migrateLegacyStorage(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(LEGACY_STORAGE) as (keyof typeof LEGACY_STORAGE)[]) {
      const current = CURRENT_STORAGE[key];
      for (const legacy of LEGACY_STORAGE[key]) {
        const value = localStorage.getItem(legacy);
        if (value && !localStorage.getItem(current)) {
          localStorage.setItem(current, value);
        }
        if (value) localStorage.removeItem(legacy);
      }
    }
  } catch {
    /* private mode */
  }
}
