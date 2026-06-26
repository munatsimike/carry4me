export type StripeConnectClientState = "not_created" | "setup_incomplete" | "ready";

export type StripeConnectProfileFields = {
  stripeAccountId?: string | null;
  stripeDetailsSubmitted?: boolean;
  stripePayoutsEnabled?: boolean;
};

export function getStripeConnectClientState(
  profile: StripeConnectProfileFields,
): StripeConnectClientState {
  if (!profile.stripeAccountId) {
    return "not_created";
  }

  if (profile.stripeDetailsSubmitted && profile.stripePayoutsEnabled) {
    return "ready";
  }

  return "setup_incomplete";
}

export function getStripeConnectStatusLabel(state: StripeConnectClientState): string {
  switch (state) {
    case "not_created":
      return "Not set up";
    case "setup_incomplete":
      return "Setup incomplete";
    case "ready":
      return "Ready for payouts";
  }
}

export function getStripeConnectStatusDescription(state: StripeConnectClientState): string {
  switch (state) {
    case "not_created":
      return "Complete Stripe verification to receive payouts for deliveries you carry.";
    case "setup_incomplete":
      return "Finish identity and bank verification in Stripe to enable payouts.";
    case "ready":
      return "Your payout account is verified and ready to receive earnings.";
  }
}

export function isTravelerStripePayoutReady(profile: StripeConnectProfileFields): boolean {
  return getStripeConnectClientState(profile) === "ready";
}
