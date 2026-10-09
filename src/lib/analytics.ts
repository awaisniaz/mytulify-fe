import { IS_PRODUCTION } from "@/lib/runtime";

/** Site analytics — third-party tracking only runs in production. */
export const analytics = {
  measurementId: "G-8HTYS53E51",
  enabled: IS_PRODUCTION,
} as const;

export const ahrefsAnalytics = {
  key: "E3E1nVuEjwND8ujuM5djlA",
  enabled: IS_PRODUCTION,
} as const;
