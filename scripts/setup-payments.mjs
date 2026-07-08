#!/usr/bin/env node
/**
 * Generates shared auth secrets and creates tools-hub-backend/.env + updates .env.local.
 * Run: npm run setup:payments
 */
import { randomBytes } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { backendRoot } from "./paths.mjs";

const root = join(import.meta.dirname, "..");
const backendDir = backendRoot(import.meta.dirname);
const backendEnvPath = join(backendDir, ".env");
const backendExamplePath = join(backendDir, ".env.example");
const frontendEnvPath = join(root, ".env.local");

function secret() {
  return randomBytes(32).toString("hex");
}

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    map.set(t.slice(0, i), t.slice(i + 1));
  }
  return map;
}

function serializeEnv(lines, map) {
  const out = [];
  const used = new Set();
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) {
      out.push(line);
      continue;
    }
    const i = t.indexOf("=");
    if (i === -1) {
      out.push(line);
      continue;
    }
    const key = t.slice(0, i);
    if (map.has(key)) {
      out.push(`${key}=${map.get(key)}`);
      used.add(key);
    } else {
      out.push(line);
    }
  }
  for (const [k, v] of map) {
    if (!used.has(k)) out.push(`${k}=${v}`);
  }
  return out.join("\n") + "\n";
}

const jwt = secret();
const internal = secret();

console.log("\n🔧 Mytulify payment setup\n");
console.log(`Backend repo: ${backendDir}\n`);

if (!existsSync(backendDir)) {
  console.error(`❌ Backend not found at ${backendDir}`);
  console.error("Clone tools-hub-backend next to tools-hub, or set TOOLS_HUB_BACKEND_DIR.");
  process.exit(1);
}

// Backend .env
if (!existsSync(backendEnvPath)) {
  const example = readFileSync(backendExamplePath, "utf8");
  const merged = example
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${jwt}`)
    .replace(/^INTERNAL_API_KEY=.*$/m, `INTERNAL_API_KEY=${internal}`);
  writeFileSync(backendEnvPath, merged);
  console.log("✓ Created tools-hub-backend/.env with JWT_SECRET + INTERNAL_API_KEY");
} else {
  console.log("• tools-hub-backend/.env already exists — not overwriting");
}

// Frontend .env.local — merge auth + API vars
const frontendLines = existsSync(frontendEnvPath)
  ? readFileSync(frontendEnvPath, "utf8").split("\n")
  : readFileSync(join(root, ".env.example"), "utf8").split("\n");

const frontendMap = parseEnv(frontendLines.join("\n"));
frontendMap.set("NEXT_PUBLIC_API_URL", frontendMap.get("NEXT_PUBLIC_API_URL") ?? "http://localhost:4000");
frontendMap.set("BACKEND_URL", frontendMap.get("BACKEND_URL") ?? "http://localhost:4000");
frontendMap.set("JWT_SECRET", frontendMap.get("JWT_SECRET") ?? jwt);
frontendMap.set("INTERNAL_API_KEY", frontendMap.get("INTERNAL_API_KEY") ?? internal);
frontendMap.set("NEXT_PUBLIC_PRO_PRICE_PKR", frontendMap.get("NEXT_PUBLIC_PRO_PRICE_PKR") ?? "1999");

writeFileSync(frontendEnvPath, serializeEnv(frontendLines, frontendMap));
console.log("✓ Updated .env.local (API URL + shared secrets)");

console.log(`
Next steps — add payment keys:

  1. Stripe (test mode)
     npm run stripe:bootstrap
     npm run stripe:webhook   # separate terminal while testing

  2. PayFast / JazzCash — edit tools-hub-backend/.env with merchant credentials
     See tools-hub-backend/PAYMENTS-SETUP.md

  3. Verify
     npm run payments:check

  4. Run (two terminals or one)
     cd ../tools-hub-backend && npm run dev   # port 4000
     cd ../tools-hub && npm run dev           # port 3000
     # or from tools-hub: npm run dev:all

  Open http://localhost:3000/pricing
`);
