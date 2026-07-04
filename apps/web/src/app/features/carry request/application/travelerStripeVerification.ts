import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import { AppError } from "@/app/shared/domain/AppError";
import type { InfoModalPayload } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import {
  type StripeConnectClientState,
  getStripeConnectClientState,
  getStripeConnectStatusLabel,
  isTravelerStripeAcceptReadyInProfile,
} from "./travelerStripeConnectStatus";
import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";

export type ConnectStatusResponse = {
  verified: boolean;
  onboarding_complete?: boolean;
  connect_state?: StripeConnectClientState;
  stripe_account_id?: string | null;
  stripe_details_submitted?: boolean;
  stripe_payouts_enabled?: boolean;
  stripe_verification_status?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
};

type ConnectOnboardingResponse = ConnectStatusResponse & {
  onboarding_url: string | null;
  code?: string;
};

type TravelerStripeReadyOptions = {
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void;
  returnUrl?: string;
  refreshUrl?: string;
  onStripeSynced?: () => void | Promise<void>;
  profile?: TravelerStripeProfileSnapshot | null;
};

type TravelerStripeProfileSnapshot = Pick<
  UserProfile,
  | "stripeAccountId"
  | "stripeDetailsSubmitted"
  | "stripePayoutsEnabled"
  | "stripeVerificationStatus"
>;

const VERIFICATION_MESSAGE =
  "Complete Stripe verification to receive payouts. You can also finish this later from your profile page.";

function resolveOnboardingUrls(options: TravelerStripeReadyOptions = {} as TravelerStripeReadyOptions) {
  const origin = window.location.origin;
  return {
    returnUrl: options.returnUrl ?? `${origin}/requests?stripe=return`,
    refreshUrl: options.refreshUrl ?? `${origin}/requests?stripe=refresh`,
  };
}

export function isTravelerStripeReadyForAccept(
  status: ConnectStatusResponse | null | undefined,
): boolean {
  if (!status) return false;

  return (
    status.stripe_verification_status === "verified" || status.verified === true
  );
}

async function loadTravelerStripeConnectStatus(
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void,
): Promise<ConnectStatusResponse | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchTravelerStripeConnectStatus();
    } catch (err) {
      lastError = err;
    }
  }

  handleStripeVerificationError(lastError, openInfo);
  return null;
}

function handleStripeVerificationError(
  err: unknown,
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void,
): false {
  const appError = AppError.fromUnknown(err);

  if (appError.status === 401 || appError.code === "NOT_AUTHENTICATED") {
    openInfo({
      title: "Session expired",
      message:
        "Your sign-in session expired. Sign in again, then retry Stripe verification.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  if (appError.code === "PHONE_NOT_VERIFIED") {
    openInfo({
      title: "Phone verification required",
      message: "Verify your phone number before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  if (appError.code === "EMAIL_NOT_VERIFIED") {
    openInfo({
      title: "Email verification required",
      message: "Verify your email before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  const lowerMessage = appError.message.toLowerCase();
  if (
    appError.code === "STRIPE_ACCOUNT_NOT_FOUND" ||
    lowerMessage.includes("no such account")
  ) {
    openInfo({
      title: "Stripe account reset required",
      message:
        "Your previous Stripe payout account was removed. Close this and try setup again — a fresh account will be created.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  openInfo({
    title: "Could not open Stripe verification",
    message:
      appError.message ||
      "We couldn't start payout verification. Check your connection and try again from your profile.",
    label: "Close",
    secondaryLabel: "Maybe later",
  });
  return false;
}

/**
 * Syncs from Stripe and redirects to hosted onboarding when still required.
 */
export async function redirectToTravelerStripeOnboarding(
  options: TravelerStripeReadyOptions = {} as TravelerStripeReadyOptions,
): Promise<boolean> {
  try {
    const status = await fetchTravelerStripeConnectStatus();
    if (isTravelerStripeReadyForAccept(status)) {
      await options.onStripeSynced?.();
      return true;
    }

    if (
      status.onboarding_complete === true ||
      (!!status.stripe_account_id && status.stripe_details_submitted === true)
    ) {
      await options.onStripeSynced?.();
      return true;
    }
  } catch {
    // Fall through to hosted onboarding when status sync is unavailable.
  }

  const { returnUrl, refreshUrl } = resolveOnboardingUrls(options);

  let onboarding: ConnectOnboardingResponse;
  try {
    onboarding = await invokeStripeFunction<ConnectOnboardingResponse>(
      "stripe-connect-onboarding",
      { return_url: returnUrl, refresh_url: refreshUrl },
    );
  } catch (firstErr) {
    const appError = AppError.fromUnknown(firstErr);
    const shouldRetry =
      appError.code === "STRIPE_ACCOUNT_NOT_FOUND" ||
      appError.message.toLowerCase().includes("no such account");

    if (!shouldRetry) {
      throw firstErr;
    }

    onboarding = await invokeStripeFunction<ConnectOnboardingResponse>(
      "stripe-connect-onboarding",
      { return_url: returnUrl, refresh_url: refreshUrl },
    );
  }

  if (isTravelerStripeReadyForAccept(onboarding)) {
    await options.onStripeSynced?.();
    return true;
  }

  if (!onboarding.onboarding_url) {
    throw new AppError({
      message: "Stripe onboarding link was not returned. Try again in a moment.",
    });
  }

  window.location.href = onboarding.onboarding_url;
  return false;
}

export async function fetchTravelerStripeConnectStatus(): Promise<ConnectStatusResponse> {
  return invokeStripeFunction<ConnectStatusResponse>("stripe-connect-status", {});
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function needsStripeConnectReconcile(status: ConnectStatusResponse): boolean {
  if (!status.stripe_account_id) {
    return true;
  }

  if (
    !status.stripe_details_submitted &&
    status.onboarding_complete !== true &&
    !isTravelerStripeReadyForAccept(status)
  ) {
    return true;
  }

  return false;
}

async function reconcileTravelerStripeConnectFromOnboarding(
  options: { returnUrl?: string; refreshUrl?: string } = {},
): Promise<ConnectStatusResponse> {
  const { returnUrl, refreshUrl } = resolveOnboardingUrls(
    options as TravelerStripeReadyOptions,
  );

  return invokeStripeFunction<ConnectOnboardingResponse>("stripe-connect-onboarding", {
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });
}

/**
 * After Stripe redirects back, sync profile columns from Stripe (with retries).
 * Never follows a new onboarding URL — only writes status to the database.
 */
export async function syncTravelerStripeConnectAfterReturn(
  options: { returnUrl?: string; refreshUrl?: string } = {},
): Promise<ConnectStatusResponse> {
  try {
    let status = await reconcileTravelerStripeConnectFromOnboarding(options);

    if (!needsStripeConnectReconcile(status)) {
      return status;
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await sleep(1500);
      status = await reconcileTravelerStripeConnectFromOnboarding(options);
      if (!needsStripeConnectReconcile(status)) {
        return status;
      }
    }

    return status;
  } catch {
    return fetchTravelerStripeConnectStatus();
  }
}

export function isTravelerStripeProfileSyncedWithStatus(
  profile: TravelerStripeProfileSnapshot,
  status: ConnectStatusResponse,
): boolean {
  return (
    (profile.stripeAccountId ?? null) === (status.stripe_account_id ?? null) &&
    profile.stripeDetailsSubmitted === (status.stripe_details_submitted === true) &&
    profile.stripePayoutsEnabled === (status.stripe_payouts_enabled === true) &&
    (profile.stripeVerificationStatus ?? "not_started") ===
      (status.stripe_verification_status ?? "not_started")
  );
}

export function isTravelerStripeReturnSuccess(
  status: ConnectStatusResponse,
): boolean {
  return (
    isTravelerStripePayoutCompleteFromStatus(status) ||
    status.onboarding_complete === true ||
    (status.stripe_details_submitted === true && !!status.stripe_account_id)
  );
}

export function getTravelerStripeReturnToast(status: ConnectStatusResponse): {
  message: string;
  variant: "success" | "info";
} {
  if (isTravelerStripeReturnSuccess(status)) {
    return {
      message: isTravelerStripePayoutCompleteFromStatus(status)
        ? "Payout setup complete — your Stripe account is ready."
        : "Stripe onboarding complete — Stripe is reviewing your payout account.",
      variant: "success",
    };
  }

  const state = resolveConnectStateFromStatus(status);
  return {
    message: `Payout status: ${getStripeConnectStatusLabel(
      state,
      status.stripe_details_submitted === true,
    )}`,
    variant: "info",
  };
}

/**
 * Starts onboarding immediately (user already clicked an explicit setup action).
 */
export async function startTravelerStripeOnboarding(
  options: TravelerStripeReadyOptions,
): Promise<boolean> {
  try {
    return await redirectToTravelerStripeOnboarding(options);
  } catch (err) {
    return handleStripeVerificationError(err, options.openInfo);
  }
}

function promptTravelerStripeOnboarding(
  options: TravelerStripeReadyOptions,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    options.openInfo({
      title: "Stripe verification required",
      message: VERIFICATION_MESSAGE,
      label: "Continue to Stripe",
      secondaryLabel: "Maybe later",
      secondaryAction: () => resolve(false),
      onClick: () => {
        void (async () => {
          try {
            const ready = await redirectToTravelerStripeOnboarding(options);
            resolve(ready);
          } catch (err) {
            handleStripeVerificationError(err, options.openInfo);
            resolve(false);
          }
        })();
      },
    });
  });
}

export async function ensureTravelerStripeReady(
  options: TravelerStripeReadyOptions,
): Promise<boolean> {
  if (isTravelerStripeAcceptReadyInProfile(options.profile)) {
    return true;
  }

  const status = await loadTravelerStripeConnectStatus(options.openInfo);
  if (!status) {
    return false;
  }

  if (isTravelerStripeReadyForAccept(status)) {
    await options.onStripeSynced?.();
    return true;
  }

  if (!status.phone_verified) {
    options.openInfo({
      title: "Phone verification required",
      message: "Verify your phone number before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  if (!status.email_verified) {
    options.openInfo({
      title: "Email verification required",
      message: "Verify your email before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  return promptTravelerStripeOnboarding(options);
}

/**
 * Stripe gate before accept/send carry actions.
 * Checks payout status first, then shows the Stripe setup modal when needed
 * (before any accept/send confirmation — not after).
 */
export async function ensureTravelerStripeReadyForCarryAction(
  options: TravelerStripeReadyOptions,
): Promise<boolean> {
  if (isTravelerStripeAcceptReadyInProfile(options.profile)) {
    return true;
  }

  const status = await loadTravelerStripeConnectStatus(options.openInfo);
  if (!status) {
    return false;
  }

  if (isTravelerStripeReadyForAccept(status)) {
    await options.onStripeSynced?.();
    return true;
  }

  if (!status.phone_verified) {
    options.openInfo({
      title: "Phone verification required",
      message: "Verify your phone number before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  if (!status.email_verified) {
    options.openInfo({
      title: "Email verification required",
      message: "Verify your email before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  return promptTravelerStripeOnboarding(options);
}

export function resolveConnectStateFromStatus(
  status: ConnectStatusResponse,
): StripeConnectClientState {
  if (status.connect_state) {
    return status.connect_state;
  }

  return getStripeConnectClientState({
    stripeAccountId: status.stripe_account_id,
    stripeDetailsSubmitted: status.stripe_details_submitted,
    stripePayoutsEnabled: status.stripe_payouts_enabled,
  });
}

export function isTravelerStripePayoutCompleteFromStatus(
  status: ConnectStatusResponse,
): boolean {
  return (
    resolveConnectStateFromStatus(status) === "ready" ||
    isTravelerStripeReadyForAccept(status)
  );
}
