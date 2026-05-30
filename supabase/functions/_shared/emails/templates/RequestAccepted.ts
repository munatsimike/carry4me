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

export function renderRequestAcceptedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const ctaLabel = resolveCtaLabel(notification);
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderExtraParagraphs(notification.extraParagraphs)}
    ${absoluteLink && ctaLabel ? renderCtaButton(ctaLabel, absoluteLink) : ""}
  `;

  const preheader = notification.paymentRequired
    ? "Your carry request was accepted — make payment to continue."
    : "Your carry request was accepted.";

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader,
    }),
    text: buildTextBody(notification),
  };
}
