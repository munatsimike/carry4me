import { getEmailCompanyConfig } from "../company.ts";
import { escapeHtml } from "../escapeHtml.ts";

/** Must live in <head> — Gmail ignores <style> in the body. */
export function renderEmailFooterHeadStyles(): string {
  return `
    .footer-mobile-only { display: none !important; max-height: 0 !important; overflow: hidden !important; mso-hide: all !important; }
    @media only screen and (max-width: 620px) {
      .footer-desktop-only { display: none !important; max-height: 0 !important; overflow: hidden !important; mso-hide: all !important; }
      .footer-mobile-only { display: table !important; max-height: none !important; overflow: visible !important; width: 100% !important; }
      .footer-mobile-only tr { display: table-row !important; }
      .footer-mobile-only td { display: table-cell !important; width: 100% !important; }
      .footer-outer-cell { padding: 20px 16px 8px 16px !important; }
      .footer-mobile-brand { text-align: center !important; padding-bottom: 20px !important; }
      .footer-mobile-brand img { margin: 0 auto !important; }
      .footer-mobile-section { padding-bottom: 16px !important; }
      .footer-mobile-section-last { padding-bottom: 0 !important; }
      .footer-social-cell { padding: 16px 16px 0 16px !important; }
      .footer-copyright-cell { padding: 16px 16px 20px 16px !important; }
    }
  `;
}

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
        <td align="center" class="footer-social-cell" style="padding:16px 24px 0 24px;font-family:Arial,Helvetica,sans-serif;">
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
         <a href="${escapeHtml(config.whatsappUrl)}" style="color:#2563eb;text-decoration:none;word-break:break-word;">WhatsApp</a>
       </div>`
    : "";

  const cellFont = "font-family:Arial,Helvetica,sans-serif;";

  const addressBlock = `
    <div style="font-size:13px;line-height:20px;font-weight:700;color:#0f172a;margin-bottom:6px;">Address</div>
    <div style="font-size:13px;line-height:20px;color:#475569;">${escapeHtml(config.address)}</div>`;

  const contactBlock = `
    <div style="font-size:13px;line-height:20px;font-weight:700;color:#0f172a;margin-bottom:6px;">Contact</div>
    <div style="font-size:13px;line-height:22px;color:#475569;">
      <div>
        <a href="mailto:${escapeHtml(config.supportEmail)}" style="color:#2563eb;text-decoration:none;word-break:break-word;">
          ${escapeHtml(config.supportEmail)}
        </a>
      </div>
      <div style="margin-top:10px;">
        <a href="tel:${escapeHtml(config.phone.replace(/\s/g, ""))}" style="color:#2563eb;text-decoration:none;">
          ${escapeHtml(config.phone)}
        </a>
      </div>
      ${whatsappHtml}
    </div>`;

  const logoBlock = `
    <a href="${escapeHtml(config.websiteUrl)}" style="text-decoration:none;display:inline-block;">
      <img
        src="${escapeHtml(config.logoUrl)}"
        width="130"
        alt="${escapeHtml(config.companyName)}"
        style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:130px;width:130px;"
      />
    </a>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
      <tr>
        <td align="center" class="footer-outer-cell" style="padding:28px 24px 8px 24px;${cellFont}">
          <!-- Desktop: 3 columns -->
          <!--[if mso]>
          <table role="presentation" width="552" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
          <td width="184" valign="top">
          <![endif]-->
          <table role="presentation" class="footer-desktop-only" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;width:100%;max-width:552px;">
            <tr>
              <td width="33.33%" valign="top" align="left" style="padding:0 12px 12px 0;${cellFont}">
                ${logoBlock}
              </td>
              <!--[if mso]></td><td width="184" valign="top"><![endif]-->
              <td width="33.33%" valign="top" align="left" style="padding:0 12px 12px 12px;${cellFont}">
                ${addressBlock}
              </td>
              <!--[if mso]></td><td width="184" valign="top"><![endif]-->
              <td width="33.33%" valign="top" align="left" style="padding:0 0 12px 12px;${cellFont}">
                ${contactBlock}
              </td>
            </tr>
          </table>
          <!--[if mso]></td></tr></table><![endif]-->

          <!-- Mobile: stacked -->
          <table role="presentation" class="footer-mobile-only" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;width:100%;max-width:552px;">
            <tr>
              <td align="center" class="footer-mobile-brand" style="padding:0 0 20px 0;${cellFont}">
                ${logoBlock}
              </td>
            </tr>
            <tr>
              <td align="left" class="footer-mobile-section" style="padding:0 0 16px 0;${cellFont}">
                ${addressBlock}
              </td>
            </tr>
            <tr>
              <td align="left" class="footer-mobile-section-last" style="padding:0;${cellFont}">
                ${contactBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>

      ${socialHtml}

      <tr>
        <td align="center" class="footer-copyright-cell" style="padding:16px 24px 24px 24px;${cellFont}font-size:12px;line-height:18px;color:#94a3b8;border-top:1px solid #e2e8f0;">
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
