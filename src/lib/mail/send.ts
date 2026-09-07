import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { site } from "@/lib/site";

function env(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export function mailConfig() {
  const host = env("SMTP_HOST", "smtp.gmail.com");
  const port = Number(env("SMTP_PORT", "587"));
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  return {
    host,
    port,
    secure: env("SMTP_SECURE") === "true" || port === 465,
    user,
    pass,
    from: env("MAIL_FROM", user ? `Mytulify <${user}>` : `Mytulify <${site.requestNotifyEmail}>`),
    to: env("MAIL_TO", site.requestNotifyEmail),
  };
}

export function isMailConfigured(): boolean {
  const { user, pass } = mailConfig();
  return Boolean(user && pass);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  const cfg = mailConfig();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
  }
  return transporter;
}

export async function sendMail(opts: {
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}): Promise<void> {
  if (!isMailConfigured()) {
    throw new Error("SMTP is not configured (set SMTP_USER and SMTP_PASS).");
  }
  const cfg = mailConfig();
  await getTransporter().sendMail({
    from: cfg.from,
    to: cfg.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo || undefined,
  });
}
