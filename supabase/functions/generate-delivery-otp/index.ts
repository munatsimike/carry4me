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

async function ensureDeliveryOtpNotification(
  supabaseAdmin: Parameters<typeof issueDeliveryOtp>[0],
  input: {
    carryRequestId: string;
    senderUserId: string;
    otp: string | undefined;
  },
) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .eq("user_id", input.senderUserId)
    .eq("type", "DELIVERY_OTP")
    .filter("metadata->>carry_request_id", "eq", input.carryRequestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error(
      "generate-delivery-otp: failed checking existing notification",
      existingError.message,
    );
    return;
  }

  if (existing?.id) {
    return;
  }

  const otpText = input.otp
    ? `Share this 6-digit code with the recipient. They must provide it to the traveler when receiving the package: ${input.otp}.`
    : "Your payment release OTP is ready. Open Carry4Me to view and share it with the recipient.";

  const { error: insertError } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: input.senderUserId,
      type: "DELIVERY_OTP",
      title: "Payment release code",
      body: otpText,
      link: "/requests",
      metadata: { carry_request_id: input.carryRequestId },
    });

  if (insertError) {
    console.error(
      "generate-delivery-otp: failed inserting fallback notification",
      insertError.message,
    );
  }
}

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

    await ensureDeliveryOtpNotification(supabaseAdmin, {
      carryRequestId,
      senderUserId: access.row.sender_user_id,
      otp: issued.otp,
    });

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
