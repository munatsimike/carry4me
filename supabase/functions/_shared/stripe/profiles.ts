import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type TravelerStripeProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  stripe_account_id: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_verification_status: string;
};

export async function loadTravelerProfile(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<TravelerStripeProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select(
      "id, email, full_name, phone_verified, email_verified, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_verification_status",
    )
    .eq("id", userId)
    .maybeSingle<TravelerStripeProfile>();

  if (error) {
    console.error("loadTravelerProfile failed", { userId, message: error.message });
    throw error;
  }

  return data;
}

export function isTravelerStripeVerified(profile: TravelerStripeProfile): boolean {
  return (
    profile.phone_verified === true &&
    profile.email_verified === true &&
    !!profile.stripe_account_id &&
    profile.stripe_charges_enabled === true &&
    profile.stripe_payouts_enabled === true
  );
}

export function mapStripeVerificationStatus(account: {
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
}): string {
  if (account.charges_enabled && account.payouts_enabled) {
    return "verified";
  }
  if (account.details_submitted) {
    return "pending";
  }
  return "incomplete";
}

export async function resetStripeConnectProfile(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<TravelerStripeProfile | null> {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      stripe_account_id: null,
      stripe_charges_enabled: false,
      stripe_payouts_enabled: false,
      stripe_details_submitted: false,
      stripe_verification_status: "not_started",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("resetStripeConnectProfile failed", error.message);
    return null;
  }

  return loadTravelerProfile(supabaseAdmin, userId);
}
