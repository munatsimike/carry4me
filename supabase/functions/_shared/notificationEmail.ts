export const RESEND_API_URL = "https://api.resend.com/emails";
export const FROM_ADDRESS = "Carry4Me <notifications@carry4me.uk>";

export { escapeHtml } from "./emails/escapeHtml.ts";
export { renderNotificationEmail } from "./emails/renderNotificationEmail.ts";

import { renderNotificationEmail } from "./emails/renderNotificationEmail.ts";
import type { NotificationEmailInput } from "./emails/utils.ts";

export type NotificationRow = {
  id: string;
  user_id: string;
  type?: string;
  title: string;
  body: string;
  link: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ProfileRow = {
  email: string | null;
  email_verified: boolean;
};

export type SendNotificationEmailOutcome =
  | { sent: true; messageId: string | null; providerResponse: unknown }
  | { sent: false; reason: "email_missing" | "email_not_verified" };

export function buildNotificationEmailBodies(
  notification: NotificationRow | NotificationEmailInput,
) {
  const input: NotificationEmailInput = {
    title: notification.title,
    body: notification.body,
    link: notification.link,
    type: notification.type,
    extraParagraphs: "extraParagraphs" in notification
      ? notification.extraParagraphs
      : undefined,
    ctaLabel: "ctaLabel" in notification ? notification.ctaLabel : undefined,
    paymentRequired: "paymentRequired" in notification
      ? notification.paymentRequired
      : undefined,
  };

  return renderNotificationEmail(input);
}

export type SendNotificationEmailOptions = {
  /** When false, send if profile has an email (carry-request transactional mail). */
  requireEmailVerified?: boolean;
};

export async function sendNotificationEmailViaResend(
  notification: NotificationRow | NotificationEmailInput,
  profile: ProfileRow,
  resendApiKey: string,
  options: SendNotificationEmailOptions = {},
): Promise<SendNotificationEmailOutcome> {
  const requireEmailVerified = options.requireEmailVerified !== false;

  if (!profile.email?.trim()) {
    return { sent: false, reason: "email_missing" };
  }

  if (requireEmailVerified && profile.email_verified !== true) {
    return { sent: false, reason: "email_not_verified" };
  }

  const { html: htmlBody, text: textBody } = buildNotificationEmailBodies(notification);

  const resendResponse = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [profile.email],
      subject: notification.title,
      html: htmlBody,
      text: textBody,
    }),
  });

  const responseText = await resendResponse.text();
  let providerResponse: unknown = responseText;

  try {
    providerResponse = JSON.parse(responseText);
  } catch {
    // keep raw text
  }

  if (!resendResponse.ok) {
    throw new Error(
      `Resend API error (${resendResponse.status}): ${responseText}`,
    );
  }

  const resendData = providerResponse as { id?: string };
  return {
    sent: true,
    messageId: resendData.id ?? null,
    providerResponse,
  };
}
