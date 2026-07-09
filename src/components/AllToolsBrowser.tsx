"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Tool } from "@/lib/catalog";
import { ToolCard } from "@/components/cards";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { LocalizedTool } from "@/i18n/content";

export type ToolListItem = Tool & { label: LocalizedTool };

type Props = {
  tools: ToolListItem[];
  categories: { slug: string; name: string; icon: string; gradient: string }[];
  totalTools: number;
  searchPlaceholder: string;
  allLabel: string;
  hotLabel: string;
  clearLabel: string;
  comingSoonLabel: string;
};

export function AllToolsBrowser({ tools, categories, totalTools, searchPlaceholder, allLabel, hotLabel, clearLabel, comingSoonLabel }: Props) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return tools.filter((t) => {
      if (active !== "all" && t.category !== active) return false;
      if (!query) return true;
      return (
        t.label.name.toLowerCase().includes(query) ||
        t.label.description.toLowerCase().includes(query) ||
        t.slug.replace(/-/g, " ").includes(query)
      );
    });
  }, [q, active, tools]);

  return (
    <div>
      <div className="input-glow glass flex items-center gap-2 rounded-2xl p-2 shadow-sm">
        <Icon name="Search" className="ml-2 h-5 w-5 shrink-0 text-brand" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="mr-2 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-surface-2"
          >
            {clearLabel}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={cn("pill text-xs font-semibold", active === "all" && "ring-2 ring-brand")}
        >
          {allLabel} ({totalTools})
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setActive(c.slug)}
            className={cn(
              "pill inline-flex items-center gap-1.5 text-xs font-semibold",
              active === c.slug && "ring-2 ring-brand",
            )}
          >
            <Icon name={c.icon} className="h-3.5 w-3.5 text-brand" />
            {c.name}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((t) => {
          const cat = categories.find((c) => c.slug === t.category);
          return (
            <ToolCard key={`${t.category}/${t.slug}`} tool={t} label={t.label} accent={cat?.gradient} hotLabel={hotLabel} comingSoonLabel={comingSoonLabel} />
          );
        })}
      </div>
    </div>
  );
}
