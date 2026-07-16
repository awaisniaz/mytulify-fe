import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Pro subscriptions purchased via Stripe. */
export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    licenseKey: text("license_key").notNull().unique(),
    email: text("email").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    status: text("status").notNull().default("active"),
    currentPeriodEnd: integer("current_period_end"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [
    index("idx_sub_license_key").on(t.licenseKey),
    index("idx_sub_stripe_sub").on(t.stripeSubscriptionId),
  ],
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "incomplete";

/** User-submitted tool ideas from /request-tool. */
export const toolRequests = sqliteTable(
  "tool_requests",
  {
    id: text("id").primaryKey(),
    toolName: text("tool_name").notNull(),
    description: text("description").notNull(),
    category: text("category"),
    email: text("email"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("idx_tool_requests_created").on(t.createdAt)],
);

export type ToolRequest = typeof toolRequests.$inferSelect;
export type NewToolRequest = typeof toolRequests.$inferInsert;
