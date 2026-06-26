import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isStripeLiveMode } from "./client.ts";
import {
  isStaleStripeConnectAccountError,
  isStripeAccountCreateConflict,
  isStripeIdempotencyError,
  stripeErrorMessage,
} from "./errors.ts";
import {
  isTravelerStripeOnboardingComplete,
  isTravelerStripeVerified,
  loadTravelerProfile,
  mapStripeVerificationStatus,
  resetStripeConnectProfile,
  type TravelerStripeProfile,
} from "./profiles.ts";

export type StripeConnectClientState = "not_created" | "setup_incomplete" | "ready";

const CONNECT_ACCOUNT_IDEMPOTENCY_VERSION = "v2";

const ALPHA3_TO_ALPHA2: Record<string, string> = {
  NLD: "NL",
  GBR: "GB",
  USA: "US",
  ZWE: "ZW",
  FRA: "FR",
  IRL: "IE",
};

const COUNTRY_NAME_TO_ALPHA2: Record<string, string> = {
  netherlands: "NL",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  "united states of america": "US",
  zimbabwe: "ZW",
  france: "FR",
  ireland: "IE",
};

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

export function buildConnectStatusPayload(profile: TravelerStripeProfile) {
  return {
    verified: isTravelerStripeVerified(profile),
    onboarding_complete: isTravelerStripeOnboardingComplete(profile),
    connect_state: getStripeConnectClientState(profile),
    stripe_account_id: profile.stripe_account_id,
    stripe_charges_enabled: profile.stripe_charges_enabled,
    stripe_payouts_enabled: profile.stripe_payouts_enabled,
    stripe_details_submitted: profile.stripe_details_submitted,
    stripe_verification_status: profile.stripe_verification_status ?? "not_started",
    phone_verified: profile.phone_verified,
    email_verified: profile.email_verified,
  };
}

export function resolveStripeConnectCountry(
  profile: TravelerStripeProfile,
): string {
  const rawCode = profile.country_code?.trim();
  if (rawCode && /^[A-Z]{2}$/i.test(rawCode)) {
    return rawCode.toUpperCase();
  }

  if (rawCode) {
    const fromAlpha3 = ALPHA3_TO_ALPHA2[rawCode.toUpperCase()];
    if (fromAlpha3) {
      return fromAlpha3;
    }
  }

  const rawCountry = profile.country?.trim().toLowerCase();
  if (rawCountry) {
    const fromName = COUNTRY_NAME_TO_ALPHA2[rawCountry];
    if (fromName) {
      return fromName;
    }

    if (/^[A-Z]{2}$/i.test(rawCountry)) {
      return rawCountry.toUpperCase();
    }
  }

  return "NL";
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

async function claimStripeAccountId(
  supabaseAdmin: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<string> {
  const { data: claimed, error: claimError } = await supabaseAdmin
    .from("profiles")
    .update({
      stripe_account_id: accountId,
      stripe_verification_status: "incomplete",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .is("stripe_account_id", null)
    .select("stripe_account_id")
    .maybeSingle<{ stripe_account_id: string }>();

  if (claimError) {
    console.error("claimStripeAccountId failed", userId, claimError.message);
    throw claimError;
  }

  if (claimed?.stripe_account_id) {
    return claimed.stripe_account_id;
  }

  const refreshed = await loadTravelerProfile(supabaseAdmin, userId);
  if (refreshed?.stripe_account_id) {
    return refreshed.stripe_account_id;
  }

  return accountId;
}

async function findStripeAccountIdByUserMetadata(
  stripe: Stripe,
  userId: string,
): Promise<string | null> {
  try {
    const result = await stripe.accounts.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 1,
    });
    return result.data[0]?.id ?? null;
  } catch (err) {
    console.warn(
      "findStripeAccountIdByUserMetadata failed",
      userId,
      stripeErrorMessage(err),
    );
    return null;
  }
}

async function findStripeAccountIdForUser(
  stripe: Stripe,
  profile: TravelerStripeProfile,
  userId: string,
): Promise<string | null> {
  const byMetadata = await findStripeAccountIdByUserMetadata(stripe, userId);
  if (byMetadata) return byMetadata;

  const email = profile.email?.trim();
  if (!email) return null;

  try {
    const escapedEmail = email.replace(/'/g, "\\'");
    const result = await stripe.accounts.search({
      query: `email:'${escapedEmail}'`,
      limit: 10,
    });

    const owned = result.data.find(
      (account) => account.metadata?.user_id === userId,
    );
    if (owned) return owned.id;

    if (result.data.length === 1) {
      return result.data[0].id;
    }

    if (result.data.length > 1) {
      console.warn(
        "findStripeAccountIdForUser multiple email matches",
        userId,
        result.data.map((account) => account.id),
      );
    }
  } catch (err) {
    console.warn(
      "findStripeAccountIdForUser email search failed",
      userId,
      stripeErrorMessage(err),
    );
  }

  return null;
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

    await syncStripeConnectAccountToProfile(supabaseAdmin, userId, existing);
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

function buildConnectAccountCreateParams(
  profile: TravelerStripeProfile,
  userId: string,
  userEmail: string | undefined,
): Stripe.AccountCreateParams {
  return {
    type: "express",
    country: resolveStripeConnectCountry(profile),
    email: profile.email ?? userEmail ?? undefined,
    metadata: { user_id: userId },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
  };
}

async function createStripeConnectAccount(
  stripe: Stripe,
  userId: string,
  createParams: Stripe.AccountCreateParams,
): Promise<Stripe.Account> {
  const idempotencyKey = `connect-account-${CONNECT_ACCOUNT_IDEMPOTENCY_VERSION}-${userId}`;

  try {
    return await stripe.accounts.create(createParams, { idempotencyKey });
  } catch (err) {
    if (!isStripeIdempotencyError(err) && !isStripeAccountCreateConflict(err)) {
      throw err;
    }

    const recoveredAccountId = await findStripeAccountIdForUser(
      stripe,
      {
        email:
          typeof createParams.email === "string" ? createParams.email : null,
      } as TravelerStripeProfile,
      userId,
    );
    if (!recoveredAccountId) {
      throw err;
    }

    return stripe.accounts.retrieve(recoveredAccountId);
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

  const recoveredAccountId = await findStripeAccountIdForUser(
    stripe,
    refreshed ?? profile,
    userId,
  );
  if (recoveredAccountId) {
    const validated = await validateExistingStripeAccount(
      stripe,
      supabaseAdmin,
      userId,
      recoveredAccountId,
    );
    if (validated) {
      return claimStripeAccountId(supabaseAdmin, userId, validated);
    }
  }

  const profileForCreate = refreshed ?? profile;
  const createParams = buildConnectAccountCreateParams(
    profileForCreate,
    userId,
    userEmail,
  );

  const account = await createStripeConnectAccount(stripe, userId, createParams);
  return claimStripeAccountId(supabaseAdmin, userId, account.id);
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

/**
 * Ensures profiles.stripe_* columns match the user's Stripe Connect account.
 * Recovers a missing stripe_account_id from Stripe metadata when needed.
 */
export async function reconcileTravelerStripeConnectProfile(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  profile: TravelerStripeProfile,
): Promise<TravelerStripeProfile> {
  if (profile.stripe_account_id) {
    try {
      return await refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        profile,
        userId,
      );
    } catch (err) {
      if (!isStaleStripeConnectAccountError(err)) {
        throw err;
      }

      console.warn(
        "reconcileTravelerStripeConnectProfile stale account cleared",
        profile.stripe_account_id,
        stripeErrorMessage(err),
      );
      const resetProfile = await resetStripeConnectProfile(supabaseAdmin, userId);
      profile = resetProfile ?? profile;
    }
  }

  const recoveredAccountId = await findStripeAccountIdForUser(
    stripe,
    profile,
    userId,
  );
  if (!recoveredAccountId) {
    return profile;
  }

  const validated = await validateExistingStripeAccount(
    stripe,
    supabaseAdmin,
    userId,
    recoveredAccountId,
  );
  if (!validated) {
    return profile;
  }

  await claimStripeAccountId(supabaseAdmin, userId, validated);

  const claimed = await loadTravelerProfile(supabaseAdmin, userId);
  if (!claimed?.stripe_account_id) {
    return profile;
  }

  return refreshStripeConnectAccountStatus(stripe, supabaseAdmin, claimed, userId);
}
