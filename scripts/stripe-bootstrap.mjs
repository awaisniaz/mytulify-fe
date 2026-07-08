#!/usr/bin/env node
/**
 * Creates Pro product + monthly price in Stripe test mode.
 * Reads STRIPE_SECRET_KEY from tools-hub-backend/.env or .env.local
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { backendRoot } from "./paths.mjs";

const root = join(import.meta.dirname, "..");
const backendDir = backendRoot(import.meta.dirname);

function loadEnv(name, fallback = "") {
  for (const file of [join(backendDir, ".env"), join(root, ".env.local")]) {
    if (!existsSync(file)) continue;
    const m = readFileSync(file, "utf8").match(new RegExp(`^${name}=(.+)$`, "m"));
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return process.env[name]?.trim() ?? fallback;
}

const key = loadEnv("STRIPE_SECRET_KEY");
if (!key || key.includes("sk_test_...")) {
  console.error(`
❌ STRIPE_SECRET_KEY not set.

1. Open https://dashboard.stripe.com/test/apikeys
2. Copy "Secret key" (sk_test_...)
3. Add to tools-hub-backend/.env:
   STRIPE_SECRET_KEY=sk_test_...
4. Re-run: npm run stripe:bootstrap
`);
  process.exit(1);
}

const appName = loadEnv("APP_NAME", "Mytulify");
const proProduct = `${appName} Pro`;

const Stripe = (await import("stripe")).default;
const stripe = new Stripe(key);

const existing = await stripe.products.search({ query: `name:'${proProduct}'` });
let product = existing.data[0];

if (!product) {
  product = await stripe.products.create({
    name: proProduct,
    description: "Unlimited AI, no ads, 398+ tools",
  });
  console.log(`✓ Created product: ${product.id}`);
} else {
  console.log(`• Product exists: ${product.id}`);
}

const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
let price = prices.data.find((p) => p.recurring?.interval === "month" && p.currency === "usd");

if (!price) {
  price = await stripe.prices.create({
    product: product.id,
    unit_amount: 700,
    currency: "usd",
    recurring: { interval: "month" },
  });
  console.log(`✓ Created price: ${price.id} ($7/month)`);
} else {
  console.log(`• Price exists: ${price.id}`);
}

console.log(`
Add to tools-hub-backend/.env AND tools-hub/.env.local:

STRIPE_SECRET_KEY=${key.slice(0, 12)}...
STRIPE_PRICE_ID_PRO=${price.id}

For webhooks (local dev), run in another terminal:
  npm run stripe:webhook

Copy the whsec_... secret from that command into both env files as:
STRIPE_WEBHOOK_SECRET=whsec_...
`);
