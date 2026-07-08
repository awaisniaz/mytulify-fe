#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { backendRoot } from "./paths.mjs";

const root = join(import.meta.dirname, "..");
const backendDir = backendRoot(import.meta.dirname);

function envVars(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i)] = t.slice(i + 1).trim();
  }
  return out;
}

const backend = envVars(join(backendDir, ".env"));
const frontend = envVars(join(root, ".env.local"));

console.log("\n💳 Payment configuration check\n");
console.log(`Backend repo: ${backendDir}\n`);

function isRealStripeKey(v) {
  return Boolean(v?.startsWith("sk_") && !v.includes("...") && v.length > 20);
}
function isRealPriceId(v) {
  return Boolean(v?.startsWith("price_") && !v.includes("...") && v.length > 12);
}
function isRealWebhook(v) {
  return Boolean(v?.startsWith("whsec_") && !v.includes("...") && v.length > 12);
}

const checks = [
  ["tools-hub-backend/.env exists", existsSync(join(backendDir, ".env"))],
  ["JWT_SECRET (backend)", Boolean(backend.JWT_SECRET && backend.JWT_SECRET.length > 8)],
  ["JWT_SECRET matches frontend", backend.JWT_SECRET === frontend.JWT_SECRET],
  ["INTERNAL_API_KEY matches", backend.INTERNAL_API_KEY === frontend.INTERNAL_API_KEY],
  ["Stripe secret key", isRealStripeKey(backend.STRIPE_SECRET_KEY)],
  ["Stripe price ID", isRealPriceId(backend.STRIPE_PRICE_ID_PRO)],
  ["Stripe webhook secret", isRealWebhook(backend.STRIPE_WEBHOOK_SECRET)],
  ["PayFast merchant", Boolean(backend.PAYFAST_MERCHANT_ID && backend.PAYFAST_SECURED_KEY)],
  ["JazzCash merchant", Boolean(
    backend.JAZZCASH_MERCHANT_ID && backend.JAZZCASH_PASSWORD && backend.JAZZCASH_INTEGRITY_SALT,
  )],
];

for (const [label, ok] of checks) {
  console.log(`${ok ? "✓" : "○"} ${label}`);
}

const api = frontend.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
try {
  const res = await fetch(`${api.replace(/\/$/, "")}/api/v1/payments/methods`);
  const data = await res.json();
  const methods = data.methods ?? [];
  console.log(`\nBackend ${api}/api/v1/payments/methods → ${methods.length} gateway(s):`);
  if (methods.length === 0) {
    console.log("  (none — add Stripe or PayFast/JazzCash keys in tools-hub-backend/.env)");
  } else {
    for (const m of methods) {
      console.log(`  • ${m.name} (${m.currency} ${m.amount}/month)`);
    }
  }
} catch {
  console.log(`\n⚠ Backend not reachable at ${api} — run: npm run dev:backend`);
}

console.log("");
