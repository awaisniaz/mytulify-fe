"use client";

import * as React from "react";

/** Skeleton placeholder shown while tool bundles lazy-load. */
export function ToolLoadingSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in" aria-busy="true" aria-label="Loading tool">
      <div className="flex items-center gap-3">
        <div className="skeleton h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/5 rounded-lg" />
          <div className="skeleton h-3 w-3/5 rounded-lg" />
        </div>
      </div>
      <div className="skeleton h-32 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="skeleton h-11 rounded-xl" />
        <div className="skeleton h-11 rounded-xl" />
      </div>
      <div className="skeleton h-24 rounded-xl" />
      <p className="text-center text-xs text-muted animate-pulse-soft">Loading tool…</p>
    </div>
  );
}
