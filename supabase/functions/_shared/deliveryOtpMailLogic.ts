export const DELIVERY_OTP_RESEND_COOLDOWN_SECONDS = 60;
export const DELIVERY_OTP_DIGITS = /^\d{6}$/;

export type IssueDeliveryOtpRpcResult = {
  ok: boolean;
  reason?: string;
  notification_id?: string;
};

export function isSixDigitOtp(value: unknown): value is string {
  return typeof value === "string" && DELIVERY_OTP_DIGITS.test(value.trim());
}

export function parseIssueDeliveryOtpRpc(data: unknown): IssueDeliveryOtpRpcResult {
  if (!data || typeof data !== "object") {
    return { ok: false, reason: "ISSUE_FAILED" };
  }

  const row = data as { ok?: boolean; reason?: string; notification_id?: string };

  if (row.ok !== true) {
    return { ok: false, reason: row.reason ?? "ISSUE_FAILED" };
  }

  return {
    ok: true,
    notification_id: typeof row.notification_id === "string"
      ? row.notification_id
      : undefined,
  };
}

export function redactOtpDigits(value: string): string {
  return value.replace(/\d{6}/g, "[otp]");
}

export function deliveryOtpNotificationMetadata(
  carryRequestId: string,
  paymentPreference: string | null | undefined,
): Record<string, string> {
  return {
    carry_request_id: carryRequestId,
    payment_preference: paymentPreference?.trim() || "flexible",
  };
}
