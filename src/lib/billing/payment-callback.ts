const API = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
  /\/$/,
  "",
);

/** Tell backend to finalize order and issue license (Pakistan gateways). */
export async function completeOrderFromCallback(orderRef: string, gateway: string): Promise<void> {
  const key = process.env.INTERNAL_API_KEY?.trim();
  if (!key) return;

  try {
    await fetch(`${API}/api/v1/payments/internal/complete`, {
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
