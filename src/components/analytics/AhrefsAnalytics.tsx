import Script from "next/script";
import { ahrefsAnalytics } from "@/lib/analytics";

/** Site-wide Ahrefs Web Analytics. No-op when disabled or no key. */
export function AhrefsAnalytics() {
  if (!ahrefsAnalytics.enabled || !ahrefsAnalytics.key) return null;

  return (
    <Script
      src="https://analytics.ahrefs.com/analytics.js"
      strategy="afterInteractive"
      data-key={ahrefsAnalytics.key}
    />
  );
}
