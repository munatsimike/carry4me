import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderCtaButton,
  renderParagraph,
  type NotificationEmailInput,
  resolveAbsoluteLink,
} from "../utils.ts";

/** Fallback for any notification type without a dedicated template. */
export function renderGenericNotificationEmail(
  notification: NotificationEmailInput,
): { html: string; text: string } {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${absoluteLink ? renderCtaButton("View in Carry4Me", absoluteLink) : ""}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: notification.body.slice(0, 120),
    }),
    text: buildTextBody(notification),
  };
}
