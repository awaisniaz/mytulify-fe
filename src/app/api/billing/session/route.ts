import { getStripe } from "@/lib/billing/stripe";
import { getSubscriptionByCustomerId } from "@/lib/billing/keys";

export const dynamic = "force-dynamic";

/** Retrieve license key after successful Stripe Checkout. */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return Response.json({ error: "session_id is required" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return Response.json({ error: "Payment not completed" }, { status: 402 });
    }

    const customerId = session.customer as string | null;
    if (!customerId) {
      return Response.json({ error: "No customer on session" }, { status: 404 });
    }

    const sub = await getSubscriptionByCustomerId(customerId);
    if (!sub) {
      return Response.json(
        { error: "License not ready yet. Wait a moment and refresh, or check your email." },
        { status: 404 },
      );
    }

    return Response.json({
      licenseKey: sub.licenseKey,
      email: sub.email,
      status: sub.status,
    });
  } catch (err) {
    console.error("[billing/session]", err);
    return Response.json({ error: "Could not retrieve checkout session" }, { status: 500 });
  }
}
