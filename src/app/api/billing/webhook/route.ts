import { getStripe, mapStripeStatus } from "@/lib/billing/stripe";
import { upsertSubscription, updateSubscriptionStatus, getSubscriptionByCustomerId } from "@/lib/billing/keys";
import { revokeProOnBackend, syncProToBackend } from "@/lib/billing/backend-sync";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function periodEnd(sub: Stripe.Subscription): number | null {
  return sub.items?.data?.[0]?.current_period_end ?? null;
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 503 });
  }

  const stripe = getStripe();
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return Response.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return Response.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string | null;
        const subscriptionId = session.subscription as string | null;
        const email =
          session.customer_details?.email ?? session.customer_email ?? "unknown@customer.local";

        if (!customerId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const licenseKey = await upsertSubscription({
          email,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status: mapStripeStatus(sub.status),
          currentPeriodEnd: periodEnd(sub),
        });
        await syncProToBackend({
          email,
          licenseKey,
          stripeCustomerId: customerId,
          isPro: mapStripeStatus(sub.status) === "active",
        });

        const orderRef = session.metadata?.order_ref;
        if (orderRef) {
          const api = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
          const key = process.env.INTERNAL_API_KEY;
          if (api && key) {
            void fetch(`${api.replace(/\/$/, "")}/api/v1/payments/internal/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "X-Internal-Key": key },
              body: JSON.stringify({ orderRef, gateway: "stripe" }),
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = mapStripeStatus(sub.status);
        await updateSubscriptionStatus(sub.id, status, periodEnd(sub));
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const row = await getSubscriptionByCustomerId(customerId);
          if (row?.email) {
            await syncProToBackend({
              email: row.email,
              licenseKey: row.licenseKey,
              stripeCustomerId: customerId,
              isPro: status === "active",
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await updateSubscriptionStatus(sub.id, "canceled", periodEnd(sub));
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) await revokeProOnBackend(customerId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subscriptionId =
          typeof subRef === "string" ? subRef : subRef?.id ?? null;
        if (subscriptionId) {
          await updateSubscriptionStatus(subscriptionId, "past_due");
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return Response.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
