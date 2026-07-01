import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  loadExactQueueRow,
  processQueueRow,
  USER_PROCESSABLE_STATUSES,
} from "../emailQueueProcessor.ts";
import { findProfileIdByStripeAccountId } from "./connectAccount.ts";

export const TRAVELER_BANK_PAYOUT_TYPE = "TRAVELER_BANK_PAYOUT";
export const TRAVELER_BANK_PAYOUT_TITLE = "Payout sent to your bank";
export const TRAVELER_BANK_PAYOUT_BODY =
  "Your Carry4Me earnings have been transferred to your bank account. Depending on your bank, the funds may take 1–3 business days to appear. Thank you for using carry4me.";

async function hasExistingBankPayoutNotification(
  supabaseAdmin: SupabaseClient,
  userId: string,
  stripePayoutId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", TRAVELER_BANK_PAYOUT_TYPE)
    .filter("metadata->>stripe_payout_id", "eq", stripePayoutId)
    .limit(1);

  if (error) {
    console.error("hasExistingBankPayoutNotification failed", error.message);
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

export async function notifyTravelerBankPayoutPaid(
  supabaseAdmin: SupabaseClient,
  input: {
    payout: Stripe.Payout;
    connectedAccountId: string | null | undefined;
    resendApiKey: string | null | undefined;
  },
): Promise<{ notified: boolean; reason?: string }> {
  const stripeAccountId = input.connectedAccountId?.trim();
  if (!stripeAccountId) {
    return { notified: false, reason: "MISSING_CONNECTED_ACCOUNT" };
  }

  const userId = await findProfileIdByStripeAccountId(
    supabaseAdmin,
    stripeAccountId,
  );
  if (!userId) {
    return { notified: false, reason: "UNKNOWN_STRIPE_ACCOUNT" };
  }

  if (await hasExistingBankPayoutNotification(supabaseAdmin, userId, input.payout.id)) {
    return { notified: false, reason: "ALREADY_NOTIFIED" };
  }

  const metadata = {
    stripe_payout_id: input.payout.id,
    stripe_account_id: stripeAccountId,
    amount: input.payout.amount,
    currency: input.payout.currency,
  };

  const { data: notification, error: notificationError } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      type: TRAVELER_BANK_PAYOUT_TYPE,
      title: TRAVELER_BANK_PAYOUT_TITLE,
      body: TRAVELER_BANK_PAYOUT_BODY,
      link: "/requests",
      metadata,
    })
    .select("id")
    .single<{ id: string }>();

  if (notificationError || !notification) {
    console.error("notifyTravelerBankPayoutPaid notification insert failed", notificationError);
    throw notificationError ?? new Error("Notification insert failed");
  }

  const { data: queueRow, error: queueError } = await supabaseAdmin
    .from("email_queue")
    .insert({
      notification_id: notification.id,
      user_id: userId,
    })
    .select("id")
    .single<{ id: string }>();

  if (queueError || !queueRow) {
    console.error("notifyTravelerBankPayoutPaid email_queue insert failed", queueError);
    throw queueError ?? new Error("Email queue insert failed");
  }

  if (!input.resendApiKey?.trim()) {
    console.warn("notifyTravelerBankPayoutPaid: RESEND_API_KEY not set; email queued only");
    return { notified: true, reason: "EMAIL_QUEUED_ONLY" };
  }

  const row = await loadExactQueueRow(supabaseAdmin, {
    emailQueueId: queueRow.id,
  });
  if (!row) {
    return { notified: true, reason: "EMAIL_QUEUE_ROW_MISSING" };
  }

  await processQueueRow(supabaseAdmin, row, input.resendApiKey.trim(), {
    allowedStatuses: USER_PROCESSABLE_STATUSES,
  });

  return { notified: true };
}
