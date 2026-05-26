import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { verifyDeliveryOtpRpc } from "../_shared/deliveryOtp.ts";

type RequestBody = {
  carry_request_id?: string;
  otp?: string;
};

const REASON_MESSAGES: Record<string, string> = {
  OTP_INVALID: "Incorrect code. Please try again.",
  OTP_EXPIRED: "This code has expired. Ask the sender to request a new code.",
  OTP_ATTEMPTS_EXCEEDED:
    "Too many failed attempts. Request a new code from the sender.",
  OTP_NOT_GENERATED: "No delivery code is active yet. Wait for delivery confirmation.",
  INVALID_STATUS: "This request is not ready for payout release.",
  FORBIDDEN: "Only the traveler can verify the delivery code.",
  NOT_FOUND: "Carry request not found.",
};

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = (await req.json()) as RequestBody;
    const carryRequestId = body.carry_request_id?.trim();
    const otp = body.otp?.trim();

    if (!carryRequestId || !otp) {
      return jsonResponse({ error: "carry_request_id and otp are required" }, 400);
    }

    const { supabaseUser } = await getAuthenticatedUser(req);

    const result = await verifyDeliveryOtpRpc(supabaseUser, carryRequestId, otp);

    if (!result.ok) {
      const message =
        result.message ??
        REASON_MESSAGES[result.reason ?? ""] ??
        "Could not verify delivery code.";
      return jsonResponse({
        ok: false,
        reason: result.reason,
        message,
        attempts_remaining: result.attempts_remaining,
      });
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("verify-delivery-otp error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
