import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "content", "blog");
const COVER_DIR = path.join(ROOT, "public", "blog", "covers");

const THEMES = {
  "personal-finance": { from: "#0f766e", mid: "#0d9488", to: "#042f2e", accent: "#5eead4", label: "Personal Finance" },
  comparisons: { from: "#c2410c", mid: "#ea580c", to: "#431407", accent: "#fdba74", label: "Comparisons" },
  seo: { from: "#1d4ed8", mid: "#2563eb", to: "#1e3a8a", accent: "#93c5fd", label: "SEO" },
  "photos-design": { from: "#6d28d9", mid: "#7c3aed", to: "#4c1d95", accent: "#d8b4fe", label: "Photos & Design" },
  career: { from: "#be185d", mid: "#db2777", to: "#831843", accent: "#f9a8d4", label: "Career" },
  "ai-tech": { from: "#4f46e5", mid: "#6366f1", to: "#1e1b4b", accent: "#c7d2fe", label: "AI & Tech" },
};

function inferCategory(slug) {
  if (/(chatgpt|claude|gemini|copilot|cursor|midjourney|dalle|grammarly|elevenlabs|quillbot)/.test(slug)) {
    return "ai-tech";
  }
  if (slug.includes("-vs-")) return "comparisons";
  if (slug.includes("utm")) return "seo";
  if (slug.includes("photo") || slug.includes("aspect-ratio")) return "photos-design";
  if (slug.includes("cover-letter") || slug.includes("freelance-email")) return "career";
  return "personal-finance";
}

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapTitle(title, max = 28) {
  const words = title.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > max && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length === 2) {
      const rest = [cur, ...words.slice(words.indexOf(w) + 1)].join(" ");
      lines.push(rest.length > max ? `${rest.slice(0, max - 1)}…` : rest);
      return lines.slice(0, 3);
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function motif(category, h, accent) {
  const a = 40 + (h % 50);
  const b = 80 + ((h >> 5) % 70);
  if (category === "personal-finance") {
    return `
      <g fill="${accent}" opacity="0.22">
        <rect x="860" y="${430 - a}" width="44" height="${a + 40}" rx="8"/>
        <rect x="920" y="${380 - b}" width="44" height="${b + 90}" rx="8"/>
        <rect x="980" y="${340 - (h % 40)}" width="44" height="${180 + (h % 40)}" rx="8"/>
        <rect x="1040" y="300" width="44" height="220" rx="8"/>
      </g>
      <path d="M850 470 L910 ${420 - a / 2} L970 ${360 - b / 3} L1090 280" fill="none" stroke="${accent}" stroke-width="10" stroke-linecap="round" opacity="0.55"/>
      <circle cx="1090" cy="280" r="14" fill="${accent}" opacity="0.8"/>`;
  }
  if (category === "comparisons") {
    return `
      <g opacity="0.28" fill="${accent}">
        <rect x="820" y="180" width="150" height="280" rx="24"/>
        <rect x="1000" y="220" width="150" height="280" rx="24"/>
      </g>
      <text x="895" y="340" text-anchor="middle" fill="${accent}" font-size="42" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800" opacity="0.7">A</text>
      <text x="1075" y="380" text-anchor="middle" fill="${accent}" font-size="42" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800" opacity="0.7">B</text>
      <text x="990" y="360" text-anchor="middle" fill="${accent}" font-size="28" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700" opacity="0.85">VS</text>`;
  }
  if (category === "seo") {
    return `
      <g fill="none" stroke="${accent}" stroke-width="14" opacity="0.45">
        <circle cx="980" cy="280" r="86"/>
        <line x1="1044" y1="344" x2="1120" y2="430" stroke-linecap="round"/>
      </g>
      <path d="M820 500 H1140" stroke="${accent}" stroke-width="8" opacity="0.25"/>
      <rect x="840" y="470" width="${80 + (h % 90)}" height="12" rx="6" fill="${accent}" opacity="0.4"/>
      <rect x="840" y="500" width="${140 + (h % 60)}" height="12" rx="6" fill="${accent}" opacity="0.28"/>`;
  }
  if (category === "photos-design") {
    return `
      <g opacity="0.35">
        <rect x="820" y="190" width="220" height="160" rx="16" fill="none" stroke="${accent}" stroke-width="12"/>
        <rect x="900" y="270" width="220" height="160" rx="16" fill="${accent}" opacity="0.25"/>
        <circle cx="880" cy="250" r="18" fill="${accent}"/>
        <polygon points="860,330 910,280 970,340 1020,300 1080,360 860,360" fill="${accent}" opacity="0.5"/>
      </g>`;
  }
  if (category === "ai-tech") {
    return `
      <g opacity="0.4" fill="none" stroke="${accent}" stroke-width="10">
        <rect x="860" y="210" width="260" height="150" rx="28"/>
        <path d="M920 360 L900 410 L960 360"/>
      </g>
      <circle cx="920" cy="270" r="10" fill="${accent}" opacity="0.7"/>
      <circle cx="960" cy="270" r="10" fill="${accent}" opacity="0.7"/>
      <circle cx="1000" cy="270" r="10" fill="${accent}" opacity="0.7"/>
      <text x="990" y="480" text-anchor="middle" fill="${accent}" font-size="28" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800" opacity="0.75">VS</text>`;
  }
  return `
    <g opacity="0.35" fill="${accent}">
      <rect x="880" y="200" width="240" height="300" rx="18"/>
      <rect x="910" y="250" width="180" height="16" rx="8" fill="#fff" opacity="0.35"/>
      <rect x="910" y="286" width="150" height="12" rx="6" fill="#fff" opacity="0.25"/>
      <rect x="910" y="318" width="170" height="12" rx="6" fill="#fff" opacity="0.2"/>
      <rect x="910" y="350" width="120" height="12" rx="6" fill="#fff" opacity="0.2"/>
    </g>`;
}

function svgFor({ title, slug, category }) {
  const theme = THEMES[category] ?? THEMES["personal-finance"];
  const h = hash(slug);
  const cx = 200 + (h % 400);
  const cy = 90 + ((h >>> 8) % 200);
  const r = 160 + (h % 80);
  const lines = wrapTitle(title);
  const lineStart = 250 - (lines.length - 1) * 28;
  const text = lines
    .map(
      (line, i) =>
        `<text x="72" y="${lineStart + i * 58}" fill="#fff" font-size="46" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="800">${esc(line)}</text>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${esc(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.from}"/>
      <stop offset="55%" stop-color="${theme.mid}"/>
      <stop offset="100%" stop-color="${theme.to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${theme.accent}" opacity="0.12"/>
  <circle cx="${1000 - (h % 120)}" cy="${480 - ((h >>> 3) % 80)}" r="${90 + (h % 50)}" fill="#000" opacity="0.18"/>
  ${motif(category, h, theme.accent)}
  <rect x="72" y="72" width="8" height="48" rx="4" fill="${theme.accent}"/>
  <text x="92" y="106" fill="${theme.accent}" font-size="22" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="700" letter-spacing="2">${esc(theme.label.toUpperCase())}</text>
  ${text}
  <text x="72" y="560" fill="#fff" opacity="0.7" font-size="22" font-family="ui-sans-serif,system-ui,sans-serif" font-weight="600">Mytulify Blog</text>
</svg>
`;
}

function patchFrontmatter(raw, { category, featuredImage }) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return raw;
  let fm = match[1];
  if (/^category:/m.test(fm)) {
    fm = fm.replace(/^category:.*$/m, `category: ${category}`);
  } else {
    fm = fm.replace(/^(slug:.*)$/m, `$1\ncategory: ${category}`);
  }
  if (/^featuredImage:/m.test(fm)) {
    fm = fm.replace(/^featuredImage:.*$/m, `featuredImage: ${featuredImage}`);
  } else {
    fm = fm.replace(/^(category:.*)$/m, `$1\nfeaturedImage: ${featuredImage}`);
  }
  return `---\n${fm}\n---\n${match[2]}`;
}

mkdirSync(COVER_DIR, { recursive: true });

const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md");
for (const file of files) {
  const abs = path.join(BLOG_DIR, file);
  const raw = readFileSync(abs, "utf8");
  const slug = file.replace(/\.md$/, "");
  const titleMatch = raw.match(/^title:\s*(.+)$/m);
  const title = (titleMatch?.[1] ?? slug).replace(/^["']|["']$/g, "");
  const category = inferCategory(slug);
  const featuredImage = `/blog/covers/${slug}.svg`;
  writeFileSync(path.join(COVER_DIR, `${slug}.svg`), svgFor({ title, slug, category }));
  writeFileSync(abs, patchFrontmatter(raw, { category, featuredImage }));
  console.log(`✓ ${slug} [${category}]`);
}

console.log(`\nUpdated ${files.length} posts + covers`);
