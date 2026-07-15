import { getAiStatus } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

/** Lightweight AI config check — no secrets returned. */
export async function GET() {
  return Response.json(getAiStatus());
}
