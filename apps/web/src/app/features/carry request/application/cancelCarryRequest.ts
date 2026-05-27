import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import type { PerformActionResponse } from "../domain/performActionResponse";

type CancelRefund = {
  applied: boolean;
  amount: number;
  refund_status: "FULL" | "PARTIAL";
  stripe_refund_id?: string;
};

export type CancelCarryRequestResponse = PerformActionResponse & {
  canceled_by?: "SENDER" | "TRAVELER";
  refund?: CancelRefund | null;
};

export async function cancelCarryRequest(
  carryRequestId: string,
): Promise<CancelCarryRequestResponse> {
  return invokeStripeFunction<CancelCarryRequestResponse>("cancel-carry-request", {
    carry_request_id: carryRequestId,
  });
}

