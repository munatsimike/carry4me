import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
import { AppError } from "@/app/shared/domain/AppError";
import type { InfoModalPayload } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

type ConnectStatusResponse = {
  verified: boolean;
  stripe_verification_status?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
};

type ConnectOnboardingResponse = {
  verified: boolean;
  onboarding_url: string | null;
  code?: string;
};

const VERIFICATION_MESSAGE =
  "To receive payouts for your deliveries, you need to complete a quick identity and bank account verification with Stripe. This helps us securely send your earnings and keep the platform safe.";

function openStripeVerificationModal(
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void,
  onboarding: ConnectOnboardingResponse,
): boolean {
  if (onboarding.verified) {
    return true;
  }

  if (onboarding.onboarding_url) {
    openInfo({
      title: "Stripe verification required",
      message: VERIFICATION_MESSAGE,
      width: "xl",
      label: "Continue to Stripe",
      onClick: () => {
        window.location.href = onboarding.onboarding_url!;
      },
      secondaryLabel: "Maybe later",
    });
    return false;
  }

  openInfo({
    title: "Stripe verification required",
    message: VERIFICATION_MESSAGE,
    width: "xl",
    label: "Close",
    secondaryLabel: "Maybe later",
  });
  return false;
}

async function startStripeOnboarding(): Promise<ConnectOnboardingResponse> {
  return invokeStripeFunction<ConnectOnboardingResponse>(
    "stripe-connect-onboarding",
    {
      return_url: `${window.location.origin}/requests?stripe=return`,
      refresh_url: `${window.location.origin}/requests?stripe=refresh`,
    },
  );
}

export async function ensureTravelerStripeReady(options: {
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void;
}): Promise<boolean> {
  let status: ConnectStatusResponse | null = null;

  try {
    status = await invokeStripeFunction<ConnectStatusResponse>(
      "stripe-connect-status",
      {},
    );
  } catch {
    // Status check failed (e.g. stale test Connect account) — still offer onboarding.
    status = null;
  }

  if (status?.verified) {
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

  try {
    const onboarding = await startStripeOnboarding();
    return openStripeVerificationModal(options.openInfo, onboarding);
  } catch (err) {
    const appError = AppError.fromUnknown(err);

    if (appError.status === 401 || appError.code === "NOT_AUTHENTICATED") {
      options.openInfo({
        title: "Session expired",
        message:
          "Your sign-in session expired. Sign in again, then retry Stripe verification.",
        label: "Close",
        secondaryLabel: "Maybe later",
      });
      return false;
    }

    if (appError.code === "PHONE_NOT_VERIFIED") {
      options.openInfo({
        title: "Phone verification required",
        message: "Verify your phone number before you can accept paid carry requests.",
        label: "Close",
        secondaryLabel: "Maybe later",
      });
      return false;
    }

    if (appError.code === "EMAIL_NOT_VERIFIED") {
      options.openInfo({
        title: "Email verification required",
        message: "Verify your email before you can accept paid carry requests.",
        label: "Close",
        secondaryLabel: "Maybe later",
      });
      return false;
    }

    options.openInfo({
      title: "Could not open Stripe verification",
      message:
        appError.message ||
        "We couldn't start payout verification. Check your connection and try again from your profile.",
      label: "Close",
      secondaryLabel: "Maybe later",
    });
    return false;
  }
}
