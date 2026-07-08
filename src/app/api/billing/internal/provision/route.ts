import { upsertSubscription } from "@/lib/billing/keys";

export const dynamic = "force-dynamic";

/** Internal — called by backend after Pakistan gateway payment succeeds. */
export async function POST(request: Request) {
  const key = process.env.INTERNAL_API_KEY?.trim();
  if (!key || request.headers.get("x-internal-key") !== key) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    email?: string;
    licenseKey?: string;
    status?: string;
    gateway?: string;
    stripeCustomerId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const licenseKey = body.licenseKey?.trim();
  if (!email || !licenseKey) {
    return Response.json({ error: "email and licenseKey required" }, { status: 400 });
  }

  await upsertSubscription({
    email,
    stripeCustomerId: body.stripeCustomerId ?? `local_${body.gateway ?? "manual"}_${Date.now()}`,
    stripeSubscriptionId: `sub_${licenseKey.slice(0, 16)}`,
    status: body.status === "active" ? "active" : "active",
    currentPeriodEnd: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    licenseKey,
  });

  return Response.json({ ok: true, licenseKey });
}
