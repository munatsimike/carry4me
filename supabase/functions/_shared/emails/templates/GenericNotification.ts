import { renderEmailLayout } from "../components/EmailLayout.ts";
import {
  renderCtaButton,
  renderParagraph,
  type NotificationEmailInput,
  resolveAbsoluteLink,
} from "../utils.ts";

/** Fallback for any notification type without a dedicated template. */
export function renderGenericNotificationEmail(
  notification: NotificationEmailInput,
): { html: string; text: string } {
  const type = notification.type?.trim().toUpperCase() ?? "";
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const ctaConfig = getGenericCtaConfig(type);
  const showCta = Boolean(absoluteLink && ctaConfig);
  const contentHtml = `
    ${renderParagraph(notification.body)}
    ${showCta ? renderCtaButton(ctaConfig!.label, absoluteLink!) : ""}
  `;

  const textParts = [notification.body];
  if (showCta) {
    textParts.push("", `${ctaConfig!.label}: ${absoluteLink}`);
  }

  return {
    html: renderEmailLayout(contentHtml, {
      title: notification.title,
      preheader: notification.body.slice(0, 120),
    }),
    text: textParts.join("\n"),
  };
}

function getGenericCtaConfig(
  type: string,
): { label: string } | null {
  switch (type) {
    case "REQUEST_SENT":
      return { label: "View request" };
    case "REQUEST_REJECTED":
      return { label: "Find another match" };
    case "REQUEST_CANCELED":
      return { label: "Browse options" };
    case "PAYMENT_COMPLETED":
      return { label: "Confirm handover" };
    default:
      return null;
  }
}
