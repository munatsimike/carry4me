import { renderEmailFooterText } from "../components/EmailFooter.ts";
import { renderEmailLayout } from "../components/EmailLayout.ts";
import { renderCtaButton, renderParagraph } from "../utils.ts";

export function renderEmailVerificationEmail(verifyUrl: string): {
  html: string;
  text: string;
} {
  const contentHtml = `
    ${renderParagraph("Please verify your email to post parcels and trips on Carry4Me.")}
    ${renderCtaButton("Verify email", verifyUrl)}
    ${renderParagraph("After you click the button, Carry4Me will show a confirmation that your email is verified.")}
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
      "Verify your email:",
      verifyUrl,
      "",
      "After you open the link, Carry4Me will show a confirmation that your email is verified.",
      "",
      "If you did not create an account, you can ignore this email.",
      "",
      renderEmailFooterText(),
    ].join("\n"),
  };
}
