import { SupabaseStripeConnectRepository } from "../data/SupabaseStripeConnectRepository";
import type { DeleteStripeAccountResponse } from "../domain/StripeConnectRepository";

const stripeConnectRepository = new SupabaseStripeConnectRepository();

export async function deleteStripeAccount(
  stripeAccountId: string,
): Promise<DeleteStripeAccountResponse> {
  return stripeConnectRepository.deleteAccount(stripeAccountId);
}

export type { DeleteStripeAccountResponse };
