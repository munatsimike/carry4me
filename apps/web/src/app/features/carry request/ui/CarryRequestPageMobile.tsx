import { type Role } from "../domain/CreateCarryRequest";
import type { CarryRequestProgressStage } from "./progressStepIcon";
import CustomText from "@/components/ui/CustomText";
import CardLabel from "@/app/components/card/CardLabel";
import type { ParcelSnapshot } from "../domain/ParcelSnapShot";
import SvgIcon from "@/components/ui/SvgIcon";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { format } from "date-fns";
import type { TripSnapshot } from "../domain/TripSnapshot";
import { MoveRight } from "lucide-react";
import { dateFormat } from "@/types/Ui";
import CustomModal from "@/app/components/CustomModal";
import LineDivider from "@/app/components/LineDivider";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { toCountryName } from "@/app/Mapper";
import {
  formatSenderPartyDisplay,
  formatTravelerPartyDisplay,
} from "../application/formatCarryRequestPartyDisplay";
import { PaymentDetailsButton } from "./RequestDetailsLayout";
export type MobileSection = "details" | "timeline";

function countryLabel(country: string): string {
  return toCountryName(country) ?? country;
}

export function MobileFirstHeader({
  trip,
  totalPrice,
  toggleSection,
  viewerRole,
  viewerUserId,
  travelerUserId,
}: {
  trip: TripSnapshot;
  parcel: ParcelSnapshot;
  totalPrice: number;
  toggleSection: (v: MobileSection) => void;
  viewerRole: Role;
  viewerUserId?: string | null;
  travelerUserId?: string | null;
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
            {countryLabel(trip.origin.country)}
          </CustomText>
          <MoveRight className="h-4 w-4 text-neutral-800" strokeWidth={1.5} />
          <SvgIcon size="xs" Icon={META_ICONS.zimFlag} />
          <CustomText
            textSize="sm"
            textVariant="primary"
            className="font-medium"
          >
            {countryLabel(trip.destination.country)}
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
              {formatTravelerPartyDisplay(viewerRole, trip.traveler_name, {
                viewerUserId,
                partyUserId: travelerUserId,
              })}
            </CustomText>
          </div>

          <div className="text-right">
            <CustomText textSize="xs" textVariant="secondary">
              Total to pay
            </CustomText>
            <CustomText
              textSize="sm"
              textVariant="primary"
              className="font-medium"
            >
              {formatCurrencyByCountry(trip.origin.country, totalPrice)}
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
  viewerUserId,
  senderUserId,
  travelerUserId,
  setOpenSection,
}: {
  trip: TripSnapshot;
  parcel: ParcelSnapshot;
  viewerRole: Role;
  viewerUserId?: string | null;
  senderUserId?: string | null;
  travelerUserId?: string | null;
  setOpenSection: () => void;
}) {
  return (
    <CustomModal onClose={setOpenSection}>
      <div className="flex flex-col gap-4">
        <TripDetailsMobile
          trip={trip}
          viewerRole={viewerRole}
          viewerUserId={viewerUserId}
          travelerUserId={travelerUserId}
        />
        <LineDivider heightClass="" />
        <ParcelDetailsMobile
          parcel={parcel}
          viewerRole={viewerRole}
          viewerUserId={viewerUserId}
          senderUserId={senderUserId}
        />
        <LineDivider heightClass="" />
        <PaymentDetailsButton
          viewerRole={viewerRole}
          weightKg={parcel.weight_kg}
          pricePerKg={parcel.price_per_kg}
          priceCountry={parcel.origin.country}
          capacityUnit={trip.capacity_unit}
          className="px-0"
        />
      </div>
    </CustomModal>
  );
}

export function TripDetailsMobile({
  trip,
  viewerRole,
  viewerUserId,
  travelerUserId,
}: {
  trip: TripSnapshot;
  viewerRole: Role;
  viewerUserId?: string | null;
  travelerUserId?: string | null;
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
          {countryLabel(trip.origin.country)}{" "}
          <MoveRight className="text-neutral-800 h-4 w-4" strokeWidth={1.5} />{" "}
          {countryLabel(trip.destination.country)}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Traveler
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {formatTravelerPartyDisplay(viewerRole, trip.traveler_name, {
            viewerUserId,
            partyUserId: travelerUserId,
          })}
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
  viewerRole,
  viewerUserId,
  senderUserId,
}: {
  parcel: ParcelSnapshot;
  viewerRole: Role;
  viewerUserId?: string | null;
  senderUserId?: string | null;
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
          {countryLabel(parcel.origin.country)}{" "}
          <MoveRight className="text-neutral-800 h-4 w-4" strokeWidth={1.5} />{" "}
          {countryLabel(parcel.destination.country)}
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Sender
        </CustomText>
        <CustomText textVariant="primary" textSize="sm">
          {formatSenderPartyDisplay(viewerRole, parcel.sender_name, {
            viewerUserId,
            partyUserId: senderUserId,
          })}
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

export function MobileProgressSection({
  stages,
  setOpenSection,
}: {
  stages: CarryRequestProgressStage[];
  setOpenSection: () => void;
}) {
  return (
    <CustomModal onClose={setOpenSection}>
      <div className="flex flex-col gap-3">
        {stages.map((stage) => {
          const Icon = stage.Icon;

          return (
            <div key={stage.id} className="flex items-center gap-3">
              <Icon
                className={
                  stage.completed
                    ? "h-5 w-5 shrink-0 text-success-500"
                    : "h-5 w-5 shrink-0 text-neutral-300"
                }
                strokeWidth={1.75}
              />
              <CustomText
                textSize="sm"
                textVariant={stage.completed ? "primary" : "secondary"}
              >
                {stage.label}
              </CustomText>
            </div>
          );
        })}
      </div>
    </CustomModal>
  );
}
