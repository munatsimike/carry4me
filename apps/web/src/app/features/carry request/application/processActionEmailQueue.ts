import { processEmailQueueInBackground } from "@/app/shared/supabase/processEmailQueue";
import type { PerformActionResponse } from "../domain/performActionResponse";

export function processActionEmailQueue(response: PerformActionResponse) {
  if (!response.ok || response.progressed === false) {
    return;
  }

  if (response.notification_id) {
    processEmailQueueInBackground({ notificationId: response.notification_id });
    return;
  }

  // Notifications are created by DB trigger on carry_request_events.
  processEmailQueueInBackground({ limit: 5 });
}
