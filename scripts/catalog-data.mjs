/** Shared catalog loader for i18n scripts (mirrors src/lib/catalog/index.ts). */
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const META = {
  "ai-tools": { tagline: "AI assistants for developers" },
  "handwriting-ocr": { tagline: "Handwriting to text in 30+ languages" },
  "devops-tools": { tagline: "Configs, manifests & scripts" },
  "health-tools": { tagline: "Fitness, nutrition & wellbeing" },
  "text-tools": { tagline: "Write, clean & transform text" },
  "developer-tools": { tagline: "Format, convert & debug code" },
  "security-password-tools": { tagline: "Passwords, hashing & crypto" },
  "pdf-tools": { tagline: "Merge, split & convert PDFs" },
  "image-tools": { tagline: "Resize, compress & convert images" },
  "color-tools": { tagline: "Pick, convert & build palettes" },
  calculators: { tagline: "Finance, health & math" },
  "unit-converters": { tagline: "Convert any unit instantly" },
  "seo-web-tools": { tagline: "On-page & technical SEO" },
  "social-media-tools": { tagline: "Captions, fonts & mockups" },
  "converters-generators": { tagline: "Data converters & generators" },
};

export function loadCatalog() {
  const dir = join(root, "src/lib/catalog/categories");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const categories = files.map((f) => {
    const c = JSON.parse(readFileSync(join(dir, f), "utf8"));
    const tagline = META[c.slug]?.tagline ?? c.description;
    return {
      slug: c.slug,
      name: c.name,
      description: c.description,
      tagline,
      tools: c.tools.map((t) => ({
        key: `${c.slug}/${t.slug}`,
        slug: t.slug,
        category: c.slug,
        name: t.name,
        description: t.description,
        clientSide: t.clientSide ?? true,
      })),
    };
  });
  return categories;
}

export function toolKey(category, slug) {
  return `${category}/${slug}`;
}
