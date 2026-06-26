import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import type { TripListing } from "../features/trips/domain/Trip";
import type { ParcelListing } from "../features/parcels/domain/Parcel";
import { useMemo, useState } from "react";
import { SupabaseCarryRequestRepository } from "../features/carry request/data/SupabaseCarryRequestRepository";
import { CreateCarryRequestUseCase } from "../features/carry request/application/CreateCarryReaquest";
import { AppError } from "@/app/shared/domain/AppError";
import { useUniversalModal } from "../shared/Authentication/application/DialogBoxModalProvider";
import { useMarketplaceActionGuard } from "../shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import { useAuth } from "../shared/supabase/AuthProvider";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns/format";
import { dateFormat } from "@/types/Ui";
import { cn } from "@/app/lib/cn";
import {
  ModalBody,
  ModalFooter,
  ModalSeparator,
} from "@/app/components/ModalFooter";
import { processRequestSentEmailQueue } from "../features/carry request/application/processRequestSentEmailQueue";
import { ensureTravelerStripeReady } from "../features/carry request/application/travelerStripeVerification";
import { CarryRequestCostSummary } from "../features/carry request/ui/CarryRequestCostSummary";
import {
  RequestDetailsGrid,
  RequestParcelDetailsSection,
  RequestTripDetailsSection,
} from "../features/carry request/ui/RequestDetailsLayout";
import { formatPersonDisplayName } from "../shared/application/formatPersonDisplayName";
import { tripAcceptsParcelCategories } from "../features/goods/domain/goodsCategoryConstants";

type RequestSummaryProps = {
  loggedInUserId: string;
  trip: TripListing;
  parcel: ParcelListing;
  onClose: () => void;
  isSenderRequesting: boolean;
};

export default function RequestSummary({
  loggedInUserId,
  trip,
  parcel,
  onClose,
  isSenderRequesting,
}: RequestSummaryProps) {
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );

  const createRequest = useMemo(
    () => new CreateCarryRequestUseCase(carryRequestRepository),
    [carryRequestRepository],
  );

  const [requestLoaded, setLoadRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const { showSupabaseError, openInfo, confirm } = useUniversalModal();
  const navigate = useNavigate();

  const routeMismatch = useMemo(() => {
    const originMismatch =
      parcel.route.originCountry !== trip.route.originCountry;
    const destinationMismatch =
      parcel.route.destinationCountry !== trip.route.destinationCountry;

    return {
      hasMismatch: originMismatch || destinationMismatch,
      originMismatch,
      destinationMismatch,
    };
  }, [parcel.route, trip.route]);

  const sendValidation = useMemo(() => {
    const issues: RequestFormIssue[] = [];

    if (routeMismatch.hasMismatch) {
      issues.push(getRouteMismatchIssue(routeMismatch));
    }

    if (parcel.weightKg > trip.weightKg) {
      issues.push(getWeightCapacityIssue(isSenderRequesting));
    }

    const categoriesAccepted = tripAcceptsParcelCategories(
      trip.goodsCategory,
      parcel.goodsCategory,
    );

    if (!categoriesAccepted) {
      issues.push(getCategoryMismatchIssue());
    }

    return {
      canSend: issues.length === 0,
      issues,
    };
  }, [
    routeMismatch,
    parcel.weightKg,
    parcel.goodsCategory,
    trip.weightKg,
    trip.goodsCategory,
    isSenderRequesting,
  ]);

  const canSendRequest = sendValidation.canSend;

  const pricePerKg = isSenderRequesting ? trip.pricePerKg : parcel.pricePerKg;
  const tripRoute = {
    originCountry: trip.route.originCountry,
    destinationCountry: trip.route.destinationCountry,
    originCity: trip.route.originCity,
    destinationCity: trip.route.destinationCity,
  };
  const parcelRoute = {
    originCountry: parcel.route.originCountry,
    destinationCountry: parcel.route.destinationCountry,
    originCity: parcel.route.originCity,
    destinationCity: parcel.route.destinationCity,
  };
  const parcelItems = parcel.goodsCategory.map((item) => item.name).join(", ");

  const confirmResendAfterEndedRequest = async (): Promise<boolean> => {
    try {
      const senderUserId = parcel.user.id;
      const travelerUserId = trip.user.id;
      if (!senderUserId || !travelerUserId) {
        return true;
      }

      const priorRequest =
        await carryRequestRepository.findLatestEndedRequestBetweenParties(
          senderUserId,
          travelerUserId,
        );

      if (!priorRequest) {
        return true;
      }

      const counterpartLabel = isSenderRequesting ? "traveler" : "sender";
      const endedByCurrentUser =
        priorRequest.endedByUserId === loggedInUserId;

      let message: string;
      if (endedByCurrentUser) {
        if (priorRequest.status === "REJECTED") {
          message = `You rejected a request from this ${counterpartLabel}. Do you want to proceed?`;
        } else if (priorRequest.status === "CANCELLED") {
          message = `You cancelled a request from this ${counterpartLabel}. Do you want to proceed?`;
        } else {
          message = `A previous request with this ${counterpartLabel} expired. Do you want to proceed?`;
        }
      } else if (priorRequest.status === "REJECTED") {
        message = `A previous request with this ${counterpartLabel} was declined. Do you want to proceed?`;
      } else if (priorRequest.status === "CANCELLED") {
        message = `A previous request with this ${counterpartLabel} was cancelled. Do you want to proceed?`;
      } else {
        message = `A previous request with this ${counterpartLabel} expired. Do you want to proceed?`;
      }

      return await confirm({
        title: "Send another request?",
        message,
        confirmText: "Proceed",
        cancelText: "Cancel",
      });
    } catch (err) {
      showSupabaseError(err);
      return false;
    }
  };

  const handleSendRequest = async () => {
    if (requestLoaded || !canSendRequest) return;

    try {
      const carryRequestId = await createRequest.execute(
        loggedInUserId,
        parcel,
        trip,
      );

      processRequestSentEmailQueue(carryRequestId);

      openInfo({
        title: "Request sent",
        message:
          "Your request has been sent. You will be notified when the traveler responds.",
        label: "View requests",
        onClick: () => navigate("/requests"),
        secondaryLabel: "Close",
      });

      setLoadRequest(true);
      onClose();
    } catch (err) {
      onClose();

      const appError = AppError.fromUnknown(err);

      if (appError.status === 409) {
        openInfo({
          title: "Pending request exists",
          message: `You already have a pending request with this ${
            isSenderRequesting ? "sender" : "traveler"
          }. Check your existing request for updates.`,
          label: "Go to requests",
          onClick: () => navigate("/requests"),
          secondaryLabel: "Close",
        });
      } else {
        showSupabaseError(appError);
      }
    }
  };

  const handleSendClick = () => {
    if (!canSendRequest || requestLoaded || isSubmitting) return;

    if (!user?.id) return;

    guardAction(() => {
      void (async () => {
        setIsSubmitting(true);
        try {
          const shouldSend = await confirmResendAfterEndedRequest();
          if (!shouldSend) return;

          // Travelers must complete Stripe onboarding before sending/accepting paid requests.
          if (!isSenderRequesting) {
            try {
              const stripeReady = await ensureTravelerStripeReady({
                openInfo,
                onStripeSynced: () => refreshProfile({ silent: true }),
              });
              if (!stripeReady) return;
            } catch (err) {
              showSupabaseError(err);
              return;
            }
          }

          await handleSendRequest();
        } finally {
          setIsSubmitting(false);
        }
      })();
    }, "send_request");
  };

  return (
    <div className="flex flex-col overflow-visible px-1 sm:px-2">
      <ModalBody className="gap-4">
        <header className="flex flex-col gap-4">
          <CustomText
            textSize="lg"
            textVariant="primary"
            className="font-medium leading-tight"
          >
            Review request
          </CustomText>
          <CustomText
            textSize="sm"
            textVariant="secondary"
            className="leading-snug"
          >
            {isSenderRequesting
              ? "Check the trip and parcel details below, then send your carry request."
              : "Check the parcel and your trip details below, then send your offer."}
          </CustomText>
          <ModalSeparator />
        </header>

      {sendValidation.issues.length > 0 ? (
        <div className="flex flex-col gap-2">
          {sendValidation.issues.map((issue) => (
            <RequestFormAlert
              key={issue.id}
              headline={issue.headline}
              detail={issue.detail}
            />
          ))}
        </div>
      ) : null}

      <RequestDetailsGrid>
        <RequestTripDetailsSection
          route={tripRoute}
          travelerName={formatPersonDisplayName(trip.user?.fullName)}
          departsLabel={format(new Date(trip.departDate), dateFormat)}
          highlightOrigin={routeMismatch.originMismatch}
        />
        <RequestParcelDetailsSection
          route={parcelRoute}
          senderName={formatPersonDisplayName(parcel.user.fullName)}
          itemsLabel={parcelItems}
          highlightOrigin={routeMismatch.originMismatch}
        />
        <CarryRequestCostSummary
          weightKg={parcel.weightKg}
          pricePerKg={pricePerKg}
          priceCountry={parcel.route.originCountry}
          showServiceFee
        />
      </RequestDetailsGrid>
      </ModalBody>

      <ModalFooter className="flex-col sm:flex-col">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!canSendRequest || requestLoaded || isSubmitting}
          isBusy={isSubmitting}
          onClick={handleSendClick}
          cornerRadiusClass="rounded-full"
          className={cn(
            "h-9 w-full shadow-sm",
            canSendRequest &&
              !requestLoaded &&
              !isSubmitting &&
              "bg-primary-500 hover:bg-primary-600 hover:shadow-md active:scale-[0.99]",
            !canSendRequest &&
              "border border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-100 hover:shadow-none hover:ring-0",
          )}
        >
          <CustomText
            as="span"
            textSize="sm"
            textVariant={canSendRequest ? "onDark" : "label"}
          >
            {isSubmitting ? "Processing..." : "Submit request"}
          </CustomText>
        </Button>
      </ModalFooter>
    </div>
  );
}

type RouteMismatchState = {
  hasMismatch: boolean;
  originMismatch: boolean;
  destinationMismatch: boolean;
};

type RequestFormIssue = {
  id: string;
  headline: string;
  detail: string;
};

function getRouteMismatchIssue(routeMismatch: RouteMismatchState): RequestFormIssue {
  const detail =
    "The trip and parcel routes must match before you can send a request.";

  if (routeMismatch.originMismatch && routeMismatch.destinationMismatch) {
    return {
      id: "route-both",
      headline: "Origin and destination countries do not match.",
      detail,
    };
  }

  if (routeMismatch.originMismatch) {
    return {
      id: "route-origin",
      headline: "Origin countries do not match.",
      detail,
    };
  }

  return {
    id: "route-destination",
    headline: "Destination countries do not match.",
    detail,
  };
}

function getWeightCapacityIssue(isSenderRequesting: boolean): RequestFormIssue {
  return {
    id: "weight",
    headline: isSenderRequesting
      ? "This traveler doesn’t have enough space for your parcel."
      : "You do not have enough space to carry this parcel.",
    detail: "Reduce the parcel weight or choose a trip with more available capacity.",
  };
}

function getCategoryMismatchIssue(): RequestFormIssue {
  return {
    id: "categories",
    headline:
      "This traveler doesn’t accept one or more item categories in your parcel.",
    detail: "Update the parcel items or choose a trip that accepts those categories.",
  };
}

function RequestFormAlert({
  headline,
  detail,
}: {
  headline: string;
  detail: string;
}) {
  return (
    <div
      role="alert"
      className="flex gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5"
    >
      <AlertCircle
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
        aria-hidden
      />
      <div className="min-w-0 space-y-0.5">
        <CustomText textSize="sm" textVariant="primary" className="font-medium">
          {headline}
        </CustomText>
        <CustomText textSize="sm" textVariant="secondary" className="leading-snug">
          {detail}
        </CustomText>
      </div>
    </div>
  );
}
