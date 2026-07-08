/** Sync Pro subscription to the separate auth backend (user accounts). */
export async function syncProToBackend(input: {
  email: string;
  licenseKey?: string;
  stripeCustomerId?: string;
  isPro: boolean;
}): Promise<void> {
  const apiUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!apiUrl || !internalKey) return;

  try {
    await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/billing/internal/provision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      body: JSON.stringify(input),
    });
  } catch (err) {
    console.error("[syncProToBackend]", err);
  }
}

export async function revokeProOnBackend(stripeCustomerId: string): Promise<void> {
  const apiUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!apiUrl || !internalKey) return;

  try {
    await fetch(`${apiUrl.replace(/\/$/, "")}/api/v1/billing/internal/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalKey,
      },
      body: JSON.stringify({ stripeCustomerId }),
    });
  } catch (err) {
    console.error("[revokeProOnBackend]", err);
  }
}
