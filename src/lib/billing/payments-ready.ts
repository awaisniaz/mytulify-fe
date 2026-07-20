import { API_URL } from "@/lib/auth/config";
import { stripeConfigured } from "@/lib/billing/stripe";

/** Backend checkout methods (Lemon / PayFast / JazzCash / EasyPaisa) available. */
export async function paymentGatewaysReady(): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/payments/methods?plan=pro&interval=month`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as { methods?: unknown[] };
    return Array.isArray(data.methods) && data.methods.length > 0;
  } catch {
    return false;
  }
}

/** Any checkout path ready (gateways or Stripe). */
export async function paymentsReady(): Promise<boolean> {
  if (stripeConfigured()) return true;
  return paymentGatewaysReady();
}
