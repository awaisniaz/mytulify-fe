"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function ToolDirectoryFilter({
  categories,
  totalTools,
  searchPlaceholder,
  allLabel,
  clearLabel,
}: {
  categories: { slug: string; name: string }[];
  totalTools: number;
  searchPlaceholder: string;
  allLabel: string;
  clearLabel: string;
}) {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [active, setActive] = useState("all");
  const [shown, setShown] = useState(totalTools);

  useEffect(() => {
    const root = document.getElementById("tool-directory");
    if (!root) return;
    const query = q.trim().toLowerCase();
    let count = 0;
    root.querySelectorAll<HTMLAnchorElement>("a.tool-row").forEach((link) => {
      const catOk = active === "all" || link.dataset.cat === active;
      const textOk = !query || (link.textContent ?? "").toLowerCase().includes(query);
      const visible = catOk && textOk;
      link.hidden = !visible;
      if (visible) count += 1;
    });
    setShown(count);
  }, [q, active]);

  return (
    <div>
      <div className="input-glow glass flex items-center gap-2 rounded-2xl p-2 shadow-sm">
        <Icon name="Search" className="ml-2 h-5 w-5 shrink-0 text-brand" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted sm:text-sm"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="mr-2 shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-surface-2"
          >
            {clearLabel}
          </button>
        )}
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => setActive("all")}
          className={cn("pill shrink-0 text-xs font-semibold", active === "all" && "ring-2 ring-brand")}
        >
          {allLabel} ({totalTools})
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setActive(c.slug)}
            className={cn("pill shrink-0 text-xs font-semibold", active === c.slug && "ring-2 ring-brand")}
          >
            {c.name}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        {shown} {shown === 1 ? "tool" : "tools"}
      </p>
    </div>
  );
}
