# Mytulify — 398+ Online Tools (Free tier + Pro)

A fast, privacy-first hub of **398 online tools** across **15 categories**, built with
Next.js 16, React 19, TypeScript and Tailwind CSS v4. Most browser tools are **free & unlimited**;
AI and OCR tools include a **free daily allowance** — **Pro** unlocks unlimited runs and removes ads.
Fully SEO-optimised (per-tool metadata, JSON-LD, sitemap, robots, Open Graph images).

## Categories

| Category | Examples |
|---|---|
| AI-Powered Tools | Code explainer, SQL generator, regex, README, Docker Compose |
| Handwriting OCR | Handwriting to text in 30+ languages |
| DevOps Tools | Kubernetes YAML, nginx, GitHub Actions, crontab |
| Health & Fitness | BMI, macros, heart rate zones, calories burned |
| Text Tools | Word counter, case converter, lorem ipsum, morse, diff |
| Developer Tools | JSON formatter, JWT decoder, regex tester, base64, cron |
| Security & Password | Password/hash/HMAC/AES, ciphers, token generators |
| PDF Tools | Merge, split, rotate, watermark, page numbers, images→PDF |
| Image Tools | Resize, compress, convert, crop, filters, meme, favicon |
| Color Tools | Picker, converters, palettes, gradients, contrast, shadows |
| Calculators | BMI, loan, mortgage, age, GPA, scientific, calorie |
| Unit Converters | Length, weight, temp, units, size charts, time zones |
| SEO & Web Tools | Meta/OG/schema generators, robots, sitemap, UTM, readability |
| Social Media Tools | Fancy fonts, fake tweet/IG mockups, hashtags, captions |
| Converters & Generators | QR, barcode, UUID, JSON↔CSV/YAML/XML, minifiers |

> **All 398 tools are now fully interactive.** PDF protect/unlock and PDF↔Word use browser-based approaches with documented limitations.

## Architecture

```
src/
  app/
    layout.tsx                  Root layout, theme, header/footer, site JSON-LD
    page.tsx                    Homepage (hero, categories, trending, CTA)
    [category]/page.tsx         Category listing (SSG + metadata + breadcrumb JSON-LD)
    [category]/[tool]/page.tsx  Tool page (SSG, SoftwareApplication + FAQ JSON-LD)
    tools/page.tsx              Searchable all-tools browser
    sitemap.ts / robots.ts      SEO infra (auto-generated from the catalog)
  lib/catalog/                  398-tool catalog: typed JSON per category + helpers
  components/
    Header / Footer / SearchModal / ThemeToggle / cards
    tools/
      ToolRenderer.tsx          Lazy-loads each category's tool bundle by slug
      reg/<category>.tsx        Maps tool slug → React component (per-category code split)
      impl/*.tsx                The actual tool implementations + shared engines
```

The catalog (`src/lib/catalog`) is the single source of truth — it drives the homepage,
category pages, search, sitemap and static params. **To add a tool:** add it to the category
JSON, then map its slug to a component in the matching `reg/<category>.tsx`.

## Develop

**Sibling repos** (recommended):

```
~/tools-hub/           ← this repo — Next.js frontend :3000
~/tools-hub-backend/   ← Express API — auth & payments :4000
```

```bash
# Frontend only
npm install
npm run dev              # http://localhost:3000

# Backend (separate terminal, sibling folder)
cd ../tools-hub-backend && npm install && npm run dev   # :4000

# Or both from tools-hub:
npm run dev:all

# First-time payments setup (syncs secrets across both repos)
npm run setup:payments
npm run payments:check
```

```bash
npm run build            # production build
npm start                # serve production build
npm run lint
npm run brand:check
```

Set `NEXT_PUBLIC_SITE_URL` to your domain so canonical URLs / sitemap / OG tags are correct.
Backend URL defaults to `http://localhost:4000` via `NEXT_PUBLIC_API_URL` in `.env.local`.

## Tech

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind v4 ·
lucide-react · pdf-lib · qrcode · jsbarcode · crypto-js · js-yaml · marked · fuse.js · html-to-image
