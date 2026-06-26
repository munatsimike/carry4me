import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import { AppError } from "@/app/shared/domain/AppError";
import type { InfoModalPayload } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import {
  type StripeConnectClientState,
  getStripeConnectClientState,
} from "./travelerStripeConnectStatus";

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
};

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
    status.onboarding_complete === true ||
    status.verified === true ||
    (!!status.stripe_account_id && status.stripe_details_submitted === true)
  );
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
  const { returnUrl, refreshUrl } = resolveOnboardingUrls(options);

  const onboarding = await invokeStripeFunction<ConnectOnboardingResponse>(
    "stripe-connect-onboarding",
    { return_url: returnUrl, refresh_url: refreshUrl },
  );

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
  let status: ConnectStatusResponse | null = null;

  try {
    status = await fetchTravelerStripeConnectStatus();
  } catch {
    status = null;
  }

  if (isTravelerStripeReadyForAccept(status)) {
    return true;
  }

  if (status && !status.phone_verified) {
    options.openInfo({
      title: "Phone verification required",
      message: "Verify your phone number before you can accept paid carry requests.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  if (status && !status.email_verified) {
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
