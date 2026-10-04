import { ads } from "@/lib/ads";

/**
 * Google AdSense loader. A real script tag has to be in the first HTML
 * response. next/script afterInteractive only preloads it, and the AdSense
 * crawler does not run that later injection, so site verification fails.
 */
export function AdSenseScript() {
  if (!ads.clientId) return null;

  return (
    <script
      id="adsense-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.clientId}`}
      crossOrigin="anonymous"
    />
  );
}
