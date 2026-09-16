import { ads } from "@/lib/ads";

/**
 * Loads AdSense once site-wide (Auto Ads + account verification).
 * Do not paste this snippet more than once — duplicate loaders are invalid.
 */
export function AdSenseScript() {
  if (!ads.scriptEnabled || !ads.clientId) return null;

  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`}
      crossOrigin="anonymous"
    />
  );
}
