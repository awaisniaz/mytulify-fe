import { completeOrderFromCallback } from "@/lib/billing/payment-callback";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderRef = url.searchParams.get("order_ref")?.trim();
  if (!orderRef) {
    return Response.redirect(new URL("/pricing?error=missing_order", request.url));
  }

  await completeOrderFromCallback(orderRef, "payfast");
  return Response.redirect(new URL(`/pricing/success?order_ref=${orderRef}`, request.url));
}
