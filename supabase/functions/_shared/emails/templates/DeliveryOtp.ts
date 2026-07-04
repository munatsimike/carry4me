import { renderEmailLayout } from "../components/EmailLayout.ts";
import { escapeHtml } from "../escapeHtml.ts";
import {
  buildTextBody,
  renderParagraph,
  type NotificationEmailInput,
} from "../utils.ts";

function renderDeliveryOtpParagraph(body: string): string {
  const match = body.match(/^(.*?)(\d{6})(.*)$/s);
  if (!match) {
    return renderParagraph(body);
  }

  const [, before, otp, after] = match;

  return `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#334155;">${escapeHtml(before)}<strong style="font-weight:700;">${escapeHtml(otp)}</strong>${escapeHtml(after)}</p>`;
}

/** Sent when a payment release code is issued (DELIVERY_OTP). */
export function renderDeliveryOtpEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const contentHtml = renderDeliveryOtpParagraph(notification.body);

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: notification.body.slice(0, 120),
    }),
    text: buildTextBody(notification, null),
  };
}
