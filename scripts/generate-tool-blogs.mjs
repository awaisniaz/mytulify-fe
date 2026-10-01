import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_TOOLS, CATEGORIES, relatedTools, toolHref } from "../src/lib/catalog/index.ts";
import { blogCategoryForTool, semanticBlogMarkdown, semanticLead } from "../src/lib/seo/semantic-tool.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogDir = path.join(root, "content", "blog");
const coverDir = path.join(root, "public", "blog", "covers");

function yamlQuote(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseRelated(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { title: "", related: [] };
  let title = "";
  const related = [];
  let inRelated = false;
  for (const line of match[1].split(/\r?\n/)) {
    if (inRelated && /^\s+-\s+/.test(line)) {
      related.push(line.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    inRelated = false;
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    if (kv[1] === "title") title = kv[2].trim().replace(/^["']|["']$/g, "");
    if (kv[1] === "relatedToolSlugs") inRelated = true;
  }
  return { title, related };
}

function coversTool(postSlug, related, tool) {
  const key = `${tool.category}/${tool.slug}`;
  if (related[0] === key) return true;
  return postSlug.includes(tool.slug);
}

function hash(text) {
  let n = 0;
  for (const ch of text) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
  return n;
}

function wrap(text, max = 24) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function coverSvg(title, slug) {
  const n = hash(slug);
  const c1 = `hsl(${n % 360} 62% 42%)`;
  const c2 = `hsl(${(n + 48) % 360} 70% 32%)`;
  const lines = wrap(title);
  const start = 250 - (lines.length - 1) * 36;
  const text = lines
    .map((line, i) => {
      const safe = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<text x="80" y="${start + i * 72}" fill="#fff" font-family="Georgia, serif" font-size="54">${safe}</text>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  ${text}
  <text x="80" y="560" fill="#fff" fill-opacity="0.85" font-family="Georgia, serif" font-size="28">Mytulify</text>
</svg>
`;
}

function isGenerated(raw) {
  return raw.includes("publishedDate: 2026-10-01") && raw.includes("This guide explains that job");
}

const existing = new Map();
for (const file of readdirSync(blogDir)) {
  if (!file.endsWith(".md") || file.toLowerCase() === "readme.md") continue;
  const raw = readFileSync(path.join(blogDir, file), "utf8");
  if (isGenerated(raw)) continue;
  const slug = file.slice(0, -3);
  existing.set(slug, parseRelated(raw));
}

const guides = new Map();
for (const [postSlug, parsed] of existing) {
  for (const tool of ALL_TOOLS) {
    const key = `${tool.category}/${tool.slug}`;
    if (!coversTool(postSlug, parsed.related, tool)) continue;
    const current = guides.get(key);
    const better = postSlug.includes(tool.slug) && current && !current.slug.includes(tool.slug);
    if (!current || better) guides.set(key, { slug: postSlug, title: parsed.title || postSlug });
  }
}

mkdirSync(coverDir, { recursive: true });
const metaBySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));
let created = 0;

for (const tool of ALL_TOOLS) {
  const key = `${tool.category}/${tool.slug}`;
  if (guides.has(key)) continue;
  const primary = `${tool.slug}-guide`;
  const primaryPath = path.join(blogDir, `${primary}.md`);
  const postSlug =
    existsSync(primaryPath) && !isGenerated(readFileSync(primaryPath, "utf8"))
      ? `${tool.slug}-online-guide`
      : primary;
  const cat = metaBySlug.get(tool.category);
  const related = relatedTools(tool, 4).map((item) => ({
    name: item.name,
    href: toolHref(item),
    key: `${item.category}/${item.slug}`,
  }));
  const semantic = {
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    categorySlug: tool.category,
    categoryName: cat?.name ?? tool.category,
    tagline: cat?.tagline ?? cat?.description ?? "",
    clientSide: tool.clientSide,
    related: related.map(({ name, href }) => ({ name, href })),
  };
  const body = semanticBlogMarkdown(semantic);
  const title = `${tool.name}: ${tool.description.replace(/\.$/, "")}`.slice(0, 140);
  const excerpt = semanticLead(tool.name, tool.description);
  const category = blogCategoryForTool(tool.category, tool.name);
  const relatedKeys = [`${tool.category}/${tool.slug}`, ...related.map((item) => item.key)].slice(0, 4);
  const md = `---
title: ${yamlQuote(title)}
slug: ${postSlug}
category: ${category}
excerpt: ${yamlQuote(excerpt.slice(0, 220))}
publishedDate: 2026-10-01
updatedDate: 2026-10-01
featuredImage: /blog/covers/${postSlug}.svg
author: Mytulify Team
metaDescription: ${yamlQuote(excerpt.slice(0, 160))}
relatedToolSlugs:
${relatedKeys.map((item) => `  - ${item}`).join("\n")}
---

${body}`;
  writeFileSync(path.join(blogDir, `${postSlug}.md`), md);
  writeFileSync(path.join(coverDir, `${postSlug}.svg`), coverSvg(tool.name, postSlug));
  guides.set(key, { slug: postSlug, title });
  created += 1;
}

const entries = [...guides.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const source = `/** Built by scripts/generate-tool-blogs.mjs. Maps category/slug to the guide post. */
export const TOOL_GUIDES: Record<string, { slug: string; title: string }> = {
${entries
  .map(([key, guide]) => `  ${JSON.stringify(key)}: { slug: ${JSON.stringify(guide.slug)}, title: ${JSON.stringify(guide.title)} },`)
  .join("\n")}
};
`;
writeFileSync(path.join(root, "src", "lib", "blog", "tool-guides.generated.ts"), source);
console.log(`created ${created} guides, mapped ${guides.size} tools`);
