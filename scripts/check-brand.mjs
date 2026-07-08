#!/usr/bin/env node
/**
 * Fails if old Toolverse / ToolStack / tools-hub branding remains in source files.
 * Run: npm run brand:check
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const root = join(import.meta.dirname, "..");
const SKIP = new Set(["node_modules", ".next", "dist", ".git", "tsconfig.tsbuildinfo"]);
const EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".env", ".example"]);

const PATTERNS = [
  { re: /toolverse/i, label: "toolverse" },
  { re: /\btools-hub\b/, label: "tools-hub" },
  { re: /toolverse\.app/i, label: "toolverse.app" },
  { re: /toolstack/i, label: "toolstack" },
  { re: /toolstack\.app/i, label: "toolstack.app" },
  { re: /\btv_pro_/, label: "tv_pro_ (old license prefix)" },
  { re: /\bts_pro_/, label: "ts_pro_ (old license prefix)" },
  { re: /toolverse_pro_key/, label: "toolverse_pro_key (except legacy migration)" },
  { re: /toolstack_pro_key/, label: "toolstack_pro_key (except legacy migration)" },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if ([...EXT].some((e) => name.endsWith(e) || name === ".env.local")) out.push(p);
  }
  return out;
}

const hits = [];
for (const file of walk(root)) {
  if (file.includes("node_modules")) continue;
  const rel = file.slice(root.length + 1);
  if (rel === "src/lib/brand.ts") continue; // legacy key names for migration
  if (rel.startsWith("scripts/check-brand.mjs")) continue;
  const text = readFileSync(file, "utf8");
  for (const { re, label } of PATTERNS) {
    if (re.test(text)) hits.push({ file: rel, label });
  }
}

if (hits.length) {
  console.error("\n❌ Brand sync check failed:\n");
  for (const h of hits) console.error(`  • ${h.label} in ${h.file}`);
  console.error("\nFix these before deploy.\n");
  process.exit(1);
}

console.log("✓ Brand sync OK — no legacy branding leftovers in source.");
