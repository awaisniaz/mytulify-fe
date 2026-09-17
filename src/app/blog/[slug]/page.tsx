import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { BlogCover } from "@/components/blog/BlogCover";
import { Icon } from "@/components/ui/Icon";
import { formatPostDate, getAllPosts, getBlogCategory, getPostBySlug } from "@/lib/blog";
import { getTool, getToolIcon, isToolAvailable, toolHref } from "@/lib/catalog";
import { site } from "@/lib/site";
import { englishOnlyPageMeta, clampMetaDescription } from "@/lib/seo";
import { getMetadataLocale } from "@/i18n/locale";
import { breadcrumbJsonLd } from "@/lib/aeo";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const locale = await getMetadataLocale(searchParams);
  const title = post.title;
  const description = clampMetaDescription(post.metaDescription || post.excerpt);
  const path = `/blog/${post.slug}`;
  const image = post.featuredImage.startsWith("http")
    ? post.featuredImage
    : `${site.url}${post.featuredImage}`;
  const meta = englishOnlyPageMeta(path, locale, {
    title: { absolute: `${title} | ${site.name} Blog` },
    description,
    socialTitle: `${title} · ${site.name}`,
  });
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      ...meta.twitter,
      images: [image],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();
  const category = getBlogCategory(post.category);

  const related = post.relatedToolSlugs
    .map((key) => {
      const [toolCategory, toolSlug] = key.split("/");
      return toolCategory && toolSlug ? getTool(toolCategory, toolSlug) : undefined;
    })
    .filter((t): t is NonNullable<typeof t> => t != null && isToolAvailable(t))
    .slice(0, 4);

  const url = `${site.url}/blog/${post.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.metaDescription || post.excerpt,
      image: post.featuredImage.startsWith("http")
        ? post.featuredImage
        : `${site.url}${post.featuredImage}`,
      datePublished: post.publishedDate,
      dateModified: post.updatedDate,
      articleSection: category?.name,
      author: { "@type": "Organization", name: post.author },
      publisher: {
        "@type": "Organization",
        name: site.name,
        logo: { "@type": "ImageObject", url: `${site.url}/logo.png` },
      },
      mainEntityOfPage: url,
    },
        breadcrumbJsonLd([
          { name: "Home", item: site.url },
          { name: "Blog", item: `${site.url}/blog` },
          ...(category
            ? [{ name: category.name, item: `${site.url}/blog?category=${category.slug}` }]
            : []),
          { name: post.title, item: url },
        ]),
  ];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <Icon name="ChevronRight" className="h-4 w-4" />
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        {category && (
          <>
            <Icon name="ChevronRight" className="h-4 w-4" />
            <Link href={`/blog?category=${category.slug}`} className="hover:text-foreground">{category.name}</Link>
          </>
        )}
        <Icon name="ChevronRight" className="h-4 w-4" />
        <span className="text-foreground line-clamp-1">{post.title}</span>
      </nav>

      <header>
        {category ? (
          <Link href={`/blog?category=${category.slug}`} className="section-label hover:text-brand">
            {category.name}
          </Link>
        ) : (
          <p className="section-label">Blog</p>
        )}
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{post.author}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedDate}>{formatPostDate(post.publishedDate)}</time>
          {post.updatedDate !== post.publishedDate && (
            <>
              <span aria-hidden>·</span>
              <span>Updated {formatPostDate(post.updatedDate)}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
      </header>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border">
        <BlogCover post={post} className="rounded-2xl" priority />
      </div>

      <div
        className="prose-blog mt-10"
        dangerouslySetInnerHTML={{ __html: post.html }}
      />

      <div className="mt-10 border-t border-border pt-6">
        <ShareButtons url={url} title={post.title} />
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold">Related tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((tool) => (
              <Link
                key={`${tool.category}/${tool.slug}`}
                href={toolHref(tool)}
                className="interactive-card flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Icon name={getToolIcon(tool)} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{tool.name}</span>
                  <span className="block truncate text-xs text-muted">{tool.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-center text-sm">
        <Link href="/blog" className="font-semibold text-brand hover:underline">
          ← All blog posts
        </Link>
      </p>
    </article>
  );
}
