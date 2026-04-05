import { type Role } from "../domain/CreateCarryRequest";
import CustomText from "@/components/ui/CustomText";
import CardLabel from "@/app/components/card/CardLabel";
import type { ParcelSnapshot } from "../domain/ParcelSnapShot";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { format } from "date-fns";
import type { TripSnapshot } from "../domain/TripSnapshot";
import { MoveRight } from "lucide-react";
import { dateFormat, progress } from "@/types/Ui";
import CustomModal from "@/app/components/CustomModal";
import LineDivider from "@/app/components/LineDivider";
export type MobileSection = "details" | "timeline";

export function MobileFirstHeader({
  trip,
  parcel,
  totalPrice,
  toggleSection,
}: {
  trip: TripSnapshot;
  parcel: ParcelSnapshot;
  totalPrice: number;
  toggleSection: (v: MobileSection) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <SvgIcon size="xs" Icon={META_ICONS.ukFlag} />
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {trip.origin.country}
          </CustomText>
          <MoveRight className="h-4 w-4 text-neutral-800" strokeWidth={1.5} />
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {trip.destination.country}
          </CustomText>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <CustomText textSize="xs" textVariant="secondary">
              Traveler
            </CustomText>
            <CustomText
              textSize="sm"
              textVariant="primary"
              className="truncate font-medium"
            >
              {trip.traveler_name}
            </CustomText>
          </div>

          <div className="text-right">
            <CustomText textSize="xs" textVariant="secondary">
              Total
            </CustomText>
            <CustomText
              textSize="sm"
              textVariant="primary"
              className="font-medium"
            >
              ${totalPrice.toFixed(2)}
            </CustomText>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleSection("details")}
            className="text-sm text-blue-600"
          >
            {"Details"}
          </button>

          <button
            onClick={() => toggleSection("timeline")}
            className="text-sm text-blue-600"
          >
            {"Timeline"}
          </button>
        </div>
      </div>
    </>
  );
}

export function MobileDetailsSection({
  trip,
  parcel,
  viewerRole,
  setOpenSection,
}: {
  trip: TripSnapshot;
  parcel: ParcelSnapshot;
  viewerRole: Role;
  setOpenSection: () => void;
}) {
  const totalPrice = parcel.price_per_kg * parcel.weight_kg;

  return (
    <CustomModal onClose={setOpenSection}>
      <div className="flex flex-col gap-4">
        <TripDetailsMobile trip={trip} viewerRole={viewerRole} />
        <LineDivider heightClass="" />
        <ParcelDetailsMobile parcel={parcel} viewerRole={viewerRole} />
        <LineDivider heightClass="" />
        <CostSummaryMobile parcel={parcel} totalPrice={totalPrice} />
      </div>
    </CustomModal>
  );
}

export function TripDetailsMobile({
  trip,
}: {
  trip: TripSnapshot;
  viewerRole: Role;
}) {
  return (
    <section className="space-y-2">
      <CardLabel variant="trip" label="Trip details" />

      <div className="grid grid-cols-[88px_1fr] gap-y-2">
        <CustomText textVariant="secondary" textSize="sm">
          Route
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="sm"
          className="flex gap-2 items-center"
        >
          {trip.origin.country}{" "}
          <MoveRight className="text-neutral-800 h-4 w-4" strokeWidth={1.5} />{" "}
          {trip.destination.country}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Traveler
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {trip.traveler_name}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Departs
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {format(new Date(trip.departure_date), dateFormat)}
        </CustomText>
      </div>
    </section>
  );
}

export function ParcelDetailsMobile({
  parcel,
}: {
  parcel: ParcelSnapshot;
  viewerRole: Role;
}) {
  const categories = parcel.goods_category.map((item) => item.name).join(", ");

  return (
    <section className="space-y-3">
      <CardLabel variant="parcel" label="Parcel details" />

      <div className="grid grid-cols-[88px_1fr] gap-y-2">
        <CustomText textVariant="secondary" textSize="sm">
          Route
        </CustomText>
        <CustomText
          as="span"
          className="flex gap-2 items-center"
          textVariant="primary"
          textSize="sm"
        >
          {parcel.origin.country}{" "}
          <MoveRight className="text-neutral-800 h-4 w-4" strokeWidth={1.5} />{" "}
          {parcel.destination.country}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Sender
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {parcel.sender_name}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Items
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {categories}
        </CustomText>
      </div>
    </section>
  );
}

export function CostSummaryMobile({
  parcel,
  totalPrice,
}: {
  parcel: ParcelSnapshot;
  totalPrice: number;
}) {
  return (
    <section className="space-y-3">
      <span className="inline-flex rounded-full border bg-neutral-100 px-3 py-1">
        <CustomText textVariant="primary" as="span" textSize="xs">
          Cost summary
        </CustomText>
      </span>

      <div className="grid grid-cols-[1fr_auto] gap-y-2">
        <CustomText textVariant="secondary" textSize="sm">
          Parcel weight
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {parcel.weight_kg}kg
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Price per kg
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          ${parcel.price_per_kg.toFixed(2)}
        </CustomText>

        <CustomText textVariant="primary" textSize="sm" className="font-medium">
          Total
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="font-medium">
          ${totalPrice.toFixed(2)}
        </CustomText>
      </div>
    </section>
  );
}

export function MobileProgressSection({
  currentStep,
  isInitiator,
  setOpenSection,
}: {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  isInitiator: boolean;
  setOpenSection: () => void;
}) {
  const allSteps = isInitiator ? [1, 2, 3, 4, 5, 6] : [2, 3, 4, 5, 6];

  return (
    <CustomModal onClose={setOpenSection}>
      <div className="flex flex-col gap-3">
        {allSteps.map((step) => {
          const completed =
            step === 1
              ? isInitiator && currentStep >= 1
              : step - 1 < currentStep && currentStep !== 1;

          return (
            <div key={step} className="flex items-center gap-3">
              <SvgIcon
                color={completed ? "success" : "grey"}
                size="md"
                Icon={META_ICONS.checkedIcon}
              />
              <CustomText
                textSize="sm"
                textVariant={completed ? "primary" : "secondary"}
              >
                {progress[step as 1 | 2 | 3 | 4 | 5 | 6]}
              </CustomText>
            </div>
          );
        })}
      </div>
    </CustomModal>
  );
}
