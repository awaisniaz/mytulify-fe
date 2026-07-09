import type { Tool } from "./types";

export type ToolIconPresentation = {
  bg: string;
  fg: string;
  ring: string;
  badge: string;
};

/** Asli Tools–style colored icon tile by tool type (PDF / IMG / GIF / …). */
export function getToolIconPresentation(tool: Pick<Tool, "slug" | "category">): ToolIconPresentation {
  const s = tool.slug;
  const cat = tool.category ?? "";

  if (/gif/.test(s)) {
    return { bg: "bg-fuchsia-500/12", fg: "text-fuchsia-600 dark:text-fuchsia-400", ring: "ring-fuchsia-500/15", badge: "GIF" };
  }
  if (/pdf|word-to|excel-to|epub|cbz|txt-to|csv-to-pdf|bank-statement|document-to/.test(s)) {
    return { bg: "bg-red-500/12", fg: "text-red-600 dark:text-red-400", ring: "ring-red-500/15", badge: "PDF" };
  }
  if (/jpg|jpeg|png|webp|heic|avif|jfif|bmp|svg|ico|favicon|meme|crop|resize-image|compress-image|rotate-image|flip-image|collage|passport|watermark-to-image|image-|color-extract|grayscale|blur-image|pixelate|circle-crop|combine-images/.test(s) || cat === "image-tools") {
    return { bg: "bg-emerald-500/12", fg: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/15", badge: "IMG" };
  }
  if (/qr|barcode|uuid|hash|password|encrypt|decrypt|jwt|token|cipher|hmac|ssl|vpn|security/.test(s) || cat === "security-password-tools") {
    return { bg: "bg-rose-500/12", fg: "text-rose-600 dark:text-rose-400", ring: "ring-rose-500/15", badge: "SEC" };
  }
  if (/json|csv|xml|yaml|sql|base64|regex|code|developer|gitignore|cron|timestamp|api|docker|kubernetes|nginx|devops|markdown|minif|formatter|converter|typescript|mock-data|iban|invoice/.test(s) || cat === "developer-tools" || cat === "converters-generators" || cat === "devops-tools") {
    return { bg: "bg-violet-500/12", fg: "text-violet-600 dark:text-violet-400", ring: "ring-violet-500/15", badge: "DEV" };
  }
  if (/seo|meta|robot|sitemap|schema|utm|canonical|hreflang|keyword|serp|open-graph|twitter-card|llms|ads-txt|domain-name|favicon-gen|readability|htaccess|redirect/.test(s) || cat === "seo-web-tools") {
    return { bg: "bg-lime-500/12", fg: "text-lime-700 dark:text-lime-400", ring: "ring-lime-500/15", badge: "SEO" };
  }
  if (/social|hashtag|caption|tweet|instagram|facebook|font|fancy|cursive|mockup|emoji|thread|bio/.test(s) || cat === "social-media-tools") {
    return { bg: "bg-pink-500/12", fg: "text-pink-600 dark:text-pink-400", ring: "ring-pink-500/15", badge: "SOC" };
  }
  if (/calculator|zakat|tasbih|tax|salary|loan|mortgage|bmi|bmr|tdee|calorie|gpa|grade|fraction|scientific|percentage|tip|discount|age-|date-|countdown|paycheck|sleep|interest|tax|afghan|bank-statement/.test(s) || cat === "calculators" || cat === "health-tools") {
    return { bg: "bg-sky-500/12", fg: "text-sky-600 dark:text-sky-400", ring: "ring-sky-500/15", badge: "CALC" };
  }
  if (/convert|unit|meter|mile|kg|pound|celsius|fahrenheit|liter|gallon|timezone|time-zone|ruler|length|weight|temperature|volume|speed|pressure|energy|data-size|angle|fuel/.test(s) || cat === "unit-converters") {
    return { bg: "bg-indigo-500/12", fg: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/15", badge: "UNIT" };
  }
  if (/color|hex|rgb|hsl|cmyk|palette|gradient|picker|contrast|shadow|wheel/.test(s) || cat === "color-tools") {
    return { bg: "bg-amber-500/12", fg: "text-amber-700 dark:text-amber-400", ring: "ring-amber-500/15", badge: "CLR" };
  }
  if (/text|word|character|case|lorem|diff|morse|plagiarism|readability|line-|sentence|paragraph|slug|strip|html-tag|unicode|bold-text|italic/.test(s) || cat === "text-tools") {
    return { bg: "bg-blue-500/12", fg: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/15", badge: "TXT" };
  }
  if (/ai-|explainer|ocr|handwriting|generator|assistant|review|diagnos|commit-message|readme|test-case|sql-query|regex-gen|docker-compose|cron-expl/.test(s) || cat === "ai-tools" || cat === "handwriting-ocr") {
    return { bg: "bg-indigo-500/12", fg: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/15", badge: "AI" };
  }
  return { bg: "bg-orange-500/12", fg: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500/15", badge: "TOOL" };
}

export const TOOL_BADGE_BG: Record<string, string> = {
  PDF: "bg-red-500",
  IMG: "bg-emerald-500",
  GIF: "bg-fuchsia-500",
  SEC: "bg-rose-500",
  DEV: "bg-violet-500",
  SEO: "bg-lime-600",
  SOC: "bg-pink-500",
  CALC: "bg-sky-500",
  UNIT: "bg-indigo-500",
  CLR: "bg-amber-500",
  TXT: "bg-blue-500",
  AI: "bg-indigo-600",
  TOOL: "bg-orange-500",
};
