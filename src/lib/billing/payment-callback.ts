import { BACKEND_URL } from "@/lib/env";

/** Tell backend to finalize order and issue license (Pakistan gateways). */
export async function completeOrderFromCallback(orderRef: string, gateway: string): Promise<void> {
  const key = process.env.INTERNAL_API_KEY?.trim();
  if (!key) return;

  try {
    await fetch(`${BACKEND_URL}/api/v1/payments/internal/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": key,
      },
      body: JSON.stringify({ orderRef, gateway }),
    });
  } catch (err) {
    console.error("[completeOrderFromCallback]", err);
  }
}
