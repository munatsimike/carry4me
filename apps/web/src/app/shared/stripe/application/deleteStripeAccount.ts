import { SupabaseStripeConnectRepository } from "../data/SupabaseStripeConnectRepository";
import type { DeleteStripeAccountResponse } from "../domain/StripeConnectRepository";

export const DELETE_STRIPE_CONFIRM_PHRASE = "DELETE CONNECT ACCOUNT";

const stripeConnectRepository = new SupabaseStripeConnectRepository();

export async function deleteStripeAccount(
  stripeAccountId: string,
  confirmation: { confirm: true; confirmPhrase: string },
): Promise<DeleteStripeAccountResponse> {
  return stripeConnectRepository.deleteAccount(stripeAccountId, confirmation);
}

export type { DeleteStripeAccountResponse };
