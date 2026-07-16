# Blog posts

One Markdown file per post in this folder.

## Add a new post

1. Create `content/blog/your-post-slug.md`
2. Fill the frontmatter (YAML between `---` lines)
3. Write the body in Markdown
4. Deploy — `/blog`, `/blog/your-post-slug`, and `sitemap.xml` update automatically

## Frontmatter fields

```yaml
---
title: Post title for H1 and SEO
slug: your-post-slug
excerpt: 1–3 sentence summary for the blog index card.
publishedDate: 2026-07-16
updatedDate: 2026-07-16
featuredImage: /og-share.png
author: Mytulify Team
metaDescription: Unique meta description for search results (≈150–160 chars).
relatedToolSlugs:
  - seo-web-tools/utm-builder
  - calculators/emi-calculator
---
```

- `slug` should match the filename (without `.md`)
- `relatedToolSlugs` use `category/slug` keys from the catalog
- `featuredImage` is a path under `public/` (default `/og-share.png`)
- Sitemap `lastmod` uses `updatedDate`, then git history / file mtime of this `.md` file
