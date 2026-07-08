import { checkoutUrls, getStripe, proPriceId, stripeConfigured } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!stripeConfigured()) {
    return Response.json(
      { error: "Payments are not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID_PRO." },
      { status: 503 },
    );
  }

  let email: string | undefined;
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim() || undefined;
  } catch {
    /* optional body */
  }

  const stripe = getStripe();
  const { success, cancel } = checkoutUrls();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: proPriceId(), quantity: 1 }],
    success_url: success,
    cancel_url: cancel,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    customer_email: email,
    metadata: { product: "pro" },
    subscription_data: {
      metadata: { product: "pro" },
    },
  });

  if (!session.url) {
    return Response.json({ error: "Could not create checkout session." }, { status: 500 });
  }

  return Response.json({ url: session.url, sessionId: session.id });
}
