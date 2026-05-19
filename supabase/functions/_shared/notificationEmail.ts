export const RESEND_API_URL = "https://api.resend.com/emails";
export const FROM_ADDRESS = "Carry4Me <notifications@carry4me.uk>";

export type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link: string | null;
};

export type ProfileRow = {
  email: string | null;
  email_verified: boolean;
};

export type SendNotificationEmailOutcome =
  | { sent: true; messageId: string | null }
  | { sent: false; reason: "email_missing" | "email_not_verified" };

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildNotificationEmailBodies(notification: NotificationRow) {
  const appUrl = (Deno.env.get("APP_URL") ?? "https://carry4me.uk").replace(
    /\/$/,
    "",
  );
  const absoluteLink = notification.link
    ? notification.link.startsWith("http")
      ? notification.link
      : `${appUrl}${notification.link.startsWith("/") ? notification.link : `/${notification.link}`}`
    : null;

  const textBody = absoluteLink
    ? `${notification.body}\n\n${absoluteLink}`
    : notification.body;

  const htmlBody = absoluteLink
    ? `<p>${escapeHtml(notification.body)}</p><p><a href="${escapeHtml(absoluteLink)}">View in Carry4Me</a></p>`
    : `<p>${escapeHtml(notification.body)}</p>`;

  return { textBody, htmlBody };
}

export async function sendNotificationEmailViaResend(
  notification: NotificationRow,
  profile: ProfileRow,
  resendApiKey: string,
): Promise<SendNotificationEmailOutcome> {
  if (!profile.email?.trim()) {
    return { sent: false, reason: "email_missing" };
  }

  if (profile.email_verified !== true) {
    return { sent: false, reason: "email_not_verified" };
  }

  const { textBody, htmlBody } = buildNotificationEmailBodies(notification);

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

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    throw new Error(`Resend API error (${resendResponse.status}): ${resendError}`);
  }

  const resendData = (await resendResponse.json()) as { id?: string };
  return { sent: true, messageId: resendData.id ?? null };
}
