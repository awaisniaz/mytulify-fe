import Script from "next/script";
import { ads } from "@/lib/ads";

/**
 * Google AdSense loader — must appear once with this exact client URL.
 * Uses next/script so App Router does not strip a raw <head> tag.
 */
export function AdSenseScript() {
  if (!ads.clientId) return null;

  return (
    <Script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
