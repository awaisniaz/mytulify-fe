"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function CopySnippet({
  label,
  code,
  className,
}: {
  label: string;
  code: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={cn("rounded-xl border border-border bg-surface", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10 transition"
        >
          <Icon name={copied ? "Check" : "Copy"} className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-muted whitespace-pre-wrap break-all">{code}</pre>
    </div>
  );
}
