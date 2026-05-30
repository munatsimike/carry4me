import { invokeStripeFunction } from "@/app/shared/stripe/invokeStripeFunction";
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

export async function ensureTravelerStripeReady(options: {
  openInfo: (payload: Omit<InfoModalPayload, "type">) => void;
}): Promise<boolean> {
  const status = await invokeStripeFunction<ConnectStatusResponse>(
    "stripe-connect-status",
    {},
  );

  if (status.verified) {
    return true;
  }

  if (!status.phone_verified) {
    options.openInfo({
      title: "Phone verification required",
      message: "Verify your phone number before you can accept paid carry requests.",
      label: "Close",
    });
    return false;
  }

  if (!status.email_verified) {
    options.openInfo({
      title: "Email verification required",
      message: "Verify your email before you can accept paid carry requests.",
      label: "Close",
    });
    return false;
  }

  const onboarding = await invokeStripeFunction<ConnectOnboardingResponse>(
    "stripe-connect-onboarding",
    {
      return_url: `${window.location.origin}/requests?stripe=return`,
      refresh_url: `${window.location.origin}/requests?stripe=refresh`,
    },
  );

  if (onboarding.verified) {
    return true;
  }

  if (onboarding.onboarding_url) {
    options.openInfo({
      title: "Stripe verification required",
      message: VERIFICATION_MESSAGE,
      width: "xl",
      label: "Continue to Stripe",
      onClick: () => {
        window.location.href = onboarding.onboarding_url!;
      },
      secondaryLabel: "Not now",
    });
    return false;
  }

  options.openInfo({
    title: "Stripe verification required",
    message: VERIFICATION_MESSAGE,
    width: "xl",
    label: "Close",
  });
  return false;
}
