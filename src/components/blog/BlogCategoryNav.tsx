import Link from "next/link";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { cn } from "@/lib/utils";

export function BlogCategoryNav({ active }: { active?: string }) {
  return (
    <nav aria-label="Blog categories" className="mt-8 flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={cn(
          "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
          !active
            ? "border-brand bg-brand/10 text-brand"
            : "border-border bg-surface text-muted hover:border-brand/40 hover:text-foreground",
        )}
      >
        All
      </Link>
      {BLOG_CATEGORIES.map((cat) => {
        const isActive = active === cat.slug;
        return (
          <Link
            key={cat.slug}
            href={`/blog?category=${cat.slug}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface text-muted hover:border-brand/40 hover:text-foreground",
            )}
          >
            {cat.name}
          </Link>
        );
      })}
    </nav>
  );
}
