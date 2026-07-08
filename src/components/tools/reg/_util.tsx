"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";

export function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-2 p-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name="Wand2" className="h-6 w-6" />
      </span>
      <p className="text-lg font-semibold">This tool is launching soon</p>
      <p className="max-w-md text-sm text-muted">
        We&apos;re putting the finishing touches on this one. The full interactive version
        will be available here shortly — check back in a moment.
      </p>
    </div>
  );
}

export type ToolMap = Record<string, React.ComponentType>;

/** Build a category registration component that renders the right tool by slug. */
export function makeReg(map: ToolMap) {
  function Reg({ slug }: { slug: string }) {
    const Cmp = map[slug];
    return Cmp ? <Cmp /> : <ComingSoon />;
  }
  Reg.displayName = "ToolReg";
  return Reg;
}
