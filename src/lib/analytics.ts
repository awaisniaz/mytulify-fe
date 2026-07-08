/** Google Analytics 4 (gtag.js) */
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export const analytics = {
  /** GA4 measurement ID, e.g. G-XXXXXXXXXX */
  measurementId,

  /** Load gtag when an ID is set and analytics is not explicitly disabled. */
  enabled:
    Boolean(measurementId) && process.env.NEXT_PUBLIC_GA_ENABLED !== "false",
} as const;
