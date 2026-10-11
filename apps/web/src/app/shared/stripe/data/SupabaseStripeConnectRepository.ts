import { AppError } from "@/app/shared/domain/AppError";
import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import type {
  DeleteStripeAccountResponse,
  StripeConnectRepository,
} from "../domain/StripeConnectRepository";

export class SupabaseStripeConnectRepository implements StripeConnectRepository {
  async deleteAccount(
    stripeAccountId: string,
    confirmation: { confirm: true; confirmPhrase: string },
  ): Promise<DeleteStripeAccountResponse> {
    const data = await invokeStripeFunction<DeleteStripeAccountResponse>(
      "delete-stripe-account",
      {
        stripe_account_id: stripeAccountId,
        confirm: confirmation.confirm,
        confirm_phrase: confirmation.confirmPhrase,
      },
    );

    if (data && typeof data === "object" && "ok" in data && data.ok === false) {
      throw new AppError({
        message: data.error ?? "Could not delete Stripe account",
        status: 500,
        code: data.code,
      });
    }

    return data;
  }
}
