import { AppError } from "@/app/shared/domain/AppError";
import type {
  DeleteStripeAccountResponse,
  StripeConnectRepository,
} from "../domain/StripeConnectRepository";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export class SupabaseStripeConnectRepository implements StripeConnectRepository {
  async deleteAccount(
    stripeAccountId: string,
  ): Promise<DeleteStripeAccountResponse> {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/delete-stripe-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ stripe_account_id: stripeAccountId }),
      },
    );

    const data = (await response.json()) as DeleteStripeAccountResponse & {
      error?: string;
      code?: string;
    };

    if (!response.ok) {
      throw new AppError({
        message: data.error ?? "Could not delete Stripe account",
        status: response.status,
        code: data.code,
      });
    }

    if (data.error) {
      throw new AppError({
        message: data.error,
        status: response.status,
        code: data.code,
      });
    }

    return data;
  }
}
