import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { formatPostDate, getBlogCategory } from "@/lib/blog";
import { BlogCover } from "@/components/blog/BlogCover";
import { Icon } from "@/components/ui/Icon";

export function BlogCard({ post }: { post: BlogPost }) {
  const category = getBlogCategory(post.category);

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="interactive-card group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="absolute left-0 top-3 bottom-3 z-10 w-1 rounded-full bg-gradient-to-b from-brand to-brand-2" />
      <BlogCover post={post} />
      <div className="flex flex-1 flex-col gap-2 p-4 pl-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
          {category && (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">
                <Icon name={category.icon} className="h-3 w-3" />
                {category.name}
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <time dateTime={post.publishedDate}>{formatPostDate(post.publishedDate)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Icon name="Clock" className="h-3.5 w-3.5" />
            {post.readingMinutes} min read
          </span>
        </div>
        <h2 className="text-lg font-semibold leading-snug group-hover:text-brand">{post.title}</h2>
        <p className="line-clamp-3 text-sm text-muted">{post.excerpt}</p>
      </div>
    </Link>
  );
}
