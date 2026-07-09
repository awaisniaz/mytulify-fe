"use client";

import { Icon } from "@/components/ui/Icon";

export function ComingSoon({
  badge = "Coming soon",
  title = "This tool is launching soon",
  description = "We're putting the finishing touches on this one. The full interactive version will be available here shortly — check back in a moment.",
}: {
  badge?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface-2 p-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon name="Wand2" className="h-6 w-6" />
      </span>
      <p className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        {badge}
      </p>
      <p className="text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted">{description}</p>
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
