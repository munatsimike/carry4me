import { useState } from "react";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import {
  getStripeConnectClientState,
  getStripeConnectStatusDescription,
  getStripeConnectStatusLabel,
} from "@/app/features/carry request/application/travelerStripeConnectStatus";
import {
  fetchTravelerStripeConnectStatus,
  resolveConnectStateFromStatus,
  startTravelerStripeOnboarding,
} from "@/app/features/carry request/application/travelerStripeVerification";

type TravelerPayoutStatusRowProps = {
  profile: UserProfile;
  onStatusRefreshed?: () => void | Promise<void>;
};

export function TravelerPayoutStatusRow({
  profile,
  onStatusRefreshed,
}: TravelerPayoutStatusRowProps) {
  const { openInfo } = useUniversalModal();
  const [loading, setLoading] = useState(false);

  const connectState = getStripeConnectClientState({
    stripeAccountId: profile.stripeAccountId,
    stripeDetailsSubmitted: profile.stripeDetailsSubmitted,
    stripePayoutsEnabled: profile.stripePayoutsEnabled,
  });
  const statusLabel = getStripeConnectStatusLabel(connectState);
  const statusDescription = getStripeConnectStatusDescription(connectState);

  const handleSetupPayouts = async () => {
    setLoading(true);
    try {
      await startTravelerStripeOnboarding({
        openInfo,
        returnUrl: `${window.location.origin}/profile?stripe=return`,
        refreshUrl: `${window.location.origin}/profile?stripe=refresh`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      const status = await fetchTravelerStripeConnectStatus();
      const refreshedState = resolveConnectStateFromStatus(status);
      if (refreshedState === "ready") {
        openInfo({
          title: "Payouts ready",
          message: "Your Stripe payout account is verified.",
          label: "Close",
        });
      }
      await onStatusRefreshed?.();
    } catch {
      openInfo({
        title: "Could not refresh payout status",
        message: "Try again in a moment.",
        label: "Close",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
      <InfoRow label="Traveler payouts" value={statusLabel} />
      <CustomText textSize="xs" textVariant="secondary">
        {statusDescription}
      </CustomText>
      {connectState !== "ready" ? (
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => void handleSetupPayouts()}
          disabled={loading}
          isBusy={loading}
        >
          {connectState === "not_created" ? "Set up payouts" : "Continue Stripe setup"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => void handleRefreshStatus()}
          disabled={loading}
          isBusy={loading}
        >
          Refresh payout status
        </Button>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <CustomText textSize="xs" textVariant="secondary">
        {label}
      </CustomText>
      <CustomText textSize="sm" textVariant="primary" className="font-medium">
        {value}
      </CustomText>
    </div>
  );
}
