import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_NAME = 120;
const MAX_DESC = 2000;
const MAX_EMAIL = 200;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as {
    toolName?: string;
    description?: string;
    category?: string | null;
    email?: string | null;
  };

  const toolName = b.toolName?.trim() ?? "";
  const description = b.description?.trim() ?? "";
  const category = b.category?.trim() || null;
  const email = b.email?.trim() || null;

  if (!toolName || !description) {
    return NextResponse.json(
      { ok: false, error: "Tool name and description are required." },
      { status: 400 },
    );
  }
  if (toolName.length > MAX_NAME || description.length > MAX_DESC) {
    return NextResponse.json({ ok: false, error: "Input too long." }, { status: 400 });
  }
  if (email && (email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }

  try {
    const db = await getDb();
    const now = Date.now();
    await db.insert(schema.toolRequests).values({
      id: randomUUID(),
      toolName,
      description,
      category,
      email,
      createdAt: now,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[request-tool]", e);
    return NextResponse.json(
      { ok: false, error: "Could not save your request. Please try again later." },
      { status: 500 },
    );
  }
}
