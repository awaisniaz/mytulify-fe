"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ALL_TOOLS, CATEGORIES, TOTAL_TOOLS, getCategory } from "@/lib/catalog";
import { ToolCard } from "@/components/cards";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function AllToolsBrowser() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [active, setActive] = useState<string>("all");

  const tools = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ALL_TOOLS.filter((t) => {
      if (active !== "all" && t.category !== active) return false;
      if (!query) return true;
      return (
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.slug.replace(/-/g, " ").includes(query)
      );
    });
  }, [q, active]);

  return (
    <div>
      <div className="input-glow glass flex items-center gap-2 rounded-2xl p-2 shadow-sm">
        <Icon name="Search" className="ml-2 h-5 w-5 shrink-0 text-brand" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search all ${TOTAL_TOOLS}+ tools…`}
          className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="mr-1 grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Clear search"
          >
            <Icon name="X" className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Chip active={active === "all"} onClick={() => setActive("all")}>
          All ({ALL_TOOLS.length})
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.slug} active={active === c.slug} onClick={() => setActive(c.slug)} icon={c.icon}>
            {c.name}
          </Chip>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        <span className="font-medium text-foreground">{tools.length}</span> tool{tools.length !== 1 ? "s" : ""}
        {q && <> matching &ldquo;{q}&rdquo;</>}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((t) => (
          <ToolCard key={`${t.category}/${t.slug}`} tool={t} icon={getCategory(t.category!)?.icon} />
        ))}
      </div>

      {tools.length === 0 && (
        <div className="mt-4 grid animate-fade-up place-items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-2 p-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand">
            <Icon name="Search" className="h-7 w-7" />
          </span>
          <p className="font-medium">No tools found</p>
          <p className="max-w-sm text-sm text-muted">Try a different keyword or clear the category filter.</p>
          <button
            type="button"
            onClick={() => { setQ(""); setActive("all"); }}
            className="mt-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
        active
          ? "border-transparent bg-gradient-to-r from-brand to-brand-2 text-white shadow-lg shadow-brand/30"
          : "glass border-border text-foreground hover:border-brand/30 hover:shadow-md",
      )}
    >
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {children}
    </button>
  );
}
