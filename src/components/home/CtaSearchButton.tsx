"use client";

import { Icon } from "@/components/ui/Icon";

export function CtaSearchButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
      className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
    >
      <Icon name="Search" className="h-4 w-4" />
      Quick search
      <kbd className="rounded border border-white/30 px-1.5 text-xs opacity-80">⌘K</kbd>
    </button>
  );
}
