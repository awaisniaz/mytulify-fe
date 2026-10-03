"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
// Next bundles web-vitals here and does not ship types for the compiled file.
// @ts-expect-error compiled bundle has no declaration file
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "next/dist/compiled/web-vitals";
import { analytics } from "@/lib/analytics";

type VitalMetric = {
  name: string;
  value: number;
  delta: number;
  id: string;
  rating: "good" | "needs-improvement" | "poor";
  navigationType?: string;
};

type VitalOpts = { reportAllChanges?: boolean; durationThreshold?: number };
type ReportFn = (metric: VitalMetric) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const vitals = { onCLS, onFCP, onINP, onLCP, onTTFB } as unknown as {
  onCLS: (cb: ReportFn, opts?: VitalOpts) => void;
  onFCP: (cb: ReportFn, opts?: VitalOpts) => void;
  onINP: (cb: ReportFn, opts?: VitalOpts) => void;
  onLCP: (cb: ReportFn, opts?: VitalOpts) => void;
  onTTFB: (cb: ReportFn, opts?: VitalOpts) => void;
};

/** True once gtag.js has replaced dataLayer.push. Native push drops the hit. */
function tagReady() {
  const push = window.dataLayer?.push;
  return typeof push === "function" && !String(push).includes("[native code]");
}

/**
 * gtag.js ignores hits that were pushed before it hooks dataLayer.
 * Wait until that hook exists, then send.
 */
function sendWhenReady(name: string, params: Record<string, string | number>) {
  const fire = () => window.gtag?.("event", name, params);
  if (typeof window.gtag !== "function") return;
  if (tagReady()) {
    fire();
    return;
  }
  const started = Date.now();
  const timer = window.setInterval(() => {
    if (tagReady() || Date.now() - started > 10000) {
      window.clearInterval(timer);
      fire();
    }
  }, 50);
}

/**
 * GA4 stores event `value` as an integer. CLS is a fraction (often 0.05),
 * so a raw send rounds to 0. Scale CLS by 1000; other vitals are already milliseconds.
 * Send `delta` so repeated INP updates can be summed.
 */
function reportWebVital(metric: VitalMetric) {
  if (!analytics.enabled || metric.name === "FID") return;
  if (!Number.isFinite(metric.value) || metric.value < 0) return;

  const scale = metric.name === "CLS" ? 1000 : 1;
  const value = Math.round(metric.delta * scale);

  sendWhenReady(metric.name, {
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

  useEffect(() => {
    vitals.onTTFB(reportWebVital);
    vitals.onFCP(reportWebVital);
    vitals.onLCP(reportWebVital);
    vitals.onCLS(reportWebVital);
    // Default INP ignores interactions under 40ms and only flushes on tab hide,
    // so a key press never shows up while the page stays open.
    vitals.onINP(reportWebVital, { reportAllChanges: true, durationThreshold: 0 });
  }, []);

  useEffect(() => {
    if (!analytics.enabled) return;
    if (firstPage.current) {
      firstPage.current = false;
      return;
    }
    sendWhenReady("page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  return null;
}
