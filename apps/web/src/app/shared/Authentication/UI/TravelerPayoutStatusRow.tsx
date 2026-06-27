import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import type { UserProfile } from "@/app/shared/Authentication/domain/authTypes";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { successCheckCircleIcon } from "@/app/shared/Authentication/UI/modalIcons";
import {
  getStripeConnectClientState,
  getStripeConnectStatusDescription,
  getStripeConnectStatusLabel,
  isTravelerStripeVerifiedInProfile,
} from "@/app/features/carry request/application/travelerStripeConnectStatus";
import {
  fetchTravelerStripeConnectStatus,
  isTravelerStripePayoutCompleteFromStatus,
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
  const statusLabel = getStripeConnectStatusLabel(
    connectState,
    profile.stripeDetailsSubmitted === true,
  );
  const statusDescription = getStripeConnectStatusDescription(
    connectState,
    profile.stripeDetailsSubmitted === true,
  );
  const shouldOfferSetup =
    connectState !== "ready" &&
    !isTravelerStripeVerifiedInProfile(profile);
  const isPayoutComplete =
    connectState === "ready" ||
    isTravelerStripeVerifiedInProfile(profile);

  const payoutsReadyModal = {
    title: "Payouts ready",
    message: "Your Stripe payout account is verified.",
    label: "Close",
    icon: successCheckCircleIcon(),
  } as const;

  useEffect(() => {
    if (!profile.stripeAccountId || isTravelerStripeVerifiedInProfile(profile)) {
      return;
    }

    void fetchTravelerStripeConnectStatus()
      .then((status) => {
        if (
          status.verified ||
          status.stripe_verification_status === "verified"
        ) {
          return onStatusRefreshed?.();
        }
      })
      .catch(() => undefined);
  }, [
    onStatusRefreshed,
    profile.stripeAccountId,
    profile.stripeVerificationStatus,
  ]);

  const handleSetupPayouts = async () => {
    setLoading(true);
    try {
      const synced = await fetchTravelerStripeConnectStatus();
      if (isTravelerStripePayoutCompleteFromStatus(synced)) {
        await onStatusRefreshed?.();
        openInfo({
          ...payoutsReadyModal,
          message: "Your Stripe payout account is already verified.",
        });
        return;
      }

      await startTravelerStripeOnboarding({
        openInfo,
        returnUrl: `${window.location.origin}/profile?stripe=return`,
        refreshUrl: `${window.location.origin}/profile?stripe=refresh`,
        onStripeSynced: onStatusRefreshed,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      const status = await fetchTravelerStripeConnectStatus();
      if (isTravelerStripePayoutCompleteFromStatus(status)) {
        openInfo(payoutsReadyModal);
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
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3",
        isPayoutComplete
          ? "border-success-200 bg-success-50/80"
          : "border-neutral-200 bg-neutral-50/80",
      )}
    >
      <InfoRow
        label="Traveler payouts"
        value={statusLabel}
        isComplete={isPayoutComplete}
      />
      <CustomText textSize="xs" textVariant="secondary">
        {statusDescription}
      </CustomText>
      {shouldOfferSetup ? (
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

function InfoRow({
  label,
  value,
  isComplete = false,
}: {
  label: string;
  value: string;
  isComplete?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
      <CustomText textSize="xs" textVariant="secondary">
        {label}
      </CustomText>
      {isComplete ? (
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2
            className="h-4 w-4 shrink-0 text-success-600"
            strokeWidth={2}
            aria-hidden
          />
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium text-success-600"
          >
            {value}
          </CustomText>
        </span>
      ) : (
        <CustomText textSize="sm" textVariant="primary" className="font-medium">
          {value}
        </CustomText>
      )}
    </div>
  );
}
