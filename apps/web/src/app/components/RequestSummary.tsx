import CustomText from "@/components/ui/CustomText";
import { Button } from "@/components/ui/Button";
import type { TripListing } from "../features/trips/domain/Trip";
import type { ParcelListing } from "../features/parcels/domain/Parcel";
import { useMemo, useState, type ReactNode } from "react";
import { SupabaseCarryRequestRepository } from "../features/carry request/data/SupabaseCarryRequestRepository";
import { CreateCarryRequestUseCase } from "../features/carry request/application/CreateCarryReaquest";
import type { GoodsCategory } from "../features/goods/domain/GoodsCategory";
import { useToast } from "./Toast";
import { AppError } from "@/app/shared/domain/AppError";
import { useUniversalModal } from "../shared/Authentication/application/DialogBoxModalProvider";
import { useMarketplaceActionGuard } from "../shared/Authentication/UI/hooks/useMarketplaceActionGuard";
import { useAuth } from "../shared/supabase/AuthProvider";
import {
  AlertCircle,
  CircleCheck,
  Clock,
  MoveRight,
  Package,
  Plane,
  Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CardLabel from "./card/CardLabel";
import { format } from "date-fns/format";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { CircleBadge } from "@/components/ui/CircleBadge";
import { cn } from "@/app/lib/cn";
import LineDivider from "./LineDivider";
import SvgIcon from "@/components/ui/SvgIcon";
import SendIcon from "@/assets/send-arrow-icon.svg?react";
import { processRequestSentEmailQueue } from "../features/carry request/application/processRequestSentEmailQueue";

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
  const { user } = useAuth();
  const { guardAction } = useMarketplaceActionGuard();
  const { showSupabaseError, openInfo } = useUniversalModal();
  const { toast } = useToast();
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

  const canSendRequest = !routeMismatch.hasMismatch;

  const handleSendRequest = async () => {
    if (requestLoaded || !canSendRequest) return;

    if (parcel.weightKg > trip.weightKg) {
      const message = isSenderRequesting
        ? "This traveler doesn’t have enough space for your parcel."
        : "You do not have enough space to carry this parcel.";

      toast(message, { variant: "warning" });
      onClose();
      return;
    }

    const canCarry = parcel.goodsCategory.every((parcelCategory) =>
      trip.goodsCategory.some(
        (tripCategory) => tripCategory.name === parcelCategory.name,
      ),
    );

    if (!canCarry) {
      toast(
        "This traveler doesn’t accept one or more item categories in your parcel.",
        { variant: "warning" },
      );
      onClose();
      return;
    }

    try {
      const carryRequestId = await createRequest.execute(
        loggedInUserId,
        parcel,
        trip,
      );

      processRequestSentEmailQueue(carryRequestId);

      openInfo({
        icon: <CircleCheck className="h-6 w-6 text-success-500" />,
        title: "Request sent",
        message:
          "Your request has been sent. You will be notified when the traveler responds.",
        onClick: () => navigate("/requests"),
        label: "View requests",
      });

      setLoadRequest(true);
      onClose();
    } catch (err) {
      onClose();

      const appError = AppError.fromUnknown(err);

      if (appError.status === 409) {
        openInfo({
          icon: <Clock className="h-6 w-6 text-warning-400" />,
          title: "Pending request exists",
          message: `You already have a pending request with this ${
            isSenderRequesting ? "sender" : "traveler"
          }. Check your existing request for updates.`,
          label: "Go to requests",
          onClick: () => navigate("/requests"),
        });
      } else {
        showSupabaseError(appError);
      }
    }
  };

  const handleSendClick = () => {
    if (!canSendRequest || requestLoaded) return;

    if (!user?.id) return;

    guardAction(() => {
      void handleSendRequest();
    }, "send_request");
  };

  return (
    <div className="flex flex-col gap-4 px-1 sm:px-2">
      <header className="flex items-start gap-3 border-b border-neutral-100 pb-3">
        <CircleBadge size="md" bgColor="secondary" paddingClassName="p-2">
          <Send
            className="h-6 w-6 text-primary-500"
            strokeWidth={1.5}
            aria-hidden
          />
        </CircleBadge>
        <div className="min-w-0 flex-1">
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
            className="mt-0.5 leading-snug"
          >
            {isSenderRequesting
              ? "Check the trip and parcel details below, then send your carry request."
              : "Check the parcel and your trip details below, then send your offer."}
          </CustomText>
        </div>
      </header>

      {routeMismatch.hasMismatch ? (
        <RouteMismatchNotice routeMismatch={routeMismatch} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <TripSummary
          trip={trip}
          isSenderRequesting={isSenderRequesting}
          highlightOrigin={routeMismatch.originMismatch}
        />
        <ParcelSummary
          parcel={parcel}
          isSenderRequesting={isSenderRequesting}
          travelerPricePerKg={trip.pricePerKg}
          highlightOrigin={routeMismatch.originMismatch}
        />
      </div>

      <Button
        type="button"
        variant="primary"
        size="sm"
        disabled={!canSendRequest || requestLoaded}
        isBusy={!canSendRequest || requestLoaded}
        onClick={handleSendClick}
        cornerRadiusClass="rounded-full"
        className={cn(
          "h-9 w-full shadow-sm",
          canSendRequest &&
            !requestLoaded &&
            "bg-primary-500 hover:bg-primary-600 hover:shadow-md active:scale-[0.99]",
          !canSendRequest &&
            "border border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-100 hover:shadow-none hover:ring-0",
        )}
        leadingIcon={
          <SvgIcon size="sm" Icon={SendIcon} color={canSendRequest ? "onDark" : "neutral"} />
        }
      >
        <CustomText
          as="span"
          textSize="sm"
          textVariant={canSendRequest ? "onDark" : "label"}
          className="font-medium"
        >
          Send carry request
        </CustomText>
      </Button>
    </div>
  );
}

type ParcelSummaryProps = {
  parcel: ParcelListing;
  isSenderRequesting: boolean;
  travelerPricePerKg: number;
  highlightOrigin?: boolean;
};

export function ParcelSummary({
  parcel,
  isSenderRequesting,
  travelerPricePerKg,
  highlightOrigin = false,
}: ParcelSummaryProps) {
  const label = isSenderRequesting ? "Your parcel" : "Parcel to carry";
  const items = parcel.goodsCategory.map((item: GoodsCategory) => item.name);
  const pricePerKg = isSenderRequesting
    ? travelerPricePerKg
    : parcel.pricePerKg;
  const totalPrice = pricePerKg * parcel.weightKg;
  const priceCountry = parcel.route.originCountry;

  return (
    <SummaryPanel variant="parcel" label={label}>
      <RouteLine
        origin={parcel.route.originCountry}
        destination={parcel.route.destinationCountry}
        highlightOrigin={highlightOrigin}
      />
      <SummaryDetails className="mt-3">
        <SummaryRow label="Sender" value={parcel.user.fullName} />
        <SummaryRow label="Items" value={items.join(", ")} />
        <SummaryRow label="Weight" value={`${parcel.weightKg} kg`} />
      </SummaryDetails>
      <LineDivider heightClass="my-3" />
      <SummaryDetails>
        <SummaryRow
          label="Price per kg"
          value={formatCurrencyByCountry(priceCountry, pricePerKg)}
        />
        <SummaryRow
          label="Estimated total"
          value={formatCurrencyByCountry(priceCountry, totalPrice)}
          emphasize
        />
      </SummaryDetails>
    </SummaryPanel>
  );
}

type TripSummaryProps = {
  trip: TripListing;
  isSenderRequesting: boolean;
  highlightOrigin?: boolean;
};

export function TripSummary({
  trip,
  isSenderRequesting,
  highlightOrigin = false,
}: TripSummaryProps) {
  const label = isSenderRequesting ? "Traveler's trip" : "Your trip";
  const items = trip.goodsCategory.map((item) => item.name);

  return (
    <SummaryPanel variant="trip" label={label}>
      <RouteLine
        origin={trip.route.originCountry}
        destination={trip.route.destinationCountry}
        highlightOrigin={highlightOrigin}
      />
      <SummaryDetails className="mt-3">
        {trip.user?.fullName ? (
          <SummaryRow label="Traveler" value={trip.user.fullName} />
        ) : null}
        <SummaryRow
          label="Departs"
          value={format(new Date(trip.departDate), "MMM d, yyyy")}
        />
        <SummaryRow label="Accepts" value={items.join(", ")} />
        <SummaryRow label="Space left" value={`${trip.weightKg} kg`} />
      </SummaryDetails>
    </SummaryPanel>
  );
}

function SummaryPanel({
  variant,
  label,
  children,
}: {
  variant: "trip" | "parcel";
  label: string;
  children: ReactNode;
}) {
  const icon =
    variant === "trip" ? (
      <Plane className="h-4 w-4 text-primary-600" aria-hidden />
    ) : (
      <Package className="h-4 w-4 text-purple-600" aria-hidden />
    );

  return (
    <section className="flex min-w-0 flex-col rounded-3xl border border-neutral-200 bg-white p-3.5 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              variant === "trip" ? "bg-primary-50" : "bg-purple-50",
            )}
          >
            {icon}
          </span>
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {label}
          </CustomText>
        </div>
        <CardLabel variant={variant} label={variant === "trip" ? "Trip" : "Parcel"} />
      </div>
      {children}
    </section>
  );
}

function RouteLine({
  origin,
  destination,
  highlightOrigin = false,
}: {
  origin: string;
  destination: string;
  highlightOrigin?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-neutral-100 pb-3">
      <RouteCountry highlight={highlightOrigin}>{origin}</RouteCountry>
      <MoveRight
        className="h-5 w-5 shrink-0 text-neutral-400"
        strokeWidth={2}
        aria-hidden
      />
      <RouteCountry>{destination}</RouteCountry>
    </div>
  );
}

function RouteCountry({
  children,
  highlight = false,
}: {
  children: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-base font-semibold leading-tight text-ink-primary",
        highlight &&
          "rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-amber-950",
      )}
    >
      {children}
    </span>
  );
}

type RouteMismatchState = {
  hasMismatch: boolean;
  originMismatch: boolean;
  destinationMismatch: boolean;
};

function getRouteMismatchMessage(routeMismatch: RouteMismatchState): {
  headline: string;
  detail: string;
} {
  const detail =
    "The trip and parcel routes must match before you can send a request.";

  if (routeMismatch.originMismatch && routeMismatch.destinationMismatch) {
    return {
      headline: "Origin and destination countries do not match.",
      detail,
    };
  }

  if (routeMismatch.originMismatch) {
    return {
      headline: "Origin countries do not match.",
      detail,
    };
  }

  return {
    headline: "Destination countries do not match.",
    detail,
  };
}

function RouteMismatchNotice({
  routeMismatch,
}: {
  routeMismatch: RouteMismatchState;
}) {
  const { headline, detail } = getRouteMismatchMessage(routeMismatch);

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

const summaryDetailsGridClass =
  "grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 sm:grid-cols-[8rem_minmax(0,1fr)]";

function SummaryDetails({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={cn(summaryDetailsGridClass, className)}>{children}</dl>;
}

function SummaryRow({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <>
      <dt>
        <CustomText
          textSize="sm"
          className="whitespace-nowrap text-neutral-500"
        >
          {label}
        </CustomText>
      </dt>
      <dd className="min-w-0">
        <CustomText
          textSize="sm"
          className={cn(
            "font-medium leading-snug text-ink-primary",
            emphasize && "font-semibold tabular-nums",
          )}
        >
          {value}
        </CustomText>
      </dd>
    </>
  );
}
