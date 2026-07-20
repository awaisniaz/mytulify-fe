#!/usr/bin/env node
/**
 * Translate content locales via Groq (OpenAI-compatible).
 * Supports resume from *.partial.json checkpoints.
 * Usage: node --env-file=.env scripts/generate-i18n-content-groq.mjs --locale=es,pt
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/i18n/content/locales");
const enPath = join(outDir, "en.json");

const LOCALE_NAMES = {
  fr: "French",
  de: "German",
  ur: "Urdu",
  es: "Spanish",
  pt: "Portuguese",
  hi: "Hindi",
  ar: "Arabic",
};

const args = process.argv.slice(2);
const locales = (args.find((a) => a.startsWith("--locale="))?.slice(9) ?? "fr,de")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const keys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
if (!keys.length) {
  console.error("GROQ_API_KEYS required");
  process.exit(1);
}

let keyIndex = 0;
function client() {
  const apiKey = keys[keyIndex % keys.length];
  keyIndex += 1;
  return new OpenAI({ apiKey, baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1" });
}

const model = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

const SYSTEM = `You translate website JSON from English. Rules:
- Keep all JSON keys unchanged
- Keep placeholders like {name} {n} {desc} {descClause} {limit} {total} {client} {cats} {count} {ai} {aiLimit} {year} exactly
- Keep brand names Mytulify and Pro untranslated
- Return ONLY valid JSON matching the input shape (no markdown)`;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseRetryMs(message) {
  const m = String(message).match(/try again in (\d+)m([\d.]+)s/i);
  if (m) return (Number(m[1]) * 60 + Number(m[2])) * 1000 + 2000;
  const s = String(message).match(/try again in ([\d.]+)s/i);
  if (s) return Number(s[1]) * 1000 + 2000;
  return null;
}

async function translateJson(obj, locale, label) {
  const lang = LOCALE_NAMES[locale] || locale;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const openai = client();
      const res = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Translate all string values to ${lang} (${locale}) — ${label}:\n${JSON.stringify(obj)}`,
          },
        ],
      });
      const text = res.choices[0]?.message?.content;
      if (!text) throw new Error("empty");
      return JSON.parse(text);
    } catch (e) {
      const msg = e.message || String(e);
      const parsed = parseRetryMs(msg);
      const wait = parsed ?? Math.min(120_000, 3000 * (attempt + 1));
      console.warn(`  retry ${attempt + 1} ${label}: waiting ${Math.ceil(wait / 1000)}s — ${msg.slice(0, 120)}`);
      await sleep(wait);
    }
  }
  throw new Error(`Failed translating ${label}`);
}

function chunkEntries(entries, size) {
  const out = [];
  for (let i = 0; i < entries.length; i += size) out.push(entries.slice(i, i + size));
  return out;
}

function checkpointPath(locale) {
  return join(outDir, `${locale}.partial.json`);
}

function saveCheckpoint(locale, out) {
  writeFileSync(checkpointPath(locale), JSON.stringify(out, null, 2) + "\n");
}

function loadCheckpoint(locale) {
  const p = checkpointPath(locale);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

async function translateLocale(en, locale) {
  const existing = loadCheckpoint(locale);
  const out = existing ?? { categories: {}, tools: {}, strings: null };

  if (!out.strings) {
    console.log(`  strings…`);
    out.strings = await translateJson(en.strings, locale, "UI strings");
    saveCheckpoint(locale, out);
    await sleep(500);
  } else {
    console.log(`  strings… (resume)`);
  }

  const catKeys = Object.keys(en.categories);
  const missingCats = catKeys.filter((k) => !out.categories?.[k]?.name);
  if (missingCats.length) {
    console.log(`  categories… (${missingCats.length} left)`);
    for (const batch of chunkEntries(missingCats, 4)) {
      const chunk = Object.fromEntries(batch.map((k) => [k, en.categories[k]]));
      const tr = await translateJson({ categories: chunk }, locale, `cats ${batch.join(",")}`);
      Object.assign(out.categories, tr.categories ?? tr);
      saveCheckpoint(locale, out);
      await sleep(500);
    }
  } else {
    console.log(`  categories… (resume)`);
  }

  const toolKeys = Object.keys(en.tools);
  const missingTools = toolKeys.filter((k) => !out.tools?.[k]?.name);
  console.log(`  tools (${toolKeys.length}, ${missingTools.length} left)…`);
  let done = toolKeys.length - missingTools.length;
  for (const batch of chunkEntries(missingTools, 10)) {
    const chunk = Object.fromEntries(
      batch.map((k) => {
        const t = en.tools[k];
        return [k, { name: t.name, description: t.description }];
      }),
    );
    const tr = await translateJson({ tools: chunk }, locale, `tools ${done}`);
    const tools = tr.tools ?? tr;
    for (const k of batch) {
      const hit = tools[k];
      out.tools[k] = {
        name: hit?.name ?? en.tools[k].name,
        description: hit?.description ?? en.tools[k].description,
      };
    }
    done += batch.length;
    saveCheckpoint(locale, out);
    process.stdout.write(`\r  tools ${done}/${toolKeys.length}`);
    await sleep(600);
  }
  console.log("");
  return out;
}

function looksTranslated(tr, en) {
  const a = tr.categories?.["ai-tools"]?.name;
  const b = en.categories?.["ai-tools"]?.name;
  return Boolean(a && b && a !== b);
}

async function main() {
  if (!existsSync(enPath)) {
    console.error("Missing en.json");
    process.exit(1);
  }
  const en = JSON.parse(readFileSync(enPath, "utf8"));
  console.log(`Source en: ${Object.keys(en.tools).length} tools, model=${model}, keys=${keys.length}`);

  for (const locale of locales) {
    if (locale === "en") continue;
    console.log(`\nTranslating ${locale} (${LOCALE_NAMES[locale] || locale})`);
    const translated = await translateLocale(en, locale);
    if (!looksTranslated(translated, en)) {
      console.error(`✗ ${locale} looks untranslated — abort write`);
      continue;
    }
    const outPath = join(outDir, `${locale}.json`);
    writeFileSync(outPath, JSON.stringify(translated, null, 2) + "\n");
    const partial = checkpointPath(locale);
    if (existsSync(partial)) unlinkSync(partial);
    console.log(`✓ ${locale} → ${outPath}`);
  }
  console.log("\nDone");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
