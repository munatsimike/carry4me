import { handleCorsPreflight } from "../_shared/cors.ts";
import {
  getAuthenticatedUser,
  isResponse,
  jsonResponse,
} from "../_shared/stripe/auth.ts";
import { getStripe } from "../_shared/stripe/client.ts";

type RequestBody = {
  carry_request_id?: string;
};

type CarryRequestRow = {
  id: string;
  sender_user_id: string;
  traveler_user_id: string;
  status: string;
  stripe_payment_intent_id: string | null;
  payment_status: string | null;
  payment_amount: number | null;
  platform_fee_amount: number | null;
  refund_status: string | null;
  refunded_amount: number | null;
  stripe_refund_id: string | null;
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
    if (!carryRequestId) {
      return jsonResponse({ error: "carry_request_id is required" }, 400);
    }

    const { user, supabaseAdmin, supabaseUser } = await getAuthenticatedUser(req);
    const stripe = getStripe();

    const { data: carryRequest, error: loadError } = await supabaseAdmin
      .from("carry_requests")
      .select(
        "id, sender_user_id, traveler_user_id, status, stripe_payment_intent_id, payment_status, payment_amount, platform_fee_amount, refund_status, refunded_amount, stripe_refund_id",
      )
      .eq("id", carryRequestId)
      .maybeSingle<CarryRequestRow>();

    if (loadError) {
      console.error("cancel-carry-request load failed", loadError.message);
      return jsonResponse({ error: "Failed to load carry request" }, 500);
    }

    if (!carryRequest) {
      return jsonResponse({ error: "Carry request not found" }, 404);
    }

    if (
      user.id !== carryRequest.sender_user_id &&
      user.id !== carryRequest.traveler_user_id
    ) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const actorRole = user.id === carryRequest.sender_user_id ? "SENDER" : "TRAVELER";

    let refund: {
      applied: boolean;
      amount: number;
      refund_status: "FULL" | "PARTIAL";
      stripe_refund_id?: string;
    } | null = null;

    const refundableStatus = carryRequest.status === "PENDING_HANDOVER";
    const hasPaidIntent =
      carryRequest.stripe_payment_intent_id && carryRequest.payment_status === "SUCCEEDED";

    // Paid cancellation path (before handover complete): Stripe refund policy by actor.
    if (refundableStatus && hasPaidIntent) {
      if (carryRequest.stripe_refund_id || carryRequest.refund_status) {
        refund = {
          applied: true,
          amount: Number(carryRequest.refunded_amount ?? 0),
          refund_status:
            carryRequest.refund_status === "FULL" ? "FULL" : "PARTIAL",
          stripe_refund_id: carryRequest.stripe_refund_id ?? undefined,
        };
      } else {
        const paymentAmount = Number(carryRequest.payment_amount ?? 0);
        const platformFee = Number(carryRequest.platform_fee_amount ?? 0);
        const refundAmount =
          actorRole === "TRAVELER"
            ? paymentAmount
            : Math.max(0, paymentAmount - platformFee);

        if (refundAmount > 0) {
          const stripeRefund = await stripe.refunds.create({
            payment_intent: carryRequest.stripe_payment_intent_id!,
            amount: refundAmount,
            reason: "requested_by_customer",
            metadata: {
              carry_request_id: carryRequest.id,
              canceled_by: actorRole,
              policy: actorRole === "TRAVELER" ? "FULL_REFUND" : "LESS_SERVICE_FEE",
            },
          });

          const refundStatus = actorRole === "TRAVELER" ? "FULL" : "PARTIAL";
          const paymentStatus =
            refundStatus === "FULL" ? "REFUNDED_FULL" : "REFUNDED_PARTIAL";

          const { error: refundUpdateError } = await supabaseAdmin
            .from("carry_requests")
            .update({
              refund_status: refundStatus,
              refunded_amount: refundAmount,
              stripe_refund_id: stripeRefund.id,
              refunded_at: new Date().toISOString(),
              refund_actor_role: actorRole,
              payment_status: paymentStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", carryRequest.id);

          if (refundUpdateError) {
            console.error("cancel-carry-request refund update failed", refundUpdateError.message);
            return jsonResponse({ error: "Refund succeeded but DB update failed" }, 500);
          }

          refund = {
            applied: true,
            amount: refundAmount,
            refund_status: refundStatus,
            stripe_refund_id: stripeRefund.id,
          };
        }
      }
    }

    const { data: actionResult, error: actionError } = await supabaseUser.rpc(
      "perform_carry_request_action",
      {
        request_id: carryRequest.id,
        action_key: "CANCEL",
      },
    );

    if (actionError) {
      console.error("cancel-carry-request perform action failed", actionError.message);
      return jsonResponse({ error: actionError.message }, 400);
    }

    return jsonResponse({
      ...(actionResult ?? { ok: false }),
      refund,
      canceled_by: actorRole,
    });
  } catch (err) {
    if (isResponse(err)) return err;
    console.error("cancel-carry-request error", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

