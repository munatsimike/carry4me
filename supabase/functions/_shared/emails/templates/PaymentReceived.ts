import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderParagraph,
  type NotificationEmailInput,
} from "../utils.ts";
import { escapeHtml } from "../escapeHtml.ts";

function renderPaymentContactParagraph(text: string): string {
  const match = text.match(/^(Name|Phone):\s*(.+)$/i);
  if (!match) {
    return renderParagraph(text);
  }

  const label = match[1];
  const value = match[2];
  return `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#334155;">${escapeHtml(label)}: <strong>${escapeHtml(value)}</strong></p>`;
}

function renderPaymentExtraParagraphs(paragraphs: string[] | undefined): string {
  return (paragraphs ?? []).map(renderPaymentContactParagraph).join("");
}

/** Sent when payment is completed (PAYMENT_COMPLETED). No CTA — contact details only. */
export function renderPaymentReceivedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderPaymentExtraParagraphs(notification.extraParagraphs)}
  `;

  const preheader = notification.body.includes("Your payment for this carry request")
    ? "Payment complete — arrange handover using the traveler's contact details."
    : "Payment received — arrange handover using the sender's contact details.";

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader,
    }),
    text: buildTextBody(notification, null),
  };
}
