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

/** Sent when one party confirms handover and the other still needs to confirm. */
export function renderHandoverConfirmedEmail(notification: NotificationEmailInput): {
  html: string;
  text: string;
} {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const ctaLabel = resolveCtaLabel(notification) ?? "Confirm handover";
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${renderExtraParagraphs(notification.extraParagraphs)}
    ${absoluteLink ? renderCtaButton(ctaLabel, absoluteLink) : ""}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: "Please confirm handover on Carry4Me.",
    }),
    text: buildTextBody(notification, ctaLabel),
  };
}
