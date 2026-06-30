import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderParagraph,
  type NotificationEmailInput,
} from "../utils.ts";

/** Sent when payout is released to the traveler (PAYMENT_RELEASED). */
export function renderPaymentReleasedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const contentHtml = renderParagraph(notification.body);

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: notification.body.slice(0, 120),
    }),
    text: buildTextBody(notification, null),
  };
}
