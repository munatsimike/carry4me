import { processEmailQueueInBackground } from "@/app/shared/supabase/processEmailQueue";

/** After creating a carry request, send the REQUEST_SENT email to the recipient. */
export function processRequestSentEmailQueue(carryRequestId: string): void {
  processEmailQueueInBackground({
    carryRequestId,
    eventType: "REQUEST_SENT",
  });
}
