"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Tool } from "@/lib/catalog";

const SearchModal = dynamic(
  () => import("@/components/SearchModal").then((m) => m.SearchModal),
  { ssr: false },
);

const SideAdsMount = dynamic(
  () => import("@/components/ads/SideAdsMount").then((m) => m.SideAdsMount),
  { ssr: false, loading: () => null },
);

export type SearchTool = Tool & { categoryName: string };

export type SearchStrings = {
  placeholder: string;
  ariaLabel: string;
  trendingHint: string;
  noResults: string;
  resultsOne: string;
  resultsMany: string;
  clear: string;
  comingSoon: string;
};

/**
 * Loads after window load + idle — keeps search, ads, and heavy catalog off the critical path.
 */
export function LazyEnhancements({
  searchTools,
  searchStrings,
}: {
  searchTools: SearchTool[];
  searchStrings: SearchStrings;
}) {
  const [ready, setReady] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const activate = () => {
      const go = () => {
        setDesktop(window.matchMedia("(min-width: 1280px)").matches);
        setReady(true);
      };
      if (typeof window.requestIdleCallback === "function") {
        window.requestIdleCallback(go, { timeout: 8000 });
      } else {
        setTimeout(go, 2000);
      }
    };

    if (document.readyState === "complete") activate();
    else window.addEventListener("load", activate, { once: true });
  }, []);

  useEffect(() => {
    if (!ready) return;

    const openSearch = (e?: Event) => {
      e?.preventDefault();
      setSearchOpen(true);
    };

    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    }

    window.addEventListener("keydown", onKey);
    document.querySelectorAll("[data-open-search]").forEach((el) => {
      el.addEventListener("click", openSearch);
    });

    return () => window.removeEventListener("keydown", onKey);
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      {searchOpen && (
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          tools={searchTools}
          strings={searchStrings}
        />
      )}
      {desktop && <SideAdsMount />}
    </>
  );
}
