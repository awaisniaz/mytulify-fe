/**
 * Duplicate tool URLs → single canonical path.
 * Source of the non-canonical URL 301s to the canonical (single hop).
 *
 * Format: "fromCategory/slug" → "toCategory/slug"
 */
export const TOOL_CANONICAL_REDIRECTS: Readonly<Record<string, string>> = {
  "converters-generators/base64-encoder-decoder": "developer-tools/base64-encoder-decoder",
  "developer-tools/box-shadow-generator": "color-tools/box-shadow-generator",
  "converters-generators/case-converter": "text-tools/case-converter",
  "seo-web-tools/character-counter": "text-tools/character-counter",
  "developer-tools/color-picker": "color-tools/color-picker",
  "converters-generators/cron-expression-generator": "developer-tools/cron-expression-generator",
  "converters-generators/csv-to-json": "developer-tools/csv-to-json",
  "seo-web-tools/favicon-generator": "image-tools/favicon-generator",
  "unit-converters/hex-to-rgb-converter": "developer-tools/hex-to-rgb-converter",
  "converters-generators/json-formatter": "developer-tools/json-formatter",
  "converters-generators/json-to-csv": "developer-tools/json-to-csv",
  "converters-generators/json-to-yaml": "developer-tools/json-to-yaml",
  "converters-generators/jwt-decoder": "developer-tools/jwt-decoder",
  "converters-generators/lorem-ipsum-generator": "text-tools/lorem-ipsum-generator",
  "developer-tools/meta-tag-generator": "seo-web-tools/meta-tag-generator",
  "converters-generators/number-base-converter": "developer-tools/number-base-converter",
  "converters-generators/password-generator": "security-password-tools/password-generator",
  "converters-generators/qr-code-generator": "developer-tools/qr-code-generator",
  "converters-generators/random-number-generator": "calculators/random-number-generator",
  "converters-generators/regex-tester": "developer-tools/regex-tester",
  "devops-tools/robots-txt-generator": "seo-web-tools/robots-txt-generator",
  "social-media-tools/strikethrough-text-generator": "text-tools/strikethrough-text-generator",
  "seo-web-tools/text-diff-checker": "text-tools/text-diff-checker",
  "converters-generators/text-to-slug": "text-tools/text-to-slug",
  "converters-generators/timestamp-converter": "developer-tools/timestamp-converter",
  "social-media-tools/upside-down-text-generator": "text-tools/upside-down-text-generator",
  "seo-web-tools/url-encoder-decoder": "developer-tools/url-encoder-decoder",
  "converters-generators/uuid-generator": "developer-tools/uuid-generator",
  "seo-web-tools/word-counter": "text-tools/word-counter",
};

/** Next.js redirect entries (source path → destination path). */
export function toolRedirectEntries(): { source: string; destination: string; permanent: true }[] {
  return Object.entries(TOOL_CANONICAL_REDIRECTS).map(([from, to]) => ({
    source: `/${from}`,
    destination: `/${to}`,
    permanent: true,
  }));
}

/** True if this category/slug pair is a non-canonical duplicate (should not exist in catalog). */
export function isNonCanonicalToolPath(category: string, slug: string): boolean {
  return Boolean(TOOL_CANONICAL_REDIRECTS[`${category}/${slug}`]);
}
