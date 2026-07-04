import { renderEmailFooterText } from "./components/EmailFooter.ts";
import { renderDeliveryOtpEmail } from "./templates/DeliveryOtp.ts";
import { renderGenericNotificationEmail } from "./templates/GenericNotification.ts";
import { renderHandoverConfirmedEmail } from "./templates/HandoverConfirmed.ts";
import { renderParcelReceivedEmail } from "./templates/ParcelReceived.ts";
import { renderPaymentReceivedEmail } from "./templates/PaymentReceived.ts";
import { renderPaymentReleasedEmail } from "./templates/PaymentReleased.ts";
import { renderTravelerBankPayoutEmail } from "./templates/TravelerBankPayout.ts";
import { renderRequestAcceptedEmail } from "./templates/RequestAccepted.ts";
import type { NotificationEmailInput } from "./utils.ts";

export type RenderedEmail = { html: string; text: string };

/**
 * Pick a template by notification type, wrap in EmailLayout (footer included).
 */
export function renderNotificationEmail(
  notification: NotificationEmailInput,
): RenderedEmail {
  const type = notification.type?.trim().toUpperCase();

  let rendered: RenderedEmail;

  switch (type) {
    case "REQUEST_ACCEPTED":
      rendered = renderRequestAcceptedEmail(notification);
      break;
    case "PAYMENT_COMPLETED":
      rendered = renderPaymentReceivedEmail(notification);
      break;
    case "PAYMENT_RELEASED":
      rendered = renderPaymentReleasedEmail(notification);
      break;
    case "TRAVELER_BANK_PAYOUT":
      rendered = renderTravelerBankPayoutEmail(notification);
      break;
    case "HANDOVER_CONFIRMED":
      rendered = renderHandoverConfirmedEmail(notification);
      break;
    case "PARCEL_RECEIVED":
      rendered = renderParcelReceivedEmail(notification);
      break;
    case "DELIVERY_OTP":
      rendered = renderDeliveryOtpEmail(notification);
      break;
    default:
      rendered = renderGenericNotificationEmail(notification);
      break;
  }

  return {
    html: rendered.html,
    text: `${rendered.text}\n\n${renderEmailFooterText()}`,
  };
}

export { renderEmailVerificationEmail } from "./templates/EmailVerification.ts";
export { renderEmailLayout } from "./components/EmailLayout.ts";
export { renderEmailFooter, renderEmailFooterText } from "./components/EmailFooter.ts";
export { getEmailCompanyConfig, getAppUrl } from "./company.ts";
