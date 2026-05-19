import { AppError } from "@/app/shared/domain/AppError";
import { supabase } from "@/app/shared/supabase/client";

export type SendEmailVerificationResult = {
  ok: boolean;
  sent: boolean;
  reason?: "already_verified";
  messageId?: string | null;
  error?: string;
};

export async function sendEmailVerification(): Promise<SendEmailVerificationResult> {
  const { data, error } = await supabase.functions.invoke("send-email-verification", {
    body: {},
  });

  if (error) {
    throw AppError.fromUnknown(error);
  }

  const result = data as SendEmailVerificationResult | null;
  if (result?.error) {
    throw new AppError({ message: result.error, code: "EMAIL_VERIFICATION_FAILED" });
  }

  return result ?? { ok: true, sent: false };
}
