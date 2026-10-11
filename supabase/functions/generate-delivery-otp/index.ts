import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import {
  assertCarryRequestParticipant,
  issueDeliveryOtp,
} from "../_shared/deliveryOtp.ts";
import {
  emailStatusFromQueueResult,
  loadExactQueueRow,
  processQueueRow,
  USER_PROCESSABLE_STATUSES,
} from "../_shared/emailQueueProcessor.ts";

type RequestBody = {
  carry_request_id?: string;
};

function deliveryOtpIssueMessage(status: "queued" | "sent" | "failed"): string {
  if (status === "sent") {
    return "A new delivery code was sent to your email.";
  }
  if (status === "failed") {
    return "We couldn't email your delivery code. Try Resend again in a moment.";
  }
  return "A new delivery code is being emailed to you.";
}

/** Resend delivery OTP to the sender by email (issued on handover, reusable in transit). */
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
        {
          error:
            "OTP can only be resent while the parcel is in transit or awaiting payout",
        },
        400,
      );
    }

    if (user.id !== access.row.sender_user_id) {
      return jsonResponse(
        { error: "Only the sender can resend the payment code" },
        403,
      );
    }

    const issued = await issueDeliveryOtp(supabaseAdmin, carryRequestId);
    if (!issued.ok) {
      if (issued.reason === "RATE_LIMITED") {
        return jsonResponse(
          { error: "Please wait before requesting a new delivery code." },
          429,
        );
      }
      return jsonResponse({ error: "Could not generate delivery OTP" }, 500);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    let emailStatus: "queued" | "sent" | "failed" = "queued";

    if (resendApiKey && issued.notification_id) {
      const row = await loadExactQueueRow(supabaseAdmin, {
        notificationId: issued.notification_id,
      });
      if (row) {
        const result = await processQueueRow(
          supabaseAdmin,
          row,
          resendApiKey,
          { allowedStatuses: USER_PROCESSABLE_STATUSES },
        );
        emailStatus = emailStatusFromQueueResult(result);
      }
    }

    return jsonResponse({
      ok: true,
      email_status: emailStatus,
      sent: emailStatus === "sent",
      message: deliveryOtpIssueMessage(emailStatus),
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("generate-delivery-otp error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
