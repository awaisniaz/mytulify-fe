import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, schema } from "@/lib/db";
import { CATEGORIES } from "@/lib/catalog";
import { isMailConfigured } from "@/lib/mail/send";
import { sendToolRequestEmail } from "@/lib/mail/tool-request-email";

export const dynamic = "force-dynamic";

const MAX_NAME = 120;
const MAX_DESC = 2000;
const MAX_EMAIL = 200;

function categoryLabel(slug: string | null): string {
  if (!slug || slug === "other") return "Other / not sure";
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

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
    name?: string | null;
    email?: string | null;
  };

  const toolName = b.toolName?.trim() ?? "";
  const description = b.description?.trim() ?? "";
  const category = b.category?.trim() || null;
  const requesterName = b.name?.trim() || null;
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
  if (requesterName && requesterName.length > MAX_NAME) {
    return NextResponse.json({ ok: false, error: "Name is too long." }, { status: 400 });
  }
  if (email && (email.length > MAX_EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return NextResponse.json({ ok: false, error: "Invalid email." }, { status: 400 });
  }

  const id = randomUUID();
  const now = Date.now();

  try {
    const db = await getDb();
    await db.insert(schema.toolRequests).values({
      id,
      toolName,
      description,
      category,
      requesterName,
      email,
      createdAt: now,
    });
  } catch (e) {
    console.error("[request-tool] save", e);
    return NextResponse.json(
      { ok: false, error: "Could not save your request. Please try again later." },
      { status: 500 },
    );
  }

  try {
    await sendToolRequestEmail({
      id,
      toolName,
      description,
      categoryLabel: categoryLabel(category),
      requesterName,
      requesterEmail: email,
      createdAt: now,
    });
    return NextResponse.json({ ok: true, emailed: true });
  } catch (e) {
    console.error("[request-tool] email", e);
    if (isMailConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Request saved, but we could not send the notification email. Please try again." },
        { status: 502 },
      );
    }
    console.error(
      "[request-tool] SMTP_USER / SMTP_PASS are not set — request saved locally but email was not sent to mytulif@gmail.com",
    );
    return NextResponse.json({ ok: true, emailed: false });
  }
}
