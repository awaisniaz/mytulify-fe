"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { toolHref, getToolIcon, getToolIconPresentation, isToolAvailable } from "@/lib/catalog";
import type { SearchStrings, SearchTool } from "@/components/LazyEnhancements";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  tools: SearchTool[];
  strings: SearchStrings;
};

export function SearchModal({ open, onClose, tools, strings }: Props) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: ["name", "description", "slug", "categoryName"],
        threshold: 0.4,
      }),
    [tools],
  );

  const results = useMemo(() => {
    if (!q.trim()) return tools.filter((t) => t.searchVolume === "high").slice(0, 8);
    return fuse.search(q).slice(0, 10).map((r) => r.item);
  }, [q, fuse, tools]);

  const resultsLabel = q.trim()
    ? results.length === 1
      ? strings.resultsOne
      : strings.resultsMany.replace("{n}", String(results.length))
    : strings.trendingHint;

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === "Enter" && results[active]) {
        router.push(toolHref(results[active]));
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] sm:pt-[12vh]">
      <div
        className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={strings.ariaLabel}
        className="glass gradient-border relative w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl shadow-brand/20 animate-scale-in"
      >
        <div className="input-glow flex items-center gap-3 border-b border-border px-4">
          <Icon name="Search" className="h-5 w-5 shrink-0 text-brand" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder={strings.placeholder}
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              aria-label={strings.clear}
            >
              <Icon name="X" className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 text-xs text-muted sm:block">
            ESC
          </kbd>
        </div>

        <div className="border-b border-border px-4 py-2 text-xs text-muted">{resultsLabel}</div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="grid place-items-center gap-2 p-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-muted">
                <Icon name="Search" className="h-6 w-6" />
              </span>
              <p className="text-sm text-muted">{strings.noResults.replace("{q}", q)}</p>
            </div>
          )}
          {results.map((t, i) => {
            const present = getToolIconPresentation(t);
            const selected = i === active;
            const soon = !isToolAvailable(t);
            return (
              <Link
                key={`${t.category}/${t.slug}`}
                href={toolHref(t)}
                data-index={i}
                onClick={onClose}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                  selected
                    ? "bg-gradient-to-r from-brand/15 to-brand-2/10 ring-1 ring-brand/25"
                    : "hover:bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "relative grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 transition-transform",
                    present.bg,
                    present.ring,
                    selected && "scale-105",
                  )}
                >
                  <Icon name={getToolIcon(t)} className={cn("h-4 w-4", present.fg)} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="block truncate font-medium">{t.name}</span>
                    {soon ? (
                      <span className="shrink-0 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">
                        {strings.comingSoon}
                      </span>
                    ) : (
                      <span className="hidden truncate text-xs text-muted sm:inline">{t.categoryName}</span>
                    )}
                  </span>
                  <span className="block truncate text-xs text-muted">{t.description}</span>
                </span>
                <Icon
                  name="ArrowRight"
                  className={cn(
                    "ml-auto h-4 w-4 shrink-0 transition-all",
                    selected ? "translate-x-0 text-brand" : "text-muted",
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
