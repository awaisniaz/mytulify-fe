import Stripe from "stripe";
import { site } from "@/lib/site";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    stripe = new Stripe(key);
  }
  return stripe;
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID_PRO);
}

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_ID_PRO?.trim();
  if (!id) throw new Error("STRIPE_PRICE_ID_PRO is not configured");
  return id;
}

export function checkoutUrls() {
  const base = site.url.replace(/\/$/, "");
  return {
    success: `${base}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${base}/pricing?canceled=1`,
  };
}

export function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "canceled" | "past_due" | "incomplete" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}
