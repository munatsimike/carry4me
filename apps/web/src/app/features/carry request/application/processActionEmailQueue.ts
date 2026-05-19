import { processEmailQueueInBackground } from "@/app/shared/supabase/processEmailQueue";
import type { PerformActionResponse } from "../domain/performActionResponse";

export function processActionEmailQueue(response: PerformActionResponse) {
  if (!response.ok || !response.notification_id) {
    return;
  }

  processEmailQueueInBackground({ notificationId: response.notification_id });
}
