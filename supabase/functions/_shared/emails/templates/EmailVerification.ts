import { renderEmailFooterText } from "../components/EmailFooter.ts";
import { renderEmailLayout } from "../components/EmailLayout.ts";
import { escapeHtml } from "../escapeHtml.ts";
import { renderCtaButton, renderParagraph } from "../utils.ts";

export function renderEmailVerificationEmail(verifyUrl: string): {
  html: string;
  text: string;
} {
  const contentHtml = `
    ${renderParagraph("Please verify your email to post parcels and trips on Carry4Me.")}
    ${renderCtaButton("Verify email", verifyUrl)}
    ${renderParagraph("If you did not create an account, you can ignore this email.")}
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#64748b;word-break:break-all;">
      ${escapeHtml(verifyUrl)}
    </p>
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
