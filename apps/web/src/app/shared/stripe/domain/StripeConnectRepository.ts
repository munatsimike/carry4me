import type { ConnectStatusResponse } from "@/app/features/carry request/application/travelerStripeVerification";

export type DeleteStripeAccountResponse = ConnectStatusResponse & {
  ok: boolean;
  deleted: boolean;
  stripe_account_id: string;
  profile_cleared?: boolean;
};

export interface StripeConnectRepository {
  deleteAccount(stripeAccountId: string): Promise<DeleteStripeAccountResponse>;
}
