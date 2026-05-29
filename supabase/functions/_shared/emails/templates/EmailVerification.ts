import { renderEmailFooterText } from "../components/EmailFooter.ts";
import { renderEmailLayout } from "../components/EmailLayout.ts";
import { escapeHtml } from "../escapeHtml.ts";
import { renderParagraph } from "../utils.ts";

export function renderEmailVerificationEmail(verifyUrl: string): {
  html: string;
  text: string;
} {
  const safeUrl = escapeHtml(verifyUrl);
  const contentHtml = `
    ${renderParagraph("Please verify your email to post parcels and trips on Carry4Me.")}
    <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;word-break:break-all;">
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${safeUrl}</a>
    </p>
    ${renderParagraph("If you did not create an account, you can ignore this email.")}
  `;

  return {
    html: renderEmailLayout(contentHtml, {
      title: "Verify your email",
      preheader: "Confirm your Carry4Me email address.",
    }),
    text: [
      "Please verify your email to post parcels and trips on Carry4Me.",
      "",
      verifyUrl,
      "",
      "If you did not create an account, you can ignore this email.",
      "",
      renderEmailFooterText(),
    ].join("\n"),
  };
}
