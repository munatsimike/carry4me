import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderCtaButton,
  renderParagraph,
  type NotificationEmailInput,
  resolveAbsoluteLink,
} from "../utils.ts";

export function renderRequestAcceptedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderParagraph("Please complete payment within the reservation window to secure this carry request.")}
    ${absoluteLink ? renderCtaButton("Complete payment", absoluteLink) : ""}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: "Your carry request was accepted — payment is required.",
    }),
    text: buildTextBody(notification, "Complete payment"),
  };
}
