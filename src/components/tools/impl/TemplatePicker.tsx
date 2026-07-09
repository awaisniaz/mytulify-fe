"use client";

import * as React from "react";
import type { FormTemplate } from "@/lib/forms/template-types";
import { cn } from "@/lib/utils";

type Props = {
  templates: FormTemplate[];
  selectedId: string;
  onSelect: (id: string) => void;
  customId: string;
  hint?: string;
};

export function TemplatePicker({ templates, selectedId, onSelect, customId, hint }: Props) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, FormTemplate[]>();
    for (const t of templates) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [templates]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => onSelect(customId)}
        className={cn(
          "w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors",
          selectedId === customId
            ? "border-brand bg-brand/10 font-semibold text-brand"
            : "border-border bg-surface hover:bg-surface-2",
        )}
      >
        ✏️ Custom form — describe below (AI)
      </button>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-surface">
        {templates.length === 0 ? (
          <p className="p-4 text-sm text-muted">No forms match. Try another category or search term.</p>
        ) : (
          grouped.map(([category, items]) => (
            <div key={category}>
              <p className="sticky top-0 z-10 border-b border-border bg-surface-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                {category} ({items.length})
              </p>
              <ul>
                {items.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(t.id)}
                      className={cn(
                        "w-full border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 transition-colors",
                        selectedId === t.id
                          ? "bg-brand/10 font-semibold text-brand"
                          : "hover:bg-surface-2",
                      )}
                    >
                      <span className="mr-1">{t.country === "global" ? "🌍" : "🏳️"}</span>
                      {t.name}
                      <span className="ml-1 text-xs font-normal text-muted">
                        · {t.countryLabel} · {t.schema.fields.length} fields
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
