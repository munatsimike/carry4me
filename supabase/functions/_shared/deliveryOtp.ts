import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export type DeliveryOtpVerifyResult = {
  ok: boolean;
  reason?: string;
  message?: string;
  attempts_remaining?: number;
};

export function isDeliveryOtpDevMode(): boolean {
  const flag = Deno.env.get("DELIVERY_OTP_DEV_MODE")?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  const appUrl = Deno.env.get("APP_URL")?.trim() ?? "";
  return (
    appUrl.includes("localhost") ||
    appUrl.includes("127.0.0.1") ||
    appUrl.includes("192.168.")
  );
}

export async function issueDeliveryOtp(
  supabaseAdmin: SupabaseClient,
  carryRequestId: string,
): Promise<{ ok: boolean; otp?: string; reason?: string }> {
  const { data, error } = await supabaseAdmin.rpc("issue_delivery_otp", {
    p_request_id: carryRequestId,
  });

  if (error) {
    console.error("issue_delivery_otp rpc failed", error.message);
    return { ok: false, reason: "ISSUE_FAILED" };
  }

  const result = data as { ok?: boolean; otp?: string; reason?: string };
  if (!result?.ok) {
    return { ok: false, reason: result?.reason ?? "ISSUE_FAILED" };
  }

  return { ok: true, otp: result.otp };
}

export async function verifyDeliveryOtpRpc(
  supabaseUser: SupabaseClient,
  carryRequestId: string,
  otp: string,
): Promise<DeliveryOtpVerifyResult> {
  const { data, error } = await supabaseUser.rpc("verify_delivery_otp", {
    p_request_id: carryRequestId,
    p_otp: otp,
  });

  if (error) {
    console.error("verify_delivery_otp rpc failed", error.message);
    return { ok: false, reason: "VERIFY_FAILED", message: error.message };
  }

  return (data ?? { ok: false, reason: "VERIFY_FAILED" }) as DeliveryOtpVerifyResult;
}

export async function assertCarryRequestParticipant(
  supabaseAdmin: SupabaseClient,
  carryRequestId: string,
  userId: string,
): Promise<
  | { ok: true; row: { sender_user_id: string; traveler_user_id: string; status: string } }
  | { ok: false; status: number; error: string }
> {
  const { data, error } = await supabaseAdmin
    .from("carry_requests")
    .select("id, sender_user_id, traveler_user_id, status")
    .eq("id", carryRequestId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 404, error: "Carry request not found" };
  }

  if (data.sender_user_id !== userId && data.traveler_user_id !== userId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, row: data };
}
