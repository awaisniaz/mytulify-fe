"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { analytics } from "@/lib/analytics";

type VitalMetric = {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Queue gtag calls before gtag.js finishes loading. */
function ensureGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === "function") return;
  window.gtag = function gtag() {
    // gtag.js only replays real `arguments` objects, not a rest array.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
}

/**
 * GA4 stores event `value` as an integer. CLS is a fraction (often 0.05),
 * so a raw send rounds to 0. Scale CLS by 1000; other vitals are already milliseconds.
 */
function reportWebVital(metric: VitalMetric) {
  if (!analytics.enabled || metric.name === "FID") return;
  if (!Number.isFinite(metric.value) || metric.value < 0) return;

  const scale = metric.name === "CLS" ? 1000 : 1;
  const value = Math.round(metric.delta * scale);

  ensureGtag();
  window.gtag?.("event", metric.name, {
    value,
    metric_id: metric.id,
    metric_value: Math.round(metric.value * scale),
    metric_delta: value,
    metric_rating: metric.rating,
    metric_navigation_type: metric.navigationType ?? "navigate",
  });
}

/** Sends LCP, INP, CLS, FCP, and TTFB to GA4, plus page views after client navigations. */
export function WebVitals() {
  const pathname = usePathname();
  const firstPage = useRef(true);

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    if (!analytics.enabled) return;
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    ensureGtag();
    window.gtag?.("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
