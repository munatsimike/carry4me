import CardLabel from "@/app/components/card/CardLabel";
import { toflag } from "@/app/Mapper";
import { formatCurrencyByCountry } from "@/app/lib/currency";
import { cn } from "@/app/lib/cn";
import { formatDestinationCityForDisplay } from "@/app/shared/locations/fixedDestination";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { SvgIconComponent } from "@/types/Ui";
import { MoveRight } from "lucide-react";
import type { ReactNode } from "react";

export type RequestRoute = {
  originCountry: string;
  destinationCountry: string;
  originCity?: string;
  destinationCity?: string;
};

type RequestRouteDisplayProps = {
  route: RequestRoute;
  highlightOrigin?: boolean;
};

export function RequestRouteDisplay({
  route,
  highlightOrigin = false,
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
        textSize="md"
        className={cn(
          "font-medium",
          highlightOrigin &&
            "rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-950",
        )}
      >
        {route.originCountry}
      </CustomText>
      <MoveRight
        className="h-5 w-4 shrink-0 text-neutral-800 transition-transform duration-300 ease-out group-hover/route:translate-x-0.5"
        strokeWidth={1.5}
      />
      <CountryFlag country={route.destinationCountry} />
      <CustomText textVariant="primary" textSize="md" className="font-medium">
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

const serviceFeeTooltipClass =
  "pointer-events-none absolute left-1/2 bottom-full z-50 mb-1 -translate-x-1/2 whitespace-nowrap rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-lg opacity-0 translate-y-1 scale-95 transition-all duration-300 ease-out group-hover/service-fee:translate-y-0 group-hover/service-fee:scale-100 group-hover/service-fee:opacity-100";

export function ServiceFeeRow({
  priceCountry,
  serviceFee,
}: {
  priceCountry: string;
  serviceFee: number;
}) {
  return (
    <div className="group/service-fee relative col-span-2 grid grid-cols-[minmax(0,1fr)_auto] overflow-visible">
      <CustomText textVariant="secondary" textSize="sm">
        Service fee
      </CustomText>
      <CustomText textVariant="primary" textSize="sm" className="text-right tabular-nums">
        {formatCurrencyByCountry(priceCountry, serviceFee)}
      </CustomText>
      <span className={serviceFeeTooltipClass}>
        Service fee is 20% of total price.
      </span>
    </div>
  );
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

export function RequestCostSummarySection({
  weightKg,
  pricePerKg,
  totalPrice,
  serviceFee,
  totalWithFee,
  priceCountry,
}: {
  weightKg: number;
  pricePerKg: number;
  totalPrice: number;
  serviceFee?: number;
  totalWithFee?: number;
  priceCountry: string;
}) {
  return (
    <section className="min-w-0 space-y-3">
      <span className="inline-flex h-7 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 px-4 text-sm font-light text-ink-primary">
        Cost summary
      </span>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-y-1 overflow-visible">
        <CustomText textVariant="secondary" textSize="sm">
          Parcel weight
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right">
          {weightKg}kg
        </CustomText>

        <CustomText textVariant="secondary" textSize="sm">
          Price per kg
        </CustomText>
        <CustomText textVariant="primary" textSize="sm" className="text-right tabular-nums">
          {formatCurrencyByCountry(priceCountry, pricePerKg)}
        </CustomText>

        {typeof serviceFee === "number" ? (
          <ServiceFeeRow priceCountry={priceCountry} serviceFee={serviceFee} />
        ) : null}

        <CustomText textVariant="primary" textSize="md" className="font-medium">
          {typeof totalWithFee === "number" ? "Total to pay" : "Total"}
        </CustomText>
        <CustomText
          textVariant="primary"
          textSize="md"
          className="text-right font-semibold tabular-nums"
        >
          {formatCurrencyByCountry(
            priceCountry,
            typeof totalWithFee === "number" ? totalWithFee : totalPrice,
          )}
        </CustomText>
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
