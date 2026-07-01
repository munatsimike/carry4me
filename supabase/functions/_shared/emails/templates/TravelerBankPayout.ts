import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderParagraph,
  type NotificationEmailInput,
} from "../utils.ts";

/** Sent when Stripe pays out Connect earnings to the traveler's bank (TRAVELER_BANK_PAYOUT). */
export function renderTravelerBankPayoutEmail(notification: NotificationEmailInput): {
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
