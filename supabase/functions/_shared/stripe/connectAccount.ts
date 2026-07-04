import type Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isStripeLiveMode } from "./client.ts";
import {
  isMissingStripeAccountError,
  isStaleStripeConnectAccountError,
  isStripeAccountCreateConflict,
  isStripeIdempotencyError,
  isStripeLiveModeMismatchError,
  stripeErrorMessage,
} from "./errors.ts";
import {
  isTravelerStripeOnboardingComplete,
  isTravelerStripeVerified,
  isTravelerProfileVerifiedForSenderPayment,
  loadTravelerProfile,
  mapStripeVerificationStatus,
  resetStripeConnectProfile,
  type TravelerStripeProfile,
} from "./profiles.ts";

export type StripeConnectClientState = "not_created" | "setup_incomplete" | "ready";

const CONNECT_ACCOUNT_IDEMPOTENCY_VERSION = "v4";

const DAILY_CONNECT_PAYOUT_SCHEDULE: Stripe.AccountCreateParams.Settings.Payouts.Schedule =
  {
    interval: "daily",
  };

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
    if (error.code === "23505") {
      throw new Error(
        "This Stripe account is already linked to another Carry4Me profile.",
      );
    }
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

/**
 * Retrieves a Connect account from Stripe and writes the latest flags to profiles.
 */
async function syncStripeAccountFromStripe(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<TravelerStripeProfile | null> {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    if (account.livemode !== isStripeLiveMode()) {
      console.warn(
        "syncStripeAccountFromStripe livemode mismatch — leaving profile unchanged",
        accountId,
      );
      return await loadTravelerProfile(supabaseAdmin, userId);
    }

    await ensureDailyConnectPayoutSchedule(stripe, account);
    await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);

    return await loadTravelerProfile(supabaseAdmin, userId);
  } catch (err) {
    if (isMissingStripeAccountError(err)) {
      console.warn(
        "syncStripeAccountFromStripe account missing",
        accountId,
        stripeErrorMessage(err),
      );

      const current = await loadTravelerProfile(supabaseAdmin, userId);
      if (current?.stripe_account_id === accountId) {
        return clearStoredStripeLinkOnlyIfDeleted(
          stripe,
          supabaseAdmin,
          userId,
          current,
        );
      }

      return null;
    }

    if (isStripeLiveModeMismatchError(err)) {
      return await loadTravelerProfile(supabaseAdmin, userId);
    }

    throw err;
  }
}

/** Clears the profile link only when the stored Connect account was deleted in Stripe. */
async function clearStoredStripeLinkOnlyIfDeleted(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  profile: TravelerStripeProfile,
): Promise<TravelerStripeProfile> {
  const storedId = profile.stripe_account_id?.trim();
  if (!storedId) {
    return profile;
  }

  try {
    const account = await stripe.accounts.retrieve(storedId);
    if (account.livemode !== isStripeLiveMode()) {
      console.warn(
        "clearStoredStripeLinkOnlyIfDeleted livemode mismatch — leaving profile unchanged",
        storedId,
      );
      return profile;
    }
    return profile;
  } catch (err) {
    if (isStripeLiveModeMismatchError(err)) {
      console.warn(
        "clearStoredStripeLinkOnlyIfDeleted livemode mismatch — leaving profile unchanged",
        storedId,
      );
      return profile;
    }

    if (!isMissingStripeAccountError(err)) {
      throw err;
    }

    console.warn(
      "clearStoredStripeLinkOnlyIfDeleted deleted account cleared from profile",
      storedId,
      stripeErrorMessage(err),
    );
    const reset = await resetStripeConnectProfile(supabaseAdmin, userId);
    return reset ?? profile;
  }
}

/**
 * Syncs Connect flags from Stripe without clearing the profile when lookup fails.
 * Used by stripe-connect-status (read-only status checks).
 */
export async function refreshTravelerStripeConnectStatusSafe(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  profile: TravelerStripeProfile,
  userId: string,
): Promise<TravelerStripeProfile> {
  return syncTravelerStripeConnectProfileFromStripe(
    stripe,
    supabaseAdmin,
    userId,
    profile,
  );
}

/**
 * Uses the stored stripe_account_id (or recovers it from Stripe) to refresh profiles.*
 * Clears the profile when the stored account was deleted in Stripe.
 */
export async function syncTravelerStripeConnectProfileFromStripe(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  profile: TravelerStripeProfile,
): Promise<TravelerStripeProfile> {
  const bestAccountId = await findStripeAccountIdForUser(
    stripe,
    supabaseAdmin,
    profile,
    userId,
  );

  if (!bestAccountId) {
    if (profile.stripe_account_id) {
      return refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        profile,
        userId,
      );
    }

    return clearStoredStripeLinkOnlyIfDeleted(
      stripe,
      supabaseAdmin,
      userId,
      profile,
    );
  }

  const synced = await syncStripeAccountFromStripe(
    stripe,
    supabaseAdmin,
    userId,
    bestAccountId,
  );

  if (!synced) {
    if (profile.stripe_account_id) {
      return refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        profile,
        userId,
      );
    }

    return clearStoredStripeLinkOnlyIfDeleted(
      stripe,
      supabaseAdmin,
      userId,
      profile,
    );
  }

  return synced;
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

function scoreStripeConnectAccount(
  account: Pick<
    Stripe.Account,
    "details_submitted" | "payouts_enabled" | "charges_enabled"
  >,
): number {
  let score = 0;
  if (account.details_submitted) score += 4;
  if (account.payouts_enabled) score += 8;
  if (account.charges_enabled) score += 2;
  return score;
}

async function isStripeAccountAvailableForUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<boolean> {
  const ownerId = await findProfileIdByStripeAccountId(supabaseAdmin, accountId);
  return ownerId === null || ownerId === userId;
}

async function pickBestStripeConnectAccountId(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  candidateIds: string[],
): Promise<string | null> {
  const stripeLiveMode = isStripeLiveMode();
  const uniqueCandidates = [...new Set(candidateIds.filter(Boolean))];

  let bestAccountId: string | null = null;
  let bestScore = -1;

  for (const accountId of uniqueCandidates) {
    if (!(await isStripeAccountAvailableForUser(supabaseAdmin, userId, accountId))) {
      continue;
    }

    try {
      const account = await stripe.accounts.retrieve(accountId);
      if (account.livemode !== stripeLiveMode) {
        continue;
      }

      const score = scoreStripeConnectAccount(account);
      if (score > bestScore) {
        bestScore = score;
        bestAccountId = account.id;
      }
    } catch (err) {
      console.warn(
        "pickBestStripeConnectAccountId skipped candidate",
        accountId,
        stripeErrorMessage(err),
      );
    }
  }

  return bestAccountId;
}

async function listStripeAccountIdsForUser(
  stripe: Stripe,
  profile: TravelerStripeProfile,
  userId: string,
): Promise<string[]> {
  const candidateIds = new Set<string>();

  if (profile.stripe_account_id) {
    candidateIds.add(profile.stripe_account_id);
  }

  try {
    const metadataMatches = await stripe.accounts.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 10,
    });
    for (const account of metadataMatches.data) {
      candidateIds.add(account.id);
    }
  } catch (err) {
    console.warn(
      "listStripeAccountIdsForUser metadata search failed",
      userId,
      stripeErrorMessage(err),
    );
  }

  const email = profile.email?.trim();
  if (email) {
    try {
      const escapedEmail = email.replace(/'/g, "\\'");
      const emailMatches = await stripe.accounts.search({
        query: `email:'${escapedEmail}'`,
        limit: 10,
      });
      for (const account of emailMatches.data) {
        candidateIds.add(account.id);
      }
    } catch (err) {
      console.warn(
        "listStripeAccountIdsForUser email search failed",
        userId,
        stripeErrorMessage(err),
      );
    }
  }

  return [...candidateIds];
}

async function findStripeAccountIdByUserMetadata(
  stripe: Stripe,
  userId: string,
): Promise<string | null> {
  try {
    const result = await stripe.accounts.search({
      query: `metadata['user_id']:'${userId}'`,
      limit: 10,
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
  supabaseAdmin: SupabaseClient,
  profile: TravelerStripeProfile,
  userId: string,
): Promise<string | null> {
  const storedId = profile.stripe_account_id?.trim();
  if (storedId) {
    if (await isStripeAccountAvailableForUser(supabaseAdmin, userId, storedId)) {
      try {
        const account = await stripe.accounts.retrieve(storedId);
        if (account.livemode === isStripeLiveMode()) {
          return storedId;
        }
      } catch (err) {
        if (isStripeLiveModeMismatchError(err)) {
          return null;
        }
        if (!isMissingStripeAccountError(err)) {
          throw err;
        }
      }
    }
  }

  const candidates = await listStripeAccountIdsForUser(stripe, profile, userId);
  return pickBestStripeConnectAccountId(stripe, supabaseAdmin, userId, candidates);
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
        "validateExistingStripeAccount livemode mismatch skipped",
        accountId,
      );
      return null;
    }

    await ensureDailyConnectPayoutSchedule(stripe, existing);
    await syncStripeConnectAccountToProfile(supabaseAdmin, userId, existing);
    return accountId;
  } catch (err) {
    if (isMissingStripeAccountError(err)) {
      console.warn("validateExistingStripeAccount missing account skipped", accountId);
      return null;
    }

    if (isStripeLiveModeMismatchError(err)) {
      console.warn(
        "validateExistingStripeAccount livemode mismatch skipped",
        accountId,
      );
      return null;
    }

    console.warn(
      "validateExistingStripeAccount failed",
      accountId,
      stripeErrorMessage(err),
    );
    throw err;
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
    settings: {
      payouts: {
        schedule: DAILY_CONNECT_PAYOUT_SCHEDULE,
      },
    },
  };
}

/** Express accounts should pay out to the traveler's bank every business day. */
async function ensureDailyConnectPayoutSchedule(
  stripe: Stripe,
  account: Pick<Stripe.Account, "id" | "settings">,
): Promise<void> {
  if (account.settings?.payouts?.schedule?.interval === "daily") {
    return;
  }

  try {
    await stripe.accounts.update(account.id, {
      settings: {
        payouts: {
          schedule: DAILY_CONNECT_PAYOUT_SCHEDULE,
        },
      },
    });
  } catch (err) {
    console.warn(
      "ensureDailyConnectPayoutSchedule failed",
      account.id,
      stripeErrorMessage(err),
    );
  }
}

async function createStripeConnectAccount(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  profile: TravelerStripeProfile,
  userId: string,
  createParams: Stripe.AccountCreateParams,
): Promise<Stripe.Account> {
  const recoveredBeforeCreate = await findStripeAccountIdForUser(
    stripe,
    supabaseAdmin,
    profile,
    userId,
  );
  if (recoveredBeforeCreate) {
    try {
      return await stripe.accounts.retrieve(recoveredBeforeCreate);
    } catch (err) {
      if (!isStaleStripeConnectAccountError(err)) {
        throw err;
      }
    }
  }

  const idempotencyKey = `connect-account-${CONNECT_ACCOUNT_IDEMPOTENCY_VERSION}-${userId}`;

  const createFreshAccount = () =>
    stripe.accounts.create(createParams, {
      idempotencyKey: `${idempotencyKey}-fresh-${Date.now()}`,
    });

  let account: Stripe.Account;
  try {
    account = await stripe.accounts.create(createParams, { idempotencyKey });
  } catch (err) {
    if (!isStripeIdempotencyError(err) && !isStripeAccountCreateConflict(err)) {
      throw err;
    }

    const recoveredAccountId = await findStripeAccountIdForUser(
      stripe,
      supabaseAdmin,
      {
        email:
          typeof createParams.email === "string" ? createParams.email : null,
      } as TravelerStripeProfile,
      userId,
    );
    if (!recoveredAccountId) {
      return await createFreshAccount();
    }

    try {
      account = await stripe.accounts.retrieve(recoveredAccountId);
    } catch (retrieveErr) {
      if (!isStaleStripeConnectAccountError(retrieveErr)) {
        throw retrieveErr;
      }

      return await createFreshAccount();
    }
  }

  try {
    return await stripe.accounts.retrieve(account.id);
  } catch (err) {
    if (!isStaleStripeConnectAccountError(err)) {
      throw err;
    }

    console.warn(
      "createStripeConnectAccount idempotency replayed deleted account — recovering or creating fresh",
      account.id,
      stripeErrorMessage(err),
    );

    const recoveredAfterReset = await findStripeAccountIdForUser(
      stripe,
      supabaseAdmin,
      profile,
      userId,
    );
    if (recoveredAfterReset) {
      return await stripe.accounts.retrieve(recoveredAfterReset);
    }

    return await createFreshAccount();
  }
}

/**
 * Reuses an existing Connect account when one is already linked or discoverable in Stripe.
 * Never creates a new account.
 */
export async function resolveExistingStripeConnectAccountId(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  profile: TravelerStripeProfile,
  userId: string,
): Promise<string | null> {
  let syncedProfile = profile.stripe_account_id
    ? await refreshStripeConnectAccountStatus(
      stripe,
      supabaseAdmin,
      profile,
      userId,
    )
    : await syncTravelerStripeConnectProfileFromStripe(
      stripe,
      supabaseAdmin,
      userId,
      profile,
    );

  const candidateIds: string[] = [];
  if (syncedProfile.stripe_account_id) {
    candidateIds.push(syncedProfile.stripe_account_id);
  }

  const discovered = await findStripeAccountIdForUser(
    stripe,
    supabaseAdmin,
    syncedProfile,
    userId,
  );
  if (discovered && !candidateIds.includes(discovered)) {
    candidateIds.push(discovered);
  }

  for (const accountId of candidateIds) {
    try {
      const validated = await validateExistingStripeAccount(
        stripe,
        supabaseAdmin,
        userId,
        accountId,
      );
      if (validated) {
        return validated;
      }
    } catch (err) {
      if (isStaleStripeConnectAccountError(err)) {
        continue;
      }
      throw err;
    }
  }

  return syncedProfile.stripe_account_id;
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
  const existingAccountId = await resolveExistingStripeConnectAccountId(
    stripe,
    supabaseAdmin,
    profile,
    userId,
  );
  if (existingAccountId) {
    return existingAccountId;
  }

  const latestProfile = await loadTravelerProfile(supabaseAdmin, userId);
  if (latestProfile?.stripe_account_id) {
    throw new Error(
      "Could not verify the linked Stripe account. Try again in a moment.",
    );
  }

  const profileForCreate = latestProfile ?? profile;
  const createParams = buildConnectAccountCreateParams(
    profileForCreate,
    userId,
    userEmail,
  );

  const account = await createStripeConnectAccount(
    stripe,
    supabaseAdmin,
    profileForCreate,
    userId,
    createParams,
  );
  const claimedId = await claimStripeAccountId(supabaseAdmin, userId, account.id);
  await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);
  return claimedId;
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

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    if (account.livemode !== isStripeLiveMode()) {
      console.warn(
        "refreshStripeConnectAccountStatus livemode mismatch — leaving profile unchanged",
        profile.stripe_account_id,
      );
      return profile;
    }

    await ensureDailyConnectPayoutSchedule(stripe, account);
    await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);

    const refreshed = await loadTravelerProfile(supabaseAdmin, userId);
    return refreshed ?? profile;
  } catch (err) {
    if (isStripeLiveModeMismatchError(err)) {
      console.warn(
        "refreshStripeConnectAccountStatus livemode mismatch — leaving profile unchanged",
        profile.stripe_account_id,
      );
      return profile;
    }

    if (!isMissingStripeAccountError(err)) {
      console.warn(
        "refreshStripeConnectAccountStatus failed",
        profile.stripe_account_id,
        stripeErrorMessage(err),
      );
      return profile;
    }

    console.warn(
      "refreshStripeConnectAccountStatus stored account missing",
      profile.stripe_account_id,
      stripeErrorMessage(err),
    );
    return clearStoredStripeLinkOnlyIfDeleted(
      stripe,
      supabaseAdmin,
      userId,
      profile,
    );
  }
}

function isStripeConnectAccountAcceptableForPayment(
  account: Pick<
    Stripe.Account,
    "livemode" | "details_submitted" | "payouts_enabled" | "charges_enabled" | "capabilities"
  >,
): boolean {
  if (account.livemode !== isStripeLiveMode()) {
    return false;
  }

  if (
    account.details_submitted === true ||
    account.payouts_enabled === true ||
    account.charges_enabled === true
  ) {
    return true;
  }

  const transfers = account.capabilities?.transfers;
  return transfers === "active" || transfers === "pending";
}

async function isConnectAccountLivemodeValid(
  stripe: Stripe,
  accountId: string,
): Promise<boolean | null> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account.livemode === isStripeLiveMode();
  } catch (err) {
    console.warn(
      "isConnectAccountLivemodeValid lookup failed",
      accountId,
      stripeErrorMessage(err),
    );
    return null;
  }
}

async function syncConnectAccountBestEffort(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<void> {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    if (account.livemode !== isStripeLiveMode()) {
      return;
    }

    await ensureDailyConnectPayoutSchedule(stripe, account);
    await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);
  } catch (err) {
    console.warn(
      "syncConnectAccountBestEffort failed",
      accountId,
      stripeErrorMessage(err),
    );
  }
}

/**
 * Resolves the traveler's Connect account before sender checkout.
 * Verified travelers proceed immediately — Stripe sync runs best-effort in the background.
 */
export async function resolveTravelerConnectAccountForPayment(
  stripe: Stripe,
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const initialProfile = await loadTravelerProfile(supabaseAdmin, userId);
  if (!initialProfile) {
    return null;
  }

  const verifiedBeforeSync = isTravelerProfileVerifiedForSenderPayment(initialProfile);
  const trustedAccountId = verifiedBeforeSync
    ? initialProfile.stripe_account_id?.trim() ?? null
    : null;

  let profile = initialProfile;
  try {
    if (initialProfile.stripe_account_id) {
      profile = await refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        initialProfile,
        userId,
      );
    } else if (!verifiedBeforeSync) {
      profile = await reconcileTravelerStripeConnectProfile(
        stripe,
        supabaseAdmin,
        userId,
        initialProfile,
      );
    }
  } catch (err) {
    console.warn(
      "resolveTravelerConnectAccountForPayment sync failed",
      userId,
      stripeErrorMessage(err),
    );
    profile = initialProfile;
  }

  const verifiedAccountId =
    trustedAccountId ??
    (isTravelerProfileVerifiedForSenderPayment(profile)
      ? profile.stripe_account_id?.trim() ?? null
      : null);

  if (verifiedAccountId) {
    const livemodeOk = await isConnectAccountLivemodeValid(stripe, verifiedAccountId);
    if (livemodeOk === false) {
      console.warn(
        "resolveTravelerConnectAccountForPayment livemode mismatch on verified account — using profile id",
        verifiedAccountId,
      );
    }

    await syncConnectAccountBestEffort(
      stripe,
      supabaseAdmin,
      userId,
      verifiedAccountId,
    );
    return verifiedAccountId;
  }

  const candidateIds: string[] = [];
  const linkedId = profile.stripe_account_id?.trim();
  if (linkedId) {
    candidateIds.push(linkedId);
  }

  const discovered = await findStripeAccountIdForUser(
    stripe,
    supabaseAdmin,
    profile,
    userId,
  );
  if (discovered && !candidateIds.includes(discovered)) {
    candidateIds.push(discovered);
  }

  for (const accountId of candidateIds) {
    try {
      const account = await stripe.accounts.retrieve(accountId);
      if (!isStripeConnectAccountAcceptableForPayment(account)) {
        continue;
      }

      await ensureDailyConnectPayoutSchedule(stripe, account);
      await syncStripeConnectAccountToProfile(supabaseAdmin, userId, account);
      return accountId;
    } catch (err) {
      if (!isMissingStripeAccountError(err)) {
        console.warn(
          "resolveTravelerConnectAccountForPayment candidate failed",
          accountId,
          stripeErrorMessage(err),
        );
      }
    }
  }

  if (
    linkedId &&
    profile.stripe_details_submitted === true
  ) {
    const livemodeOk = await isConnectAccountLivemodeValid(stripe, linkedId);
    if (livemodeOk !== false) {
      await syncConnectAccountBestEffort(stripe, supabaseAdmin, userId, linkedId);
      return linkedId;
    }
  }

  return null;
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
  try {
    if (profile.stripe_account_id) {
      profile = await refreshStripeConnectAccountStatus(
        stripe,
        supabaseAdmin,
        profile,
        userId,
      );
    }

    const recoveredAccountId = await findStripeAccountIdForUser(
      stripe,
      supabaseAdmin,
      profile,
      userId,
    );
    if (!recoveredAccountId) {
      if (profile.stripe_account_id) {
        return clearStoredStripeLinkOnlyIfDeleted(
          stripe,
          supabaseAdmin,
          userId,
          profile,
        );
      }
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
  } catch (err) {
    console.warn(
      "reconcileTravelerStripeConnectProfile failed",
      userId,
      stripeErrorMessage(err),
    );

    const latest = await loadTravelerProfile(supabaseAdmin, userId);
    return latest ?? profile;
  }
}
