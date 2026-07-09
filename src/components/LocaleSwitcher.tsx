"use client";

import { useTransition } from "react";
import { LOCALE_GROUPS, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <details className={cn("group relative", className)}>
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden",
          pending && "opacity-70",
        )}
        aria-label="Language"
      >
        <Icon name="Globe" className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[5rem] truncate">{LOCALE_LABELS[locale]}</span>
        <Icon name="ChevronDown" className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="absolute end-0 top-[calc(100%+0.35rem)] z-[60] max-h-72 w-52 overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-xl">
        {LOCALE_GROUPS.map((group) => (
          <div key={group.label} className="py-1">
            <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">{group.label}</p>
            {group.locales.map((code) => (
              <button
                key={code}
                type="button"
                disabled={pending}
                onClick={() => {
                  if (code === locale) return;
                  startTransition(() => setLocale(code));
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-surface-2",
                  code === locale && "bg-brand/10 font-semibold text-brand",
                )}
              >
                {LOCALE_LABELS[code]}
                {code === locale && <Icon name="Check" className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
