/** Category hero / card artwork paths (right-side faded images). */
export function categoryArtSrc(slug: string): string {
  return `/categories/${slug}.svg`;
}

export function categoryArtExists(slug: string): boolean {
  return CATEGORY_ART_SLUGS.has(slug);
}

const CATEGORY_ART_SLUGS = new Set([
  "ai-tools",
  "handwriting-ocr",
  "freelancer-tools",
  "devops-tools",
  "health-tools",
  "text-tools",
  "developer-tools",
  "security-password-tools",
  "pdf-tools",
  "image-tools",
  "color-tools",
  "calculators",
  "unit-converters",
  "seo-web-tools",
  "social-media-tools",
  "content-creator-tools",
  "converters-generators",
]);
