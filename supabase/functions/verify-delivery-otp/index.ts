import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";
import { verifyDeliveryOtpRpc } from "../_shared/deliveryOtp.ts";
import { releaseTravelerPayoutAfterDeliveryVerification } from "../_shared/stripe/travelerTransfer.ts";

type RequestBody = {
  carry_request_id?: string;
  otp?: string;
};

const REASON_MESSAGES: Record<string, string> = {
  OTP_INVALID: "Incorrect code. Please try again.",
  OTP_ATTEMPTS_EXCEEDED:
    "Too many failed attempts. Request a new code from the sender.",
  OTP_NOT_GENERATED: "No delivery code is active yet. Wait for delivery confirmation.",
  INVALID_STATUS: "This request is not ready for payout release.",
  FORBIDDEN: "Only the traveler can verify the delivery code.",
  NOT_FOUND: "Carry request not found.",
  OTP_NOT_VERIFIED: "Verify the delivery code before releasing payment.",
  PAYMENT_NOT_CONFIRMED: "Sender payment is not confirmed yet.",
  TRAVELER_PAYOUT_NOT_READY:
    "Complete Stripe payout setup before releasing payment.",
  TRANSFER_FAILED:
    "Could not release payment to your payout account. If the problem persists, contact Carry4Me.",
  TRANSFER_ID_PERSIST_FAILED:
    "Payment transfer was created but not saved yet. Try again in a moment.",
  TRANSFER_NOT_CONFIRMED:
    "Traveler payout has not been confirmed yet. Verify the delivery code again.",
  MISSING_CHARGE: "Payment charge is not ready yet. Try again in a moment.",
  MISSING_PAYMENT_INTENT: "No payment was found for this request.",
  INVALID_PAYOUT_AMOUNT: "Payout amount is invalid. Contact support.",
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

    const { supabaseUser, supabaseAdmin } = await getAuthenticatedUser(req);

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

    // Funds stay on the platform until OTP succeeds; transfer only after verification.
    const transferResult = await releaseTravelerPayoutAfterDeliveryVerification(
      getStripe(),
      supabaseAdmin,
      carryRequestId,
    );

    if (!transferResult.ok) {
      const friendly =
        REASON_MESSAGES[transferResult.reason] ??
        "Could not release payment to your payout account. If the problem persists, contact Carry4Me.";
      // Keep Stripe/raw details in logs only — never in the client-facing message.
      console.warn("verify-delivery-otp traveler transfer deferred", {
        carryRequestId,
        reason: transferResult.reason,
        message: transferResult.message,
      });
      return jsonResponse({
        ok: false,
        reason: transferResult.reason,
        message: friendly,
      });
    }

    console.info("verify-delivery-otp traveler payout transferred", {
      carryRequestId,
      transferId: transferResult.transferId,
    });

    return jsonResponse({ ok: true, transfer_id: transferResult.transferId });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("verify-delivery-otp error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
