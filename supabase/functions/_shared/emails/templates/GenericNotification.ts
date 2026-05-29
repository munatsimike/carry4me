import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  buildTextBody,
  renderCtaButton,
  renderExtraParagraphs,
  renderParagraph,
  resolveCtaLabel,
  type NotificationEmailInput,
  resolveAbsoluteLink,
} from "../utils.ts";

/** Fallback for any notification type without a dedicated template. */
export function renderGenericNotificationEmail(
  notification: NotificationEmailInput,
): { html: string; text: string } {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const ctaLabel = resolveCtaLabel(notification);
  const showCta = Boolean(absoluteLink && ctaLabel);
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderExtraParagraphs(notification.extraParagraphs)}
    ${showCta ? renderCtaButton(ctaLabel!, absoluteLink!) : ""}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: notification.body.slice(0, 120),
    }),
    text: buildTextBody(notification),
  };
}
