import type { BlogPost } from "@/lib/blog";
import { cn } from "@/lib/utils";

/** Topic-specific 16:9 cover (unique SVG per post). */
export function BlogCover({
  post,
  className,
  priority = false,
}: {
  post: Pick<BlogPost, "title" | "featuredImage">;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("relative aspect-[16/9] w-full overflow-hidden bg-surface-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- unique SVG covers; next/image does not optimize SVG */}
      <img
        src={post.featuredImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        {...(priority ? { fetchPriority: "high" as const } : {})}
      />
      <span className="sr-only">{post.title}</span>
    </div>
  );
}
