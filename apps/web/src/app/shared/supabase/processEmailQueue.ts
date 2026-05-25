import { supabase } from "@/app/shared/supabase/client";

export type ProcessEmailQueueResult = {
  ok: boolean;
  processed: number;
  error?: string;
};

type ProcessEmailQueueInput = {
  notificationId?: string;
  emailQueueId?: string;
  carryRequestId?: string;
  eventType?: string;
};

/**
 * MVP: invoke after perform_carry_request_action succeeds.
 * Failures are logged and do not block the UI action.
 */
export async function processEmailQueue(
  input: ProcessEmailQueueInput = {},
): Promise<ProcessEmailQueueResult> {
  const { data, error } = await supabase.functions.invoke("process-email-queue", {
    body: input,
  });

  if (error) {
    console.error("process-email-queue invoke failed:", error);
    return { ok: false, processed: 0, error: error.message };
  }

  const result = data as ProcessEmailQueueResult | null;
  if (result?.error) {
    console.error("process-email-queue error:", result.error);
    return { ok: false, processed: 0, error: result.error };
  }

  return result ?? { ok: true, processed: 0 };
}

export function processEmailQueueInBackground(
  input: ProcessEmailQueueInput = {},
) {
  void processEmailQueue(input).catch((err) => {
    console.error("Background email queue processing failed:", err);
  });
}
