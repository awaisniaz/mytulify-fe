import { getStripe } from "@/lib/billing/stripe";
import { getSubscriptionByKey } from "@/lib/billing/keys";
import { SITE_URL } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Open Stripe Customer Portal to manage subscription. */
export async function POST(request: Request) {
  const key = request.headers.get("x-pro-key")?.trim();
  if (!key) {
    return Response.json({ error: "Pro license key required" }, { status: 401 });
  }

  const sub = await getSubscriptionByKey(key);
  if (!sub?.stripeCustomerId) {
    return Response.json({ error: "No billing account found for this key" }, { status: 404 });
  }

  const stripe = getStripe();

  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${SITE_URL}/pricing`,
  });

  return Response.json({ url: portal.url });
}
