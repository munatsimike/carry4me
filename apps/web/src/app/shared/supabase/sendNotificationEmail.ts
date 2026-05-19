import { AppError } from "@/app/shared/domain/AppError";
import { supabase } from "@/app/shared/supabase/client";

export type SendNotificationEmailResult = {
  ok: boolean;
  sent: boolean;
  reason?: "email_missing" | "email_not_verified";
  messageId?: string | null;
  error?: string;
};

export async function sendNotificationEmail(
  notificationId: string,
): Promise<SendNotificationEmailResult> {
  const id = notificationId.trim();
  if (!id) {
    throw new AppError({ message: "notificationId is required", code: "INVALID_INPUT" });
  }

  const { data, error } = await supabase.functions.invoke("send-notification-email", {
    body: { notificationId: id },
  });

  if (error) {
    throw AppError.fromUnknown(error);
  }

  const result = data as SendNotificationEmailResult | null;
  if (result?.error) {
    throw new AppError({ message: result.error, code: "EMAIL_SEND_FAILED" });
  }

  return result ?? { ok: true, sent: false };
}
