import { getEmailCompanyConfig } from "../company.ts";
import { escapeHtml } from "../escapeHtml.ts";

export function renderEmailFooter(): string {
  const config = getEmailCompanyConfig();

  const socialLinks = [
    config.social.facebook ? { label: "Facebook", href: config.social.facebook } : null,
    config.social.instagram ? { label: "Instagram", href: config.social.instagram } : null,
    config.social.twitter ? { label: "Twitter", href: config.social.twitter } : null,
  ].filter((item): item is { label: string; href: string } => item !== null);

  const socialHtml = socialLinks.length > 0
    ? `
      <tr>
        <td align="center" style="padding:16px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
          ${socialLinks.map((link, index) => `
            <a href="${escapeHtml(link.href)}" style="color:#2563eb;text-decoration:none;font-size:13px;font-weight:600;">
              ${escapeHtml(link.label)}
            </a>${index < socialLinks.length - 1 ? `<span style="color:#cbd5e1;padding:0 8px;">|</span>` : ""}
          `).join("")}
        </td>
      </tr>`
    : "";

  const whatsappHtml = config.whatsappUrl
    ? `<div style="margin-top:10px;">
         <a href="${escapeHtml(config.whatsappUrl)}" style="color:#2563eb;text-decoration:none;">WhatsApp</a>
       </div>`
    : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
      <tr>
        <td align="center" style="padding:28px 24px 20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:600px;">
            <tr>
              <!-- Column 1: Brand -->
              <td width="34%" valign="top" style="padding:0 12px 12px 0;font-family:Arial,Helvetica,sans-serif;">
                <a href="${escapeHtml(config.websiteUrl)}" style="text-decoration:none;">
                  <img
                    src="${escapeHtml(config.logoUrl)}"
                    width="130"
                    alt="${escapeHtml(config.companyName)}"
                    style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:130px;width:100%;margin:0;"
                  />
                </a>
              </td>

              <!-- Column 2: Address -->
              <td width="33%" valign="top" style="padding:0 12px 12px 12px;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:13px;line-height:20px;font-weight:700;color:#0f172a;margin-bottom:6px;">
                  Address
                </div>
                <div style="font-size:13px;line-height:20px;color:#475569;">
                  ${escapeHtml(config.address)}
                </div>
              </td>

              <!-- Column 3: Contact -->
              <td width="33%" valign="top" style="padding:0 0 12px 12px;font-family:Arial,Helvetica,sans-serif;">
                <div style="font-size:13px;line-height:20px;font-weight:700;color:#0f172a;margin-bottom:6px;">
                  Contact
                </div>
                <div style="font-size:13px;line-height:22px;color:#475569;">
                  <div>
                    <a href="mailto:${escapeHtml(config.supportEmail)}" style="color:#2563eb;text-decoration:none;">
                      ${escapeHtml(config.supportEmail)}
                    </a>
                  </div>
                  <div style="margin-top:10px;">
                    <a href="tel:${escapeHtml(config.phone.replace(/\s/g, ""))}" style="color:#2563eb;text-decoration:none;">
                      ${escapeHtml(config.phone)}
                    </a>
                  </div>
                  ${whatsappHtml}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${socialHtml}

      <tr>
        <td align="center" style="padding:18px 24px 24px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#94a3b8;border-top:1px solid #e2e8f0;">
          ${escapeHtml(config.copyrightText)}
        </td>
      </tr>
    </table>
  `;
}

/** Plain-text footer for multipart emails. */
export function renderEmailFooterText(): string {
  const config = getEmailCompanyConfig();
  const lines = [
    config.companyName,
    config.websiteUrl,
    config.address,
    `Email: ${config.supportEmail}`,
    `Phone: ${config.phone}`,
  ];

  if (config.whatsappUrl) {
    lines.push(`WhatsApp: ${config.whatsappUrl}`);
  }

  lines.push("", config.copyrightText);
  return lines.join("\n");
}
