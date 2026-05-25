import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderCtaButton,
  renderParagraph,
  type NotificationEmailInput,
  resolveAbsoluteLink,
} from "../utils.ts";

/** Sent when payment is completed (PAYMENT_COMPLETED). */
export function renderPaymentReceivedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderParagraph("You can now proceed to handover when you are ready.")}
    ${absoluteLink ? renderCtaButton("View request", absoluteLink) : ""}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: "Payment received — handover is next.",
    }),
    text: buildTextBody(notification),
  };
}
