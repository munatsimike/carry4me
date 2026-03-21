import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import LineDivider from "./LineDivider";
import { META_ICONS } from "../icons/MetaIcon";
import SendRequestBtn from "./card/SendRequestBtn";
import type { TripListing } from "../features/trips/domain/Trip";
import type { ParcelListing } from "../features/parcels/domain/Parcel";
import { useMemo, useState } from "react";
import { SupabaseCarryRequestRepository } from "../features/carry request/data/SupabaseCarryRequestRepository";
import { CreateCarryRequestUseCase } from "../features/carry request/application/CreateCarryReaquest";
import type { GoodsCategory } from "../features/goods/domain/GoodsCategory";
import { useToast } from "./Toast";
import { namedCall } from "../shared/Authentication/application/NamedCall";
import { useUniversalModal } from "../shared/Authentication/application/DialogBoxModalProvider";
import { CircleCheck, Clock, MoveRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CardLabel from "./card/CardLabel";
import { format } from "date-fns/format";

type ConfirmRequestProps = {
  loggedInUserId: string;
  trip: TripListing;
  parcel: ParcelListing;
  onClose: () => void;
  isSenderRequesting: boolean;
};

export default function ConfirmRequest({
  loggedInUserId,
  trip,
  parcel,
  onClose,
  isSenderRequesting,
}: ConfirmRequestProps) {
  const carryRequestRepository = useMemo(
    () => new SupabaseCarryRequestRepository(),
    [],
  );
  const createRequest = useMemo(
    () => new CreateCarryRequestUseCase(carryRequestRepository),
    [carryRequestRepository],
  );
  const [requestLoaded, setLoadRequest] = useState<boolean>(false);
  const { showSupabaseError, openInfo } = useUniversalModal();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendRequest = async () => {
    if (requestLoaded) return;

    if (parcel.weightKg > trip.weightKg) {
      const message = isSenderRequesting
        ? "This traveler does not have enough space for your parcel."
        : "You do not have enough space to carry this parcel.";

      toast(message, {
        variant: "warning",
      });
      onClose();
      return;
    }

    if (
      parcel.route.originCountry !== trip.route.originCountry ||
      parcel.route.destinationCountry !== trip.route.destinationCountry
    ) {
      const message =
        "The parcel route must match the trip route (same origin and destination).";
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
        "This traveler does not accept one or more item categories in your parcel.",
        { variant: "warning" },
      );
      onClose();
      return;
    }
    const { result } = await namedCall(
      "create carry request",
      createRequest.execute(loggedInUserId, parcel, trip),
    );

    if (!result.success) {
      onClose();
      if (result.status === 409) {
        openInfo({
          icon: <Clock className="h-6 w-6 text-warning-400" />,
          title: "Pending request exists",
          message: `You already have a request with this ${isSenderRequesting ? "sender" : "traveler"} that is waiting for a response. Please check the existing request for updates.`,
          label: "Go to requests",
          onClick: () => navigate("/requests"),
        });
      } else {
        showSupabaseError(result.error, result.status);
      }
    }

    if (result.success) {
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
    }
  };

  return (
    <div className="flex flex-col px-5 py-2">
      <div className="flex justify-center mb-1">
        <SvgIcon color="primary" size={"lg"} Icon={META_ICONS.sendArrow} />
      </div>
      <div className="flex flex-col items-center">
        <CustomText textSize="lg" textVariant="primary" className="font-medium">
          {"Send a carry parcel request"}
        </CustomText>
        <CustomText textSize="sm" textVariant="secondary">
          {isSenderRequesting
            ? "You're requesting this traveler to carry your parcel on their trip."
            : "You're requesting  to carry this parcel on your upcoming trip."}
        </CustomText>
      </div>
      <LineDivider />
      <TripSummary trip={trip} isSenderRequesting={isSenderRequesting} />
      <LineDivider />
      <ParcelSummary
        parcel={parcel}
        isSenderRequesting={isSenderRequesting}
        travelerPricePerKg={trip.pricePerKg}
      />
      <LineDivider />
      <SendRequestBtn
        buttonTextVariant="onDark"
        payLoad={undefined as never}
        primaryAction={handleSendRequest}
      />
    </div>
  );
}

type ParcelSummaryProps = {
  parcel: ParcelListing;
  isSenderRequesting: boolean;
  travelerPricePerKg: number;
};

export function ParcelSummary({
  parcel,
  isSenderRequesting,
  travelerPricePerKg,
}: ParcelSummaryProps) {
  const label = isSenderRequesting ? "Parcel details" : "Parcel details";
  const items = parcel.goodsCategory.map((item: GoodsCategory) => item.name);
  const pricePerKg = isSenderRequesting
    ? travelerPricePerKg
    : parcel.pricePerKg;

  const totalPrice = pricePerKg * parcel.weightKg;
  const variantSecondary = "secondary";
  const variantPrimary = "primary";
  const textSizeLabel = "sm";
  const textSize = "sm";

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <CardLabel variant="parcel" label={label} />
        <span className="flex gap-2 items-center">
          <CustomText
            as="div"
            textSize="md"
            textVariant="primary"
            className="font-medium"
          >
            {parcel.route.originCountry} {parcel.route.destinationCountry}
          </CustomText>
          <MoveRight className="text-neutral-600 h-4 w-4" strokeWidth={1.5} />

          <CustomText
            as="div"
            textSize="md"
            textVariant="primary"
            className="font-medium"
          >
            {parcel.route.originCountry} {parcel.route.destinationCountry}
          </CustomText>
        </span>

        <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-[120px_1fr] sm:items-start">
          <CustomText textVariant={variantSecondary} textSize={textSizeLabel}>
            Sender
          </CustomText>

          <CustomText as="div" textVariant={variantPrimary} textSize={textSize}>
            {parcel.user.fullName}
          </CustomText>

          <CustomText textVariant={variantSecondary} textSize={textSizeLabel}>
            Items
          </CustomText>

          <CustomText textVariant={variantPrimary} textSize={textSize}>
            {items.join(", ")}
          </CustomText>

          <CustomText textVariant={variantSecondary} textSize={textSizeLabel}>
            Weight
          </CustomText>

          <CustomText textVariant={variantPrimary} textSize={textSize}>
            {parcel.weightKg}kg
          </CustomText>
        </div>
      </div>
      <LineDivider />
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <CustomText as="span" textVariant="secondary" textSize="sm">
            Price per kg
          </CustomText>

          <CustomText
            as="span"
            className="textabular-nums text-right"
            textVariant="primary"
          >
            ${pricePerKg.toFixed(2)}
          </CustomText>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <CustomText
            as="span"
            className="font-semibold"
            textVariant="primary"
            textSize="md"
          >
            Total
          </CustomText>

          <CustomText
            as="span"
            className="text-right font-semibold tabular-nums"
            textVariant="primary"
            textSize="md"
          >
            ${totalPrice.toFixed(2)}
          </CustomText>
        </div>
      </div>
    </section>
  );
}

type TripSummaryProps = {
  trip: TripListing;
  isSenderRequesting: boolean;
};

export function TripSummary({ trip, isSenderRequesting }: TripSummaryProps) {
  const label = isSenderRequesting ? "Trip details" : "Trip details";
  const items = trip.goodsCategory.map((item) => item.name);
  const variantSecondary = "secondary";
  const variantPrimary = "primary";
  const textSizeLabel = "sm";
  const textSize = "sm";

  return (
    <section className="space-y-4 ">
      <div className="space-y-2">
        <CardLabel variant={"trip"} label={label} />
        <span className="flex gap-2 items-center">
          <CustomText
            textSize="md"
            textVariant={variantPrimary}
            className="font-medium"
          >
            {trip.route.originCountry}
          </CustomText>
          <MoveRight className="text-neutral-600 h-4 w-4" strokeWidth={1.5} />
          <CustomText
            textSize="md"
            textVariant={variantPrimary}
            className="font-medium"
          >
            {trip.route.destinationCountry}
          </CustomText>
        </span>
        <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-[120px_1fr] sm:items-start">
          {trip.user?.fullName && (
            <>
              <CustomText
                textVariant={variantSecondary}
                textSize={textSizeLabel}
              >
                Traveler
              </CustomText>

              <CustomText textVariant={variantPrimary} textSize={textSize}>
                {trip.user.fullName}
              </CustomText>
            </>
          )}

          <CustomText textVariant={variantSecondary} textSize={textSizeLabel}>
            Departs
          </CustomText>

          <CustomText textVariant={variantPrimary} textSize={textSize}>
            {format(new Date(trip.departDate), "MMM d, yyyy")}
          </CustomText>

          <CustomText textVariant={variantSecondary} textSize={textSizeLabel}>
            Accepts
          </CustomText>

          <CustomText textVariant={variantPrimary} textSize={textSize}>
            {items.join(", ")}
          </CustomText>
          <CustomText textVariant={variantSecondary} textSize={textSizeLabel}>
            Space
          </CustomText>
          <CustomText textVariant={variantPrimary} textSize={textSize}>
            {trip.weightKg}kg
          </CustomText>
        </div>
      </div>
    </section>
  );
}
