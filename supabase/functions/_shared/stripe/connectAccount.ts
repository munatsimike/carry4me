import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isStripeLiveMode } from "./client.ts";
import { isStaleStripeConnectAccountError } from "./errors.ts";
import {
  loadTravelerProfile,
  mapStripeVerificationStatus,
  resetStripeConnectProfile,
  type TravelerStripeProfile,
} from "./profiles.ts";

export type StripeConnectClientState = "not_created" | "setup_incomplete" | "ready";

export function getStripeConnectClientState(
  profile: Pick<
    TravelerStripeProfile,
    "stripe_account_id" | "stripe_details_submitted" | "stripe_payouts_enabled"
  >,
): StripeConnectClientState {
  if (!profile.stripe_account_id) {
    return "not_created";
  }

  if (profile.stripe_details_submitted && profile.stripe_payouts_enabled) {
    return "ready";
  }

  return "setup_incomplete";
}

function resolveStripeConnectCountry(profile: TravelerStripeProfile): string | undefined {
  const countryCode = profile.country_code?.trim().toUpperCase();
  if (countryCode && /^[A-Z]{2}$/.test(countryCode)) {
    return countryCode;
  }
  return undefined;
}

export async function syncStripeConnectAccountToProfile(
  supabaseAdmin: SupabaseClient,
  userId: string,
  account: Pick<
    Stripe.Account,
    "id" | "charges_enabled" | "payouts_enabled" | "details_submitted"
  >,
): Promise<void> {
  const verificationStatus = mapStripeVerificationStatus(account);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      stripe_account_id: account.id,
      stripe_charges_enabled: account.charges_enabled === true,
      stripe_payouts_enabled: account.payouts_enabled === true,
      stripe_details_submitted: account.details_submitted === true,
      stripe_verification_status: verificationStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("syncStripeConnectAccountToProfile failed", userId, error.message);
    throw error;
  }
}

export async function findProfileIdByStripeAccountId(
  supabaseAdmin: SupabaseClient,
  accountId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_account_id", accountId)
    .maybeSingle<{ id: string }>();

  if (error) {
    console.error("findProfileIdByStripeAccountId failed", accountId, error.message);
    throw error;
  }

  return data?.id ?? null;
}

async function validateExistingStripeAccount(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<string | null> {
  const stripeLiveMode = isStripeLiveMode();

  try {
    const existing = await stripe.accounts.retrieve(accountId);
    if (existing.livemode !== stripeLiveMode) {
      console.warn(
        "validateExistingStripeAccount livemode mismatch cleared",
        accountId,
      );
      const resetProfile = await resetStripeConnectProfile(supabaseAdmin, userId);
      return resetProfile?.stripe_account_id ?? null;
    }

    return accountId;
  } catch (err) {
    if (!isStaleStripeConnectAccountError(err)) {
      throw err;
    }

    console.warn("validateExistingStripeAccount stale account cleared", accountId);
    const resetProfile = await resetStripeConnectProfile(supabaseAdmin, userId);
    return resetProfile?.stripe_account_id ?? null;
  }
}

/**
 * Creates a Stripe Connect account at most once per user.
 * Only call from stripe-connect-onboarding.
 */
export async function ensureStripeConnectAccountId(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  profile: TravelerStripeProfile,
  userId: string,
  userEmail: string | undefined,
): Promise<string> {
  let accountId = profile.stripe_account_id;

  if (accountId) {
    const validated = await validateExistingStripeAccount(
      stripe,
      supabaseAdmin,
      userId,
      accountId,
    );
    if (validated) {
      return validated;
    }
    accountId = null;
  }

  const refreshed = await loadTravelerProfile(supabaseAdmin, userId);
  if (refreshed?.stripe_account_id) {
    const validated = await validateExistingStripeAccount(
      stripe,
      supabaseAdmin,
      userId,
      refreshed.stripe_account_id,
    );
    if (validated) {
      return validated;
    }
  }

  const profileForCreate = refreshed ?? profile;
  const createParams: Stripe.AccountCreateParams = {
    type: "express",
    email: profileForCreate.email ?? userEmail ?? undefined,
    metadata: { user_id: userId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
  };

  const country = resolveStripeConnectCountry(profileForCreate);
  if (country) {
    createParams.country = country;
  }

  const account = await stripe.accounts.create(createParams, {
    idempotencyKey: `connect-account-${userId}`,
  });

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("profiles")
    .update({
      stripe_account_id: account.id,
      stripe_verification_status: "incomplete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .is("stripe_account_id", null)
    .select("stripe_account_id")
    .maybeSingle<{ stripe_account_id: string }>();

  if (claimError) {
    console.error("ensureStripeConnectAccountId claim failed", claimError.message);
    throw claimError;
  }

  if (claimed?.stripe_account_id) {
    return claimed.stripe_account_id;
  }

  const afterRace = await loadTravelerProfile(supabaseAdmin, userId);
  if (afterRace?.stripe_account_id) {
    return afterRace.stripe_account_id;
  }

  return account.id;
}

/**
 * Refreshes Connect status from Stripe without creating accounts.
 */
export async function refreshStripeConnectAccountStatus(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  profile: TravelerStripeProfile,
  userId: string,
): Promise<TravelerStripeProfile> {
  if (!profile.stripe_account_id) {
    return profile;
  }

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);

  if (account.livemode !== isStripeLiveMode()) {
    console.warn(
      "refreshStripeConnectAccountStatus livemode mismatch cleared",
      profile.stripe_account_id,
    );
    const resetProfile = await resetStripeConnectProfile(supabaseAdmin, userId);
    return resetProfile ?? profile;
  }

  await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);

  const refreshed = await loadTravelerProfile(supabaseAdmin, userId);
  return refreshed ?? profile;
}
