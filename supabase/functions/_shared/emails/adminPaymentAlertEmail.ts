import { escapeHtml } from "../emails/escapeHtml.ts";
import { renderEmailLayout } from "../emails/components/EmailLayout.ts";
import { FROM_ADDRESS, RESEND_API_URL } from "../notificationEmail.ts";

const DEFAULT_ADMIN_OPS_NOTIFY_EMAILS = [
  "info@carry4me.uk",
  "munatsimike@gmail.com",
];

export type AdminPaymentAlertDetails = {
  subject: string;
  headline: string;
  rows: { label: string; value: string }[];
};

function parseAdminOpsNotifyEmails(): string[] {
  const raw =
    Deno.env.get("ADMIN_OPS_NOTIFY_EMAILS")?.trim() ||
    Deno.env.get("ADMIN_LISTING_NOTIFY_EMAILS")?.trim();

  if (!raw) {
    return DEFAULT_ADMIN_OPS_NOTIFY_EMAILS;
  }

  return raw
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

function buildAdminPaymentAlertEmail(details: AdminPaymentAlertDetails): {
  subject: string;
  html: string;
  text: string;
} {
  const detailRowsHtml = details.rows
    .map(
      (row) => `
            <tr>
              <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#64748b;width:140px;vertical-align:top;">
                ${escapeHtml(row.label)}
              </td>
              <td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#0f172a;font-weight:600;">
                ${escapeHtml(row.value)}
              </td>
            </tr>`,
    )
    .join("");

  const htmlBody = `
          <tr>
            <td style="padding:8px 32px 24px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#334155;">
              ${escapeHtml(details.headline)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                ${detailRowsHtml}
              </table>
            </td>
          </tr>`;

  const textLines = [
    details.headline,
    "",
    ...details.rows.map((row) => `${row.label}: ${row.value}`),
  ];

  return {
    subject: details.subject,
    html: renderEmailLayout(htmlBody, {
      title: details.subject,
      preheader: details.headline,
    }),
    text: textLines.join("\n"),
  };
}

export async function sendAdminPaymentAlertEmail(
  details: AdminPaymentAlertDetails,
  resendApiKey: string | null | undefined,
): Promise<{ sent: boolean; messageId: string | null; skippedReason?: string }> {
  if (!resendApiKey?.trim()) {
    return { sent: false, messageId: null, skippedReason: "RESEND_API_KEY missing" };
  }

  const recipients = parseAdminOpsNotifyEmails();
  if (recipients.length === 0) {
    return { sent: false, messageId: null, skippedReason: "no admin recipients" };
  }

  const { subject, html, text } = buildAdminPaymentAlertEmail(details);

  const resendResponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: recipients,
      subject,
      html,
      text,
    }),
  });

  const responseText = await resendResponse.text();
  if (!resendResponse.ok) {
    throw new Error(
      `Resend API error (${resendResponse.status}): ${responseText}`,
    );
  }

  let messageId: string | null = null;
  try {
    const payload = JSON.parse(responseText) as { id?: string };
    messageId = payload.id ?? null;
  } catch {
    // keep null
  }

  return { sent: true, messageId };
}
