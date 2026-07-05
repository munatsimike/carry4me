import { META_ICONS } from "@/app/icons/MetaIcon";
import CustomModal from "@/app/components/CustomModal";
import RouteRow from "@/app/components/RouteRow";
import CardLabel from "@/app/components/card/CardLabel";
import { toflag } from "@/app/Mapper";
import { cn } from "@/app/lib/cn";
import { formatPersonDisplayName } from "@/app/shared/application/formatPersonDisplayName";
import { formatDestinationCityForDisplay } from "@/app/shared/locations/fixedDestination";
import CustomText from "@/components/ui/CustomText";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import type { SvgIconComponent } from "@/types/Ui";
import { format } from "date-fns";
import { AnimatePresence } from "framer-motion";
import { MoveRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import { dateFormat } from "@/types/Ui";
import {
  CarryRequestCostSummary,
  RequestCostSummarySection,
  ServiceFeeRow,
} from "./CarryRequestCostSummary";

export { CarryRequestCostSummary, RequestCostSummarySection, ServiceFeeRow };
export type RequestRoute = {
  originCountry: string;
  destinationCountry: string;
  originCity?: string;
  destinationCity?: string;
};

type RequestRouteDisplayProps = {
  route: RequestRoute;
  highlightOrigin?: boolean;
  compact?: boolean;
};

export function RequestRouteDisplay({
  route,
  highlightOrigin = false,
  compact = false,
}: RequestRouteDisplayProps) {
  const originCityLabel = route.originCity?.trim();
  const destinationCityLabel = formatDestinationCityForDisplay(
    route.destinationCity,
    route.destinationCountry,
  );
  const hasCities = !!originCityLabel || !!destinationCityLabel;

  return (
    <span
      className={cn(
        "group/route relative inline-flex min-w-0 flex-wrap items-center gap-1 overflow-visible",
        highlightOrigin && "rounded-md",
      )}
    >
      <CountryFlag country={route.originCountry} />
      <CustomText
        textVariant="primary"
        textSize={compact ? "sm" : "md"}
        className={cn(
          "font-medium",
          highlightOrigin &&
            "rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-950",
        )}
      >
        {route.originCountry}
      </CustomText>
      <MoveRight
        className={cn(
          "shrink-0 text-neutral-800",
          compact ? "h-3.5 w-3.5" : "h-5 w-4",
        )}
        strokeWidth={1.5}
      />
      <CountryFlag country={route.destinationCountry} />
      <CustomText
        textVariant="primary"
        textSize={compact ? "sm" : "md"}
        className="font-medium"
      >
        {route.destinationCountry}
      </CustomText>

      {hasCities ? (
        <div
          className="
            pointer-events-none absolute left-1/2 bottom-full z-50
            mb-1 -translate-x-1/2
            whitespace-nowrap rounded-full
            border border-yellow-100 bg-yellow-50 px-3 py-1.5
            text-xs font-medium text-neutral-700 shadow-lg
            opacity-0 translate-y-1 scale-95
            transition-all duration-300 ease-out
            group-hover/route:translate-y-0
            group-hover/route:scale-100
            group-hover/route:opacity-100
          "
        >
          <span>{originCityLabel || route.originCountry}</span>
          <span className="mx-1 text-neutral-400">→</span>
          <span>{destinationCityLabel}</span>
        </div>
      ) : null}
    </span>
  );
}

function CountryFlag({ country }: { country: string }) {
  const flag = toflag(country);
  if (!flag) return null;
  return <SvgIcon size="xs" Icon={flag as SvgIconComponent} />;
}

export function RequestDetailRows({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-y-1 sm:grid-cols-[80px_minmax(0,1fr)]">
      {children}
    </div>
  );
}

export function RequestDetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <>
      <CustomText textVariant="secondary" textSize="sm">
        {label}
      </CustomText>
      <CustomText textVariant="primary" textSize="sm">
        {value}
      </CustomText>
    </>
  );
}

export function RequestTripDetailsSection({
  route,
  travelerName,
  departsLabel,
  highlightOrigin,
}: {
  route: RequestRoute;
  travelerName: string;
  departsLabel: string;
  highlightOrigin?: boolean;
}) {
  return (
    <section className="min-w-0 space-y-3 overflow-visible">
      <CardLabel variant="trip" label="Trip details" />
      <div className="space-y-2 overflow-visible">
        <RequestRouteDisplay route={route} highlightOrigin={highlightOrigin} />
        <RequestDetailRows>
          <RequestDetailRow label="Traveler" value={travelerName} />
          <RequestDetailRow label="Departs" value={departsLabel} />
        </RequestDetailRows>
      </div>
    </section>
  );
}

export function RequestParcelDetailsSection({
  route,
  senderName,
  itemsLabel,
  highlightOrigin,
}: {
  route: RequestRoute;
  senderName: string;
  itemsLabel: string;
  highlightOrigin?: boolean;
}) {
  return (
    <section className="min-w-0 space-y-3 overflow-visible">
      <CardLabel variant="parcel" label="Parcel details" />
      <div className="space-y-2 overflow-visible">
        <RequestRouteDisplay route={route} highlightOrigin={highlightOrigin} />
        <RequestDetailRows>
          <RequestDetailRow label="Sender" value={senderName} />
          <RequestDetailRow label="Items" value={itemsLabel} />
        </RequestDetailRows>
      </div>
    </section>
  );
}

/** Horizontal on md+, stacked on mobile — matches carry request card details. */
export function RequestDetailsGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[0.8fr_minmax(0,1fr)_0.5fr] lg:gap-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Compact details for completed, cancelled, expired, and declined requests. */
export function ArchivedCarryRequestDetails({
  trip,
  parcel,
}: {
  trip: { traveler_name: string; departure_date: string };
  parcel: {
    sender_name: string;
    origin: { country: string; city?: string };
    destination: { country: string; city?: string };
    goods_category: { name: string }[];
    weight_kg: number;
    price_per_kg: number;
  };
}) {
  const [costModalOpen, setCostModalOpen] = useState(false);
  const categories = parcel.goods_category.map((item) => item.name).join(", ");
  const route = {
    originCountry: parcel.origin.country,
    destinationCountry: parcel.destination.country,
    originCity: parcel.origin.city,
    destinationCity: parcel.destination.city,
  };
  const deliveryDateLabel = formatArchivedTripDate(trip.departure_date);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-100/90 bg-secondary-50/60 p-2 sm:p-2.5 transition-colors duration-200 group-hover/card:border-primary-100/80 group-hover/card:bg-secondary-50">
      <RouteRow
        origin={route.originCountry}
        destination={route.destinationCountry}
        originCity={route.originCity}
        destinationCity={route.destinationCity}
      />

      <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100/90 bg-white px-2.5 py-2 transition-colors duration-200 group-hover/card:border-primary-100/70 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-slate-100">
        <ArchivedDetailField
          label="Sender"
          value={formatPersonDisplayName(parcel.sender_name)}
          icon={META_ICONS.userIconOutlined}
          className="sm:pr-2.5"
        />
        <ArchivedDetailField
          label="Traveler"
          value={formatPersonDisplayName(trip.traveler_name)}
          icon={META_ICONS.travelerOutline}
          iconColor="tonal"
          className="sm:pl-2.5"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2">
        <ArchivedDetailField
          label="Goods"
          value={categories || "—"}
          icon={META_ICONS.parcelBoxOutlined}
          bordered
          className="h-fit"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <ArchivedDetailField
            label="Delivery date"
            value={deliveryDateLabel}
            icon={META_ICONS.calender}
            bordered
          />
          <button
            type="button"
            onClick={() => setCostModalOpen(true)}
            className={cn(
              "w-fit px-2.5 text-left text-sm font-medium text-primary-600 underline-offset-2 transition-colors",
              "hover:text-primary-700 hover:underline",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded",
            )}
          >
            Show cost
          </button>
        </div>
      </div>

      <AnimatePresence>
        {costModalOpen ? (
          <CustomModal
            width="sm"
            scrollable={false}
            onClose={() => setCostModalOpen(false)}
          >
            <CustomText
              as="h2"
              textSize="md"
              textVariant="primary"
              className="mb-4 pr-8 font-semibold text-ink-primary"
            >
              Cost breakdown
            </CustomText>
            <CarryRequestCostSummary
              weightKg={parcel.weight_kg}
              pricePerKg={parcel.price_per_kg}
              priceCountry={parcel.origin.country}
              showServiceFee
              totalLabel="Total"
              variant="receipt"
            />
          </CustomModal>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatArchivedTripDate(iso: string | undefined): string {
  if (!iso?.trim()) return "—";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return format(date, dateFormat);
}

function ArchivedDetailField({
  label,
  value,
  icon,
  iconColor = "neutral",
  className,
  bordered = false,
}: {
  label: string;
  value: string;
  icon?: SvgIconComponent;
  iconColor?: IconColor;
  className?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        bordered && "rounded-xl border border-slate-100/90 bg-white px-2.5 py-2 transition-colors duration-200 group-hover/card:border-primary-100/70",
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        {icon ? <SvgIcon size="sm" Icon={icon} color={iconColor} /> : null}
        <CustomText textVariant="label" textSize="xs" as="span">
          {label}
        </CustomText>
      </div>
      <CustomText
        textVariant="primary"
        textSize="sm"
        as="p"
        className="font-medium leading-snug sm:truncate"
      >
        {value}
      </CustomText>
    </div>
  );
}
