import type { createClient } from "npm:@supabase/supabase-js@2";

export type CarryRequestPaymentRow = {
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
  stripe_dispute_id: string | null;
  dispute_status: string | null;
};

type SupabaseAdmin = ReturnType<typeof createClient>;

export async function findCarryRequestByPaymentIntentId(
  supabaseAdmin: SupabaseAdmin,
  paymentIntentId: string,
): Promise<CarryRequestPaymentRow | null> {
  const { data, error } = await supabaseAdmin
    .from("carry_requests")
    .select(
      "id, sender_user_id, traveler_user_id, status, stripe_payment_intent_id, payment_status, payment_amount, platform_fee_amount, refund_status, refunded_amount, stripe_refund_id, stripe_dispute_id, dispute_status",
    )
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle<CarryRequestPaymentRow>();

  if (error) {
    throw error;
  }

  return data;
}

export function paymentIntentIdFromStripeRef(
  value: string | { id?: string } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  const id = value.id?.trim();
  return id || null;
}

export function classifyRefundStatus(
  amountRefunded: number,
  paymentAmount: number,
  platformFeeAmount: number,
): "FULL" | "PARTIAL" {
  if (paymentAmount > 0 && amountRefunded >= paymentAmount) {
    return "FULL";
  }

  // Sender-cancel policy refunds payment minus platform fee.
  const expectedPartial = Math.max(0, paymentAmount - platformFeeAmount);
  if (expectedPartial > 0 && amountRefunded >= expectedPartial) {
    return "PARTIAL";
  }

  return amountRefunded >= paymentAmount ? "FULL" : "PARTIAL";
}
