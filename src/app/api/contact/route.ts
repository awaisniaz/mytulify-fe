import { NextResponse } from "next/server";
import { site } from "@/lib/site";
import { isMailConfigured, sendMail } from "@/lib/mail/send";

export const dynamic = "force-dynamic";

const buckets = new Map<string, { count: number; reset: number }>();

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const hit = buckets.get(ip);
  if (!hit || now > hit.reset) {
    buckets.set(ip, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (hit.count >= 5) return false;
  hit.count += 1;
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  if (!rateLimit(clientIp(request))) {
    return NextResponse.json({ ok: false, error: "Too many messages. Try again in a minute." }, { status: 429 });
  }

  let body: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    company?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (body.company?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const subject = body.subject?.trim() || "Website contact";
  const message = body.message?.trim() ?? "";

  if (!name || !email || !message) {
    return NextResponse.json({ ok: false, error: "Name, email, and message are required." }, { status: 400 });
  }
  if (name.length > 120 || subject.length > 160 || message.length > 4000) {
    return NextResponse.json({ ok: false, error: "That message is too long." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  if (!isMailConfigured()) {
    return NextResponse.json(
      { ok: false, error: `Email is not set up on this server yet. Write to ${site.supportEmail} instead.` },
      { status: 503 },
    );
  }

  const text = `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`;
  const html = `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`;

  try {
    await sendMail({
      subject: `Contact · ${subject}`,
      html,
      text,
      replyTo: email,
    });
  } catch (e) {
    console.error("[contact] email", e);
    return NextResponse.json(
      { ok: false, error: `Could not send just now. Email ${site.supportEmail} instead.` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
