import { AppError } from "@/app/shared/domain/AppError";
import { supabase } from "@/app/shared/supabase/client";

export type VerifyEmailResult = {
  ok: boolean;
  verified: boolean;
  alreadyVerified?: boolean;
  error?: string;
};

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new AppError({ message: "token is required", code: "INVALID_INPUT" });
  }

  const { data, error } = await supabase.functions.invoke("verify-email", {
    body: { token: trimmed },
  });

  if (error) {
    throw AppError.fromUnknown(error);
  }

  const result = data as VerifyEmailResult | null;

  if (!result) {
    return { ok: false, verified: false };
  }

  if (result.verified) {
    return result;
  }

  if (result.error) {
    return result;
  }

  return result;
}
