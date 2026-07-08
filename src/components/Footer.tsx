import Link from "next/link";
import { CATEGORIES, TOTAL_TOOLS } from "@/lib/catalog";
import { site } from "@/lib/site";
import { messaging } from "@/lib/messaging";
import { SiteLogo } from "@/components/SiteLogo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <SiteLogo logoHeight={40} nameClassName="font-bold" />
            <p className="mt-2 max-w-xs text-sm text-muted">{site.description}</p>
            <p className="mt-3 text-sm font-medium text-muted">{messaging.footerNote}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {chunk(CATEGORIES, Math.ceil(CATEGORIES.length / 3)).map((group, i) => (
              <ul key={i} className="space-y-2 text-sm">
                {group.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/${c.slug}`} className="text-muted transition-colors hover:text-foreground">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {site.name}</p>
          <div className="flex items-center gap-5">
            <Link href="/tools" className="hover:text-foreground">All Tools</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/about" className="hover:text-foreground">About</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
