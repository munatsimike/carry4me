import { getAppUrl } from "./company.ts";
import { escapeHtml } from "./escapeHtml.ts";

export type NotificationEmailInput = {
  title: string;
  body: string;
  link: string | null;
  type?: string;
};

export function resolveAbsoluteLink(link: string | null): string | null {
  if (!link?.trim()) return null;
  const appUrl = getAppUrl();
  return link.startsWith("http")
    ? link
    : `${appUrl}${link.startsWith("/") ? link : `/${link}`}`;
}

/** Bulletproof CTA button — table + inline styles for Outlook. */
export function renderCtaButton(label: string, href: string): string {
  const safeLabel = escapeHtml(label);
  const safeHref = escapeHtml(href);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px 0;">
      <tr>
        <td align="left" bgcolor="#2563eb" style="border-radius:6px;background-color:#2563eb;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:220px;" arcsize="12%" strokecolor="#2563eb" fillcolor="#2563eb">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">${safeLabel}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${safeHref}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;background-color:#2563eb;">
            ${safeLabel}
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  `;
}

export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#334155;">${escapeHtml(text)}</p>`;
}

export function buildTextBody(
  notification: NotificationEmailInput,
  ctaLabel = "View in Carry4Me",
): string {
  const absoluteLink = resolveAbsoluteLink(notification.link);
  const parts = [notification.body];
  if (absoluteLink) {
    parts.push("", `${ctaLabel}: ${absoluteLink}`);
  }
  return parts.join("\n");
}
