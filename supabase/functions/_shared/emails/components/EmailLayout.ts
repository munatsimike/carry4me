import { renderEmailFooter, renderEmailFooterHeadStyles } from "./EmailFooter.ts";

export type EmailLayoutOptions = {
  /** Optional preheader shown in inbox preview (hidden in body). */
  preheader?: string;
  title?: string;
};

/**
 * Wraps email body HTML in a 600px centered card.
 * Outer table = full-width background; inner = content + shared footer.
 */
export function renderEmailLayout(
  contentHtml: string,
  options: EmailLayoutOptions = {},
): string {
  const preheader = options.preheader?.trim();
  const title = options.title?.trim();

  const preheaderHtml = preheader
    ? `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${preheader}
    </div>`
    : "";

  const titleHtml = title
    ? `
          <tr>
            <td style="padding:32px 32px 8px 32px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#0f172a;">
              ${title}
            </td>
          </tr>`
    : "";

  const contentPaddingTop = title ? "8px" : "32px";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title ?? "Carry4Me"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin:0 !important; padding:0 !important; width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:#2563eb; }
    @media only screen and (max-width:620px) {
      .email-container { width:100% !important; max-width:100% !important; }
      .email-content-cell { padding-left:20px !important; padding-right:20px !important; }
    }
    ${renderEmailFooterHeadStyles()}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if mso]>
        <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
          ${titleHtml}
          <tr>
            <td class="email-content-cell" style="padding:${contentPaddingTop} 32px 32px 32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#334155;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              ${renderEmailFooter()}
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
