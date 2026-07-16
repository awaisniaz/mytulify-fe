import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blog";
import { formatPostDate } from "@/lib/blog";
import { Icon } from "@/components/ui/Icon";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="interactive-card group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="absolute left-0 top-3 bottom-3 z-10 w-1 rounded-full bg-gradient-to-b from-brand to-brand-2" />
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2">
        <Image
          src={post.featuredImage}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 pl-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted">
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
