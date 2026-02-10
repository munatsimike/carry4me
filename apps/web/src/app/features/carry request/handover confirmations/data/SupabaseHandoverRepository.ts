import { supabase } from "@/app/shared/supabase/client";
import type { HandoverConfirmationRow } from "../domain/HandoverConfirmation";
import type { HandoverConfirmationState } from "../domain/HandoverConfirmationState";
import { ROLES } from "../../domain/CreateCarryRequest";
import type { HandoverConfirmationRepository } from "../domain/HandoverRepository";

export class SupabaseHandoverRepository implements HandoverConfirmationRepository {
  async fetchConfirmations(
    carryRequestId: string,
  ): Promise<HandoverConfirmationRow[]> {
    const { data } = await supabase
      .from("carry_request_handover_confirmations")
      .select("carry_request_id,user_id,role,confirmed_at")
      .eq("carry_request_id", carryRequestId)
      .throwOnError();

    return (data ?? []) as HandoverConfirmationRow[];
  }

  async getState(carryRequestId: string): Promise<HandoverConfirmationState> {
    const rows = await this.fetchConfirmations(carryRequestId);

    const sender = rows.find((r) => r.role === ROLES.SENDER);
    const traveler = rows.find((r) => r.role === ROLES.TRAVELER);

    const senderConfirmedAt = sender?.confirmed_at;
    const travelerConfirmedAt = traveler?.confirmed_at;

    const senderConfirmed = !!senderConfirmedAt;
    const travelerConfirmed = !!travelerConfirmedAt;

    return {
      senderConfirmed,
      travelerConfirmed,
      bothConfirmed: senderConfirmed && travelerConfirmed,
      senderConfirmedAt,
      travelerConfirmedAt,
    };
  }
}
