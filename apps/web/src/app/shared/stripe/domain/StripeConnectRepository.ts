import type { ConnectStatusResponse } from "@/app/features/carry request/application/travelerStripeVerification";

export type DeleteStripeAccountResponse = ConnectStatusResponse & {
  ok: boolean;
  deleted: boolean;
  stripe_account_id: string;
  profile_cleared?: boolean;
  error?: string;
  code?: string;
};

export interface StripeConnectRepository {
  deleteAccount(
    stripeAccountId: string,
    confirmation: { confirm: true; confirmPhrase: string },
  ): Promise<DeleteStripeAccountResponse>;
}
