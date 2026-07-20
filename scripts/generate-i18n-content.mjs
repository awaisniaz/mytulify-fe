#!/usr/bin/env node
/**
 * Generates src/i18n/content/locales/*.json from catalog.
 * Uses OpenAI when OPENAI_API_KEY is set, otherwise Google Translate (free).
 * Usage: npm run i18n:content [-- --locale ur,ar] [--skip-existing]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import { translate as gTranslate } from "@vitalets/google-translate-api";
import { loadCatalog } from "./catalog-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "src/i18n/content/locales");
mkdirSync(outDir, { recursive: true });

const LOCALES = ["en", "ur", "fr", "de", "es", "pt"];

const LOCALE_NAMES = {
  en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German",
  it: "Italian", nl: "Dutch", ru: "Russian", uk: "Ukrainian", pl: "Polish",
  tr: "Turkish", ar: "Arabic", ur: "Urdu", fa: "Persian", ps: "Pashto",
  hi: "Hindi", bn: "Bengali", pa: "Punjabi", id: "Indonesian", ms: "Malay",
  tl: "Filipino", zh: "Chinese", ja: "Japanese", ko: "Korean", vi: "Vietnamese", th: "Thai",
};

const GT_LOCALE = {
  zh: "zh-CN", tl: "fil", pt: "pt", uk: "uk", he: "iw",
};

const SEP = "\n␞\n";
const BATCH = 8;
const GT_SLEEP_MS = 1500;
const GT_MAX_RETRIES = 6;

const EN_STRINGS = {
  home: "Home",
  category: "Category",
  hot: "Hot",
  private: "Private",
  instant: "Instant",
  aiPowered: "AI-Powered",
  popular: "Popular",
  perDayFree: "{limit}/day on Free",
  comingSoon: "Coming soon",
  comingSoonTitle: "This tool is launching soon",
  comingSoonBody: "We're preparing this AI-powered tool. It will be available here shortly — check back soon.",
  faqTitle: "Frequently asked questions",
  aboutTool: "About the {name}",
  relatedTools: "Related {category}",
  exploreOther: "Explore other categories",
  toolsCount: "{n} tools",
  toolsPageTitle: "All {n}+ tools",
  toolsPageSub: "Search and filter across {cats} categories.",
  searchAllTools: "Search all {n}+ tools…",
  searchTrendingHint: "Trending tools — use ↑↓ and Enter",
  searchNoResults: "No tools found for “{q}”",
  searchResultsOne: "1 result",
  searchResultsMany: "{n} results",
  searchClear: "Clear search",
  browseTools: "Browse all tools",
  faqIsFreeQ: "Is the {name} free to use?",
  faqIsFreeAClient: "Yes. {name} is free on our Free plan — unlimited use, no signup, and no watermark. Browser tools never require payment.",
  faqIsFreeAAi: "Yes, with daily limits. {name} includes {limit} free runs per day on the Free plan. Upgrade to Pro for unlimited AI runs and no ads.",
  faqSafeQ: "Is my data safe with the {name}?",
  faqSafeA: "Absolutely. {name} runs entirely in your browser — your data is never uploaded to any server.",
  faqDataQ: "How is my data handled by the {name}?",
  faqDataA: "{name} sends your input to our server, which securely calls an AI model to generate the result. We don't store your inputs — but avoid pasting secrets or sensitive data, and always review AI output before relying on it.",
  faqHowQ: "How does the {name} work?",
  faqHowAClient: "{desc} Just enter your input and the result is generated instantly on your device.",
  faqHowAAi: "{desc} Enter your input and an AI model generates the result in a few seconds.",
  toolAboutClient: "The {name} is an online tool from Mytulify. {desc} It runs entirely in your browser — fast, private, and unlimited on the Free plan. No account or installation needed.",
  toolAboutAi: "The {name} is an AI-powered tool from Mytulify. {desc} The Free plan includes {limit} runs per day; Pro unlocks unlimited runs. Input is processed on our server — avoid pasting secrets.",
  toolMetaTitle: "{name} — Online Tool",
  toolMetaClient: "{desc} Free browser tool — runs locally in your browser, no signup required.",
  toolMetaAi: "{desc} AI-powered tool — {limit} free runs/day on Free; Pro for unlimited.",
  categoryTitle: "{name} — {count} Online Tools",
  categoryDescription: "{desc} {count} tools — browser tools free; AI tools may have daily limits on the Free plan.",
  aboutPage: {
    label: "About us",
    title: "About Mytulify",
    intro: "{total}+ online tools — {client}+ run free in your browser; AI & OCR include a daily free allowance or unlimited with Pro.",
    statTools: "Total tools",
    statCategories: "Categories",
    statBrowser: "Browser-only",
    offerTitle: "What we offer",
    offerBody: "Mytulify spans {cats} categories — PDF and image utilities, text, SEO, developer, color tools, calculators and unit converters.",
    privacyTitle: "Privacy first",
    privacyBody: "Most tools — {client} of {total} — run entirely in your browser. Your files, text, and data never leave your device.",
    aiTitle: "AI-powered tools",
    aiBody: "Our {ai} AI tools (including handwriting OCR) send input to our server to generate results. We don't store that input after processing.",
    pricingTitle: "Free & Pro",
    pricingBody: "{client}+ browser tools stay free with no signup. AI & OCR tools allow {limit} runs per day on Free. Pro adds unlimited AI, OCR, and an ad-free experience.",
    cta: "Browse all tools",
  },
};

const SYSTEM = `You translate a tools website JSON from English. Rules:
- Keep all JSON keys unchanged
- Keep placeholders {name} {n} {desc} {limit} {total} {client} {cats} {count} {ai} exactly
- Keep brand Mytulify and Pro untranslated
- Return ONLY valid JSON matching the input shape`;

function buildEnglish() {
  const categories = loadCatalog();
  return {
    categories: Object.fromEntries(
      categories.map((c) => [c.slug, { name: c.name, description: c.description, tagline: c.tagline }]),
    ),
    tools: Object.fromEntries(
      categories.flatMap((c) => c.tools.map((t) => [t.key, { name: t.name, description: t.description }])),
    ),
    strings: EN_STRINGS,
  };
}

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

function flattenStrings(obj, prefix = "") {
  const out = [];
  const map = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      const sub = flattenStrings(v, key);
      out.push(...sub.texts);
      map.push(...sub.map);
    } else {
      out.push(String(v));
      map.push(key);
    }
  }
  return { texts: out, map };
}

function unflattenStrings(flat, map, values) {
  const root = {};
  for (let i = 0; i < map.length; i++) {
    const parts = map[i].split(".");
    let cur = root;
    for (let j = 0; j < parts.length - 1; j++) {
      cur[parts[j]] ??= {};
      cur = cur[parts[j]];
    }
    cur[parts[parts.length - 1]] = values[i];
  }
  return root;
}

const args = process.argv.slice(2);
const localeArg = args.find((a) => a.startsWith("--locale="))?.slice(9)?.split(",") ?? null;
const skipExisting = args.includes("--skip-existing");
const targetLocales = localeArg ?? LOCALES.filter((l) => l !== "en");

loadEnv();
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function gtBatch(texts, locale) {
  const to = GT_LOCALE[locale] ?? locale;
  const out = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const chunk = texts.slice(i, i + BATCH);
    const joined = chunk.join(SEP);
    let translated = null;
    for (let attempt = 0; attempt < GT_MAX_RETRIES; attempt++) {
      try {
        const res = await gTranslate(joined, { from: "en", to });
        const parts = res.text.split(SEP);
        if (parts.length === chunk.length) translated = parts;
        else translated = chunk.map((_, j) => parts[j] ?? chunk[j]);
        break;
      } catch (e) {
        const wait = GT_SLEEP_MS * Math.pow(2, attempt + 1);
        process.stdout.write(`!${attempt + 1}`);
        await sleep(wait);
        if (attempt === GT_MAX_RETRIES - 1) {
          console.warn(`\nGoogle Translate failed for ${locale} batch: ${e.message}`);
          translated = chunk;
        }
      }
    }
    out.push(...translated);
    await sleep(GT_SLEEP_MS);
  }
  return out;
}

function isLocaleTranslated(translated, enBundle) {
  const sampleCat = enBundle.categories["ai-tools"];
  const hit = translated.categories?.["ai-tools"];
  if (!hit || hit.name === sampleCat.name) return false;
  const toolKey = "ai-tools/code-explainer";
  const enTool = enBundle.tools[toolKey];
  const trTool = translated.tools?.[toolKey];
  if (!trTool || trTool.name === enTool.name) return false;
  return true;
}

async function translateStringsGT(enStrings, locale) {
  const { texts, map } = flattenStrings(enStrings);
  const translated = await gtBatch(texts, locale);
  return unflattenStrings(enStrings, map, translated);
}

async function translateJsonOpenAI(enJson, locale, label) {
  if (!openai) throw new Error("OPENAI_API_KEY missing");
  const lang = LOCALE_NAMES[locale];
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Translate to ${lang} (${locale}) — ${label}:\n${JSON.stringify(enJson)}` },
    ],
  });
  const text = res.choices[0]?.message?.content;
  if (!text) throw new Error(`Empty response for ${label}`);
  return JSON.parse(text);
}

async function translateLocaleGoogle(enBundle, locale, catalog) {
  const out = { categories: {}, tools: {}, strings: await translateStringsGT(enBundle.strings, locale) };

  for (const cat of catalog) {
    const catEn = enBundle.categories[cat.slug];
    const [name, description, tagline] = await gtBatch(
      [catEn.name, catEn.description, catEn.tagline],
      locale,
    );
    out.categories[cat.slug] = { name, description, tagline };

    const keys = cat.tools.map((t) => t.key);
    const names = keys.map((k) => enBundle.tools[k].name);
    const descs = keys.map((k) => enBundle.tools[k].description);
    const trNames = await gtBatch(names, locale);
    const trDescs = await gtBatch(descs, locale);
    keys.forEach((k, i) => {
      out.tools[k] = { name: trNames[i], description: trDescs[i] };
    });
    process.stdout.write(".");
  }
  return out;
}

async function translateLocaleOpenAI(enBundle, locale, catalog) {
  const out = { categories: {}, tools: {}, strings: null };
  out.strings = await translateJsonOpenAI(enBundle.strings, locale, "UI strings");
  for (const cat of catalog) {
    const chunk = {
      category: { [cat.slug]: enBundle.categories[cat.slug] },
      tools: Object.fromEntries(cat.tools.map((t) => [t.key, enBundle.tools[t.key]])),
    };
    const tr = await translateJsonOpenAI(chunk, locale, cat.slug);
    Object.assign(out.categories, tr.category ?? tr.categories ?? {});
    Object.assign(out.tools, tr.tools ?? {});
    await sleep(300);
  }
  return out;
}

function loadEnglishBundle(catalog) {
  const enPath = join(outDir, "en.json");
  const fresh = buildEnglish();
  if (!existsSync(enPath)) {
    writeFileSync(enPath, JSON.stringify(fresh, null, 2) + "\n");
    return fresh;
  }
  /** Keep hand-written SEO fields; only fill missing catalog entries. */
  const existing = JSON.parse(readFileSync(enPath, "utf8"));
  existing.categories ??= {};
  existing.tools ??= {};
  existing.strings ??= fresh.strings;
  for (const [slug, cat] of Object.entries(fresh.categories)) {
    if (!existing.categories[slug]) existing.categories[slug] = cat;
  }
  for (const [key, tool] of Object.entries(fresh.tools)) {
    if (!existing.tools[key]) existing.tools[key] = tool;
    else {
      existing.tools[key].name ??= tool.name;
      existing.tools[key].description ??= tool.description;
    }
  }
  // Ensure catalog-backed tools exist even if slug order changed.
  for (const cat of catalog) {
    if (!existing.categories[cat.slug]) {
      existing.categories[cat.slug] = fresh.categories[cat.slug];
    }
  }
  return existing;
}

async function main() {
  const catalog = loadCatalog();
  const writeEn = args.includes("--write-en");
  const enBundle = loadEnglishBundle(catalog);
  if (writeEn) {
    writeFileSync(join(outDir, "en.json"), JSON.stringify(enBundle, null, 2) + "\n");
    console.log(`✓ en written (${Object.keys(enBundle.tools).length} tools)`);
  } else {
    console.log(`✓ en source (${Object.keys(enBundle.tools).length} tools) — not overwritten`);
  }
  console.log(openai ? "Using OpenAI" : "Using Google Translate (free)");

  for (const locale of targetLocales) {
    if (locale === "en") continue;
    const outPath = join(outDir, `${locale}.json`);
    if (skipExisting && existsSync(outPath)) {
      try {
        const existing = JSON.parse(readFileSync(outPath, "utf8"));
        if (isLocaleTranslated(existing, enBundle)) {
          console.log(`⏭ ${locale}`);
          continue;
        }
        console.log(`↻ ${locale} (incomplete — retranslating)`);
      } catch {
        console.log(`↻ ${locale} (invalid file — retranslating)`);
      }
    }
    process.stdout.write(`Translating ${locale}`);
    try {
      const translated = openai
        ? await translateLocaleOpenAI(enBundle, locale, catalog)
        : await translateLocaleGoogle(enBundle, locale, catalog);
      if (!isLocaleTranslated(translated, enBundle)) {
        throw new Error("translation unchanged — likely rate limited");
      }
      writeFileSync(outPath, JSON.stringify(translated, null, 2) + "\n");
      console.log(" ✓");
    } catch (e) {
      console.log(" ✗", e.message);
    }
  }
  console.log("Done →", outDir);
}

main();
