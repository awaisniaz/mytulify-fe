import { site } from "@/lib/site";
import { sendMail } from "./send";

const BRAND = "#ea580c";
const INK = "#1c1917";
const MUTED = "#78716c";
const CREAM = "#f8f7f4";
const WHITE = "#ffffff";
const BORDER = "#e7e5e4";
const LOGO = "https://www.mytulify.com/logo.png";

export type ToolRequestEmailInput = {
  id: string;
  toolName: string;
  description: string;
  categoryLabel: string;
  requesterName: string | null;
  requesterEmail: string | null;
  createdAt: number;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\r\n|\n|\r/g, "<br/>");
}

function formatWhen(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
  });
}

function row(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding:12px 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};font-weight:700;">
        ${escapeHtml(label)}
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 14px;font-size:15px;line-height:1.55;color:${INK};border-bottom:1px solid ${BORDER};">
        ${valueHtml}
      </td>
    </tr>`;
}

export function buildToolRequestEmail(input: ToolRequestEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const when = formatWhen(input.createdAt);
  const name = input.requesterName || "Not provided";
  const email = input.requesterEmail || "Not provided";
  const mailto = input.requesterEmail
    ? `<a href="mailto:${escapeHtml(input.requesterEmail)}" style="color:${BRAND};text-decoration:none;font-weight:600;">${escapeHtml(input.requesterEmail)}</a>`
    : escapeHtml(email);

  const subject = `New tool request · ${input.toolName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${CREAM};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="padding:0 8px 20px;">
              <img src="${LOGO}" alt="Mytulify" width="140" style="display:block;height:auto;"/>
            </td>
          </tr>
          <tr>
            <td style="background:${WHITE};border:1px solid ${BORDER};border-radius:16px;overflow:hidden;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="height:6px;background:${BRAND};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:28px 32px 8px;">
                    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND};font-weight:700;font-family:Arial,Helvetica,sans-serif;">
                      Tool request
                    </p>
                    <h1 style="margin:0;font-size:26px;line-height:1.25;color:${INK};font-weight:800;">
                      ${escapeHtml(input.toolName)}
                    </h1>
                    <p style="margin:10px 0 0;font-size:14px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">
                      Submitted ${escapeHtml(when)} PKT
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 28px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-family:Arial,Helvetica,sans-serif;">
                      ${row("Requested tool", `<strong>${escapeHtml(input.toolName)}</strong>`)}
                      ${row("Category", escapeHtml(input.categoryLabel))}
                      ${row("What it should do", nl2br(input.description))}
                      ${row("Requester name", escapeHtml(name))}
                      ${row("Requester email", mailto)}
                    </table>
                    ${
                      input.requesterEmail
                        ? `<p style="margin:22px 0 0;">
                            <a href="mailto:${escapeHtml(input.requesterEmail)}?subject=${encodeURIComponent("Re: your Mytulify tool request — " + input.toolName)}"
                               style="display:inline-block;background:${BRAND};color:${WHITE};text-decoration:none;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;">
                              Reply to requester
                            </a>
                          </p>`
                        : ""
                    }
                    <p style="margin:22px 0 0;font-size:12px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">
                      Request ID: ${escapeHtml(input.id)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 8px 0;font-size:12px;color:${MUTED};font-family:Arial,Helvetica,sans-serif;">
              This email was sent by ${escapeHtml(site.name)} because someone submitted
              <a href="https://www.mytulify.com/request-tool" style="color:${BRAND};text-decoration:none;">Request a Tool</a>.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `New tool request — ${site.name}`,
    ``,
    `Tool: ${input.toolName}`,
    `Category: ${input.categoryLabel}`,
    `Submitted: ${when} PKT`,
    ``,
    `What it should do:`,
    input.description,
    ``,
    `Requester name: ${name}`,
    `Requester email: ${email}`,
    ``,
    `Request ID: ${input.id}`,
    `https://www.mytulify.com/request-tool`,
  ].join("\n");

  return { subject, html, text };
}

export async function sendToolRequestEmail(input: ToolRequestEmailInput): Promise<void> {
  const { subject, html, text } = buildToolRequestEmail(input);
  await sendMail({
    subject,
    html,
    text,
    replyTo: input.requesterEmail,
  });
}
