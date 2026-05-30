import { processEmailQueueInBackground } from "@/app/shared/supabase/processEmailQueue";
import type { PerformActionResponse } from "../domain/performActionResponse";
import { UIACTIONKEYS } from "../ui/ActionsMapper";

/**
 * Process the email queue after a successful carry-request action.
 * Uses RPC ids when present; otherwise targets the notification for this request + event.
 */
export function processActionEmailQueue(
  response: PerformActionResponse,
  carryRequestId: string,
): void {
  if (!response.ok) {
    return;
  }

  const eventType =
    response.event_type ??
    (response.action === UIACTIONKEYS.CONFIRM_HANDOVER
      ? "HANDOVER_CONFIRMED"
      : undefined);

  if (response.progressed === false && eventType !== "HANDOVER_CONFIRMED") {
    return;
  }

  if (response.notification_id) {
    processEmailQueueInBackground({ notificationId: response.notification_id });
    return;
  }

  if (carryRequestId && eventType) {
    processEmailQueueInBackground({ carryRequestId, eventType });
  }

  if (
    carryRequestId &&
    eventType === "PARCEL_RECEIVED" &&
    response.progressed !== false
  ) {
    processEmailQueueInBackground({ carryRequestId, eventType: "DELIVERY_OTP" });
  }
}
