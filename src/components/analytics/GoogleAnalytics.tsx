import Script from "next/script";
import { analytics } from "@/lib/analytics";

/** Site-wide Google Analytics 4 (gtag.js). No-op when disabled or no measurement ID. */
export function GoogleAnalytics() {
  if (!analytics.enabled) return null;

  const id = analytics.measurementId;

  return (
    <>
      <Script
        id="ga-gtag"
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
