import Script from "next/script";
import { ads } from "@/lib/ads";

/** Loads AdSense once site-wide. No-op when ads are disabled. */
export function AdSenseScript() {
  if (!ads.enabled || !ads.clientId) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
