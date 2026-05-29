import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderExtraParagraphs,
  renderParagraph,
  type NotificationEmailInput,
} from "../utils.ts";

/** Sent when both parties confirm handover — informational only, no CTA. */
export function renderParcelReceivedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderExtraParagraphs(notification.extraParagraphs)}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: "Handover confirmed — the parcel is now in transit.",
    }),
    text: buildTextBody(notification, null),
  };
}
