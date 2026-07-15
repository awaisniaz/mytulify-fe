import { completeOrderFromCallback } from "@/lib/billing/payment-callback";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const orderRef = url.searchParams.get("order_ref")?.trim();
  if (!orderRef) {
    return Response.redirect(new URL("/pricing?error=missing_order", request.url));
  }

  const form = await request.formData();
  const code = String(form.get("pp_ResponseCode") ?? "");
  const ok = code === "000" || code === "00" || code === "";

  if (ok) {
    await completeOrderFromCallback(orderRef, "easypaisa");
    return Response.redirect(new URL(`/pricing/success?order_ref=${orderRef}`, request.url));
  }

  return Response.redirect(new URL("/pricing?canceled=1", request.url));
}

export async function GET(request: Request) {
  return POST(request);
}
