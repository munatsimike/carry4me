import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { senderPaymentCodeEmailBody } from "./paymentPreference.ts";
import type { NotificationEmailInput } from "./emails/utils.ts";
import { isSixDigitOtp, redactOtpDigits } from "./deliveryOtpMailLogic.ts";

export {
  DELIVERY_OTP_DIGITS,
  DELIVERY_OTP_RESEND_COOLDOWN_SECONDS,
  deliveryOtpNotificationMetadata,
  isSixDigitOtp,
  parseIssueDeliveryOtpRpc,
  redactOtpDigits,
} from "./deliveryOtpMailLogic.ts";
export type { IssueDeliveryOtpRpcResult } from "./deliveryOtpMailLogic.ts";

export function buildDeliveryOtpEmailInput(input: {
  title: string;
  link: string | null;
  otp: string;
  paymentPreference: string | null | undefined;
}): NotificationEmailInput | null {
  if (!isSixDigitOtp(input.otp)) {
    return null;
  }

  return {
    title: input.title,
    body: senderPaymentCodeEmailBody(input.otp.trim(), input.paymentPreference),
    link: input.link,
    type: "DELIVERY_OTP",
    ctaLabel: null,
  };
}

export async function peekDeliveryOtpSecret(
  supabaseAdmin: SupabaseClient,
  notificationId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("delivery_otp_email_secrets")
    .select("otp")
    .eq("notification_id", notificationId)
    .maybeSingle<{ otp: string }>();

  if (error) {
    console.error(
      "delivery_otp_email_secrets peek failed",
      redactOtpDigits(error.message),
    );
    return null;
  }

  return isSixDigitOtp(data?.otp) ? data.otp.trim() : null;
}

export async function deleteDeliveryOtpSecret(
  supabaseAdmin: SupabaseClient,
  notificationId: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("delivery_otp_email_secrets")
    .delete()
    .eq("notification_id", notificationId);

  if (error) {
    console.error(
      "delivery_otp_email_secrets delete failed",
      redactOtpDigits(error.message),
    );
  }
}
