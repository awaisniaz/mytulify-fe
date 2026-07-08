import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/catalog/nav";
import { site } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";

/** Fully server-rendered — search/theme need no React hydration. */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface lg:bg-surface/90 lg:backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-amber-500 text-white shadow-sm">
            <Icon name="Wand2" className="h-4 w-4" />
          </span>
          <span>{site.name}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors group-hover:bg-brand/10 group-hover:text-brand group-focus-within:bg-brand/10 group-focus-within:text-brand"
            >
              Categories
              <Icon name="ChevronDown" className="h-4 w-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
            </button>
            <div className="pointer-events-none absolute left-0 top-full w-[620px] -translate-y-1 pt-2 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-2 shadow-xl">
                {NAV_CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/${c.slug}`}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-2"
                  >
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-white", c.gradient)}>
                      <Icon name={c.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{c.name}</span>
                      <span className="block text-xs text-muted">{c.toolCount} tools</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/tools" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground">
            All Tools
          </Link>
          <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand">
            Pricing
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/tools"
            data-open-search
            className="hidden items-center gap-2 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-brand hover:text-brand sm:flex"
          >
            <Icon name="Search" className="h-4 w-4" />
            Search
            <kbd className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold">⌘K</kbd>
          </Link>
          <Link
            href="/tools"
            data-open-search
            aria-label="Search"
            className="grid h-9 w-9 place-items-center rounded-xl border-2 border-border sm:hidden"
          >
            <Icon name="Search" className="h-4 w-4" />
          </Link>
          <ThemeToggleButton />
          <UserMenu />
          <details className="group relative lg:hidden">
            <summary
              aria-label="Menu"
              className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl border-2 border-border [&::-webkit-details-marker]:hidden"
            >
              <Icon name="Menu" className="h-5 w-5 group-open:hidden" />
              <Icon name="X" className="hidden h-5 w-5 group-open:block" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[75vh] w-[min(100vw-2rem,320px)] overflow-y-auto rounded-2xl border border-border bg-surface p-2 shadow-xl">
              <Link href="/tools" className="block rounded-xl p-3 font-bold hover:bg-surface-2">
                All Tools
              </Link>
              <Link href="/pricing" className="block rounded-xl p-3 font-bold hover:bg-surface-2">
                Pricing
              </Link>
              {NAV_CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/${c.slug}`} className="flex items-center gap-3 rounded-xl p-3 hover:bg-surface-2">
                  <span className={cn("grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br text-white", c.gradient)}>
                    <Icon name={c.icon} className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-semibold">{c.name}</span>
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
