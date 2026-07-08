"use client";

import { Icon } from "@/components/ui/Icon";

/** No React state — avoids extra hydration work. Theme set by inline script in layout. */
export function ThemeToggle() {
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-lg border border-border transition-colors hover:bg-surface-2"
      onClick={() => {
        const root = document.documentElement;
        const next = !root.classList.contains("dark");
        root.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
    >
      <Icon name="Sun" className="hidden h-[18px] w-[18px] text-amber-400 dark:block" />
      <Icon name="Moon" className="h-[18px] w-[18px] text-brand dark:hidden" />
    </button>
  );
}

export const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':false;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
