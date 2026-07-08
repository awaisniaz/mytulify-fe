import { randomBytes, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { subscriptions, type SubscriptionStatus } from "@/lib/db/schema";

export function generateLicenseKey(): string {
  return `mt_pro_${randomBytes(12).toString("hex")}`;
}

function isActive(status: string, currentPeriodEnd: number | null): boolean {
  if (status !== "active") return false;
  if (currentPeriodEnd == null) return true;
  return currentPeriodEnd * 1000 > Date.now();
}

/** Validate a license key against the database. */
export async function validateLicenseKey(key: string): Promise<boolean> {
  const k = key.trim();
  if (!k) return false;

  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.licenseKey, k))
    .limit(1);

  const row = rows[0];
  if (!row) return false;
  return isActive(row.status, row.currentPeriodEnd);
}

export async function getSubscriptionByKey(key: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.licenseKey, key.trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getSubscriptionByCustomerId(customerId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertSubscription(input: {
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: number | null;
  licenseKey?: string;
}) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const existing = await getSubscriptionByCustomerId(input.stripeCustomerId);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        email: input.email,
        stripeSubscriptionId: input.stripeSubscriptionId,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, existing.id));
    return existing.licenseKey;
  }

  const licenseKey = input.licenseKey ?? generateLicenseKey();
  await db.insert(subscriptions).values({
    id: randomUUID(),
    licenseKey,
    email: input.email,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    status: input.status,
    currentPeriodEnd: input.currentPeriodEnd,
    createdAt: now,
    updatedAt: now,
  });
  return licenseKey;
}

export async function updateSubscriptionStatus(
  stripeSubscriptionId: string,
  status: SubscriptionStatus,
  currentPeriodEnd?: number | null,
) {
  const db = await getDb();
  const now = Math.floor(Date.now() / 1000);
  const patch: Partial<typeof subscriptions.$inferInsert> = { status, updatedAt: now };
  if (currentPeriodEnd !== undefined) patch.currentPeriodEnd = currentPeriodEnd;

  await db
    .update(subscriptions)
    .set(patch)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}
