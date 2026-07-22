import type { Metadata } from "next";
import { BlogCard } from "@/components/blog/BlogCard";
import { getAllPosts } from "@/lib/blog";
import { site } from "@/lib/site";
import { socialMeta, pageAlternates } from "@/lib/seo";
import { getLocale } from "@/i18n/locale";
import { TOTAL_TOOLS } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const description = `Guides and tips for using ${site.name}'s ${TOTAL_TOOLS}+ free online tools — SEO, calculators, PDF, images, and more.`;
  return {
    title: "Blog",
    description,
    ...pageAlternates("/blog", locale),
    robots: { index: true, follow: true },
    ...socialMeta({
      title: `Blog · ${site.name}`,
      description,
      url: "/blog",
      locale,
    }),
  };
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <p className="section-label">Blog</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Guides for {TOTAL_TOOLS}+ tools
        </h1>
        <p className="mt-3 text-muted">
          Practical how-tos on SEO, finance calculators, image formats, and more — written by the {site.name} team.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="mt-12 text-muted">No posts yet. Check back soon.</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
