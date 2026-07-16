import { createClient, type Client } from "@libsql/client";
import { mkdir } from "fs/promises";
import { dirname } from "path";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

let client: Client | null = null;
let db: LibSQLDatabase<typeof schema> | null = null;
let ready: Promise<void> | null = null;

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  license_key TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sub_license_key ON subscriptions(license_key);
CREATE INDEX IF NOT EXISTS idx_sub_stripe_sub ON subscriptions(stripe_subscription_id);

CREATE TABLE IF NOT EXISTS tool_requests (
  id TEXT PRIMARY KEY NOT NULL,
  tool_name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  email TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tool_requests_created ON tool_requests(created_at);
`;

async function initDb(): Promise<void> {
  if (db) return;

  const url = process.env.DATABASE_URL ?? "file:./data/mytulify.db";
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    if (filePath && filePath !== ":memory:") {
      await mkdir(dirname(filePath), { recursive: true });
    }
  }

  client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  await client.executeMultiple(SCHEMA_SQL);
  db = drizzle(client, { schema });
}

/** Lazy-init SQLite/Turso database (auto-creates tables on first use). */
export async function getDb(): Promise<LibSQLDatabase<typeof schema>> {
  if (!ready) ready = initDb();
  await ready;
  return db!;
}

export { schema };
