import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import {
  assertCarryRequestParticipant,
  isDeliveryOtpDevMode,
  issueDeliveryOtp,
} from "../_shared/deliveryOtp.ts";

type RequestBody = {
  carry_request_id?: string;
};

/** Resend delivery OTP to the sender (issued on handover confirm, reusable in transit). */
Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = (await req.json()) as RequestBody;
    const carryRequestId = body.carry_request_id?.trim();
    if (!carryRequestId) {
      return jsonResponse({ error: "carry_request_id is required" }, 400);
    }

    const { user, supabaseAdmin } = await getAuthenticatedUser(req);
    const access = await assertCarryRequestParticipant(
      supabaseAdmin,
      carryRequestId,
      user.id,
    );

    if (!access.ok) {
      return jsonResponse({ error: access.error }, access.status);
    }

    if (
      access.row.status !== "IN_TRANSIT" &&
      access.row.status !== "PENDING_PAYOUT"
    ) {
      return jsonResponse(
        { error: "OTP can only be resent while the parcel is in transit or awaiting payout" },
        400,
      );
    }

    if (user.id !== access.row.sender_user_id) {
      return jsonResponse({ error: "Only the sender can resend the payment code" }, 403);
    }

    const issued = await issueDeliveryOtp(supabaseAdmin, carryRequestId);
    if (!issued.ok) {
      return jsonResponse({ error: "Could not generate delivery OTP" }, 500);
    }

    const response: Record<string, unknown> = {
      ok: true,
      message: "A new delivery code was sent to the sender.",
    };

    // TODO: Remove dev-only OTP echo before production go-live.
    if (isDeliveryOtpDevMode() && issued.otp) {
      response.dev_otp = issued.otp;
    }

    return jsonResponse(response);
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("generate-delivery-otp error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
