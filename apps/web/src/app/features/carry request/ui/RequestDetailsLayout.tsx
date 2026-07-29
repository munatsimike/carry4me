import { META_ICONS } from "@/app/icons/MetaIcon";
import CustomModal from "@/app/components/CustomModal";
import RouteRow from "@/app/components/RouteRow";
import CardLabel from "@/app/components/card/CardLabel";
import { toCountryName, toflag } from "@/app/Mapper";
import { cn } from "@/app/lib/cn";
import {
  formatSenderPartyDisplay,
  formatTravelerPartyDisplay,
} from "../application/formatCarryRequestPartyDisplay";
import type { Role } from "../domain/CreateCarryRequest";
import { ROLES } from "../domain/CreateCarryRequest";
import { formatDestinationCityForDisplay } from "@/app/shared/locations/fixedDestination";
import CustomText from "@/components/ui/CustomText";
import SvgIcon, { type IconColor } from "@/components/ui/SvgIcon";
import type { SvgIconComponent } from "@/types/Ui";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, Clock, MoveRight } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CarryRequestCostSummary,
  RequestCostSummarySection,
  SenderPaymentDetailsSummary,
  ServiceFeeRow,
  TravelerPaymentDetailsSummary,
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
  const originName = toCountryName(route.originCountry) ?? route.originCountry;
  const destinationName =
    toCountryName(route.destinationCountry) ?? route.destinationCountry;

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
        {originName}
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
        {destinationName}
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
          <span>{originCityLabel || originName}</span>
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
  showRoute = true,
}: {
  route: RequestRoute;
  travelerName: string;
  departsLabel: string;
  highlightOrigin?: boolean;
  showRoute?: boolean;
}) {
  return (
    <section className="min-w-0 space-y-3 overflow-visible">
      <CardLabel variant="trip" label="Trip details" />
      <div className="space-y-2 overflow-visible">
        {showRoute ? (
          <RequestRouteDisplay route={route} highlightOrigin={highlightOrigin} />
        ) : null}
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
  showRoute = true,
}: {
  route: RequestRoute;
  senderName: string;
  itemsLabel: string;
  highlightOrigin?: boolean;
  showRoute?: boolean;
}) {
  return (
    <section className="min-w-0 space-y-3 overflow-visible">
      <CardLabel variant="parcel" label="Parcel details" />
      <div className="space-y-2 overflow-visible">
        {showRoute ? (
          <RequestRouteDisplay route={route} highlightOrigin={highlightOrigin} />
        ) : null}
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

export function PaymentDetailsButton({
  viewerRole,
  weightKg,
  pricePerKg,
  priceCountry,
  className,
}: {
  viewerRole: Role;
  weightKg: number;
  pricePerKg: number;
  priceCountry: string;
  className?: string;
}) {
  const [costModalOpen, setCostModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setCostModalOpen(true)}
        className={cn(
          "w-fit px-2.5 text-left text-sm font-medium text-primary-600 underline-offset-2 transition-colors",
          "hover:text-primary-700 hover:underline",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded",
          className,
        )}
      >
        Cost summary
      </button>

      <AnimatePresence>
        {costModalOpen ? (
          <CustomModal
            width="lg"
            scrollable={false}
            onClose={() => setCostModalOpen(false)}
          >
            <CustomText
              as="h2"
              textSize="md"
              textVariant="primary"
              className="mb-4 pr-8 font-semibold text-ink-primary"
            >
              Cost summary
            </CustomText>
            {viewerRole === ROLES.TRAVELER ? (
              <TravelerPaymentDetailsSummary
                weightKg={weightKg}
                pricePerKg={pricePerKg}
                priceCountry={priceCountry}
              />
            ) : (
              <SenderPaymentDetailsSummary
                weightKg={weightKg}
                pricePerKg={pricePerKg}
                priceCountry={priceCountry}
              />
            )}
          </CustomModal>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Compact details for completed, cancelled, expired, and declined requests. */
export function ArchivedCarryRequestDetails({
  trip,
  parcel,
  viewerRole,
  viewerUserId,
  senderUserId,
  travelerUserId,
  statusDateLabel,
  statusDateValue,
  statusDateHoverValue,
}: {
  trip: { traveler_name: string };
  parcel: {
    sender_name: string;
    origin: { country: string; city?: string };
    destination: { country: string; city?: string };
    goods_category: { name: string }[];
    weight_kg: number;
    price_per_kg: number;
  };
  viewerRole: Role;
  viewerUserId?: string | null;
  senderUserId?: string | null;
  travelerUserId?: string | null;
  statusDateLabel: string;
  statusDateValue: string;
  statusDateHoverValue?: string;
}) {
  const categoryNames = parcel.goods_category
    .map((item) => item.name.trim())
    .filter(Boolean);
  const route = {
    originCountry: parcel.origin.country,
    destinationCountry: parcel.destination.country,
    originCity: parcel.origin.city,
    destinationCity: parcel.destination.city,
  };

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
          value={formatSenderPartyDisplay(viewerRole, parcel.sender_name, {
            viewerUserId,
            partyUserId: senderUserId,
          })}
          icon={META_ICONS.userIconOutlined}
          className="sm:pr-2.5"
        />
        <ArchivedDetailField
          label="Traveler"
          value={formatTravelerPartyDisplay(viewerRole, trip.traveler_name, {
            viewerUserId,
            partyUserId: travelerUserId,
          })}
          icon={META_ICONS.travelerOutline}
          iconColor="tonal"
          className="sm:pl-2.5"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2">
        <GoodsCategoriesField categories={categoryNames} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <ArchivedDetailField
            label={statusDateLabel}
            value={statusDateValue}
            hoverValue={statusDateHoverValue}
            icon={META_ICONS.calender}
            bordered
          />
          <PaymentDetailsButton
            viewerRole={viewerRole}
            weightKg={parcel.weight_kg}
            pricePerKg={parcel.price_per_kg}
            priceCountry={parcel.origin.country}
          />
        </div>
      </div>
    </div>
  );
}

const CARRY_REQUEST_CARD_SELECTOR = ".group\\/card";

function GoodsCategoriesField({ categories }: { categories: string[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const requestCard = rootRef.current?.closest(CARRY_REQUEST_CARD_SELECTOR);
    if (!requestCard) return;

    const closeIfOutsideRequest = (target: EventTarget | null) => {
      if (!(target instanceof Node) || !requestCard.contains(target)) {
        setOpen(false);
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      closeIfOutsideRequest(event.target);
    };
    const onPointerDown = (event: PointerEvent) => {
      closeIfOutsideRequest(event.target);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (categories.length <= 1) {
    return (
      <ArchivedDetailField
        label="Goods"
        value={categories[0] || "—"}
        icon={META_ICONS.parcelBoxOutlined}
        bordered
        className="h-fit"
      />
    );
  }

  const extraCount = categories.length - 1;

  return (
    <div
      ref={rootRef}
      className="relative min-w-0"
      onMouseLeave={() => {
        if (open) setOpen(false);
      }}
    >
      <div className="flex min-w-0 items-center gap-1.5 rounded-xl border border-slate-100/90 bg-white px-2.5 py-2 transition-colors duration-200 group-hover/card:border-primary-100/70">
        <SvgIcon size="sm" Icon={META_ICONS.parcelBoxOutlined} color="neutral" />
        <CustomText textVariant="label" textSize="xs" as="span" className="shrink-0">
          Goods
        </CustomText>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={
            open
              ? "Hide all goods categories"
              : `Show all goods categories, ${extraCount} more`
          }
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "inline-flex min-w-0 flex-1 items-center gap-1.5 rounded text-left",
            "text-ink-primary hover:text-ink-primary",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1",
          )}
        >
          <CustomText
            textVariant="primary"
            textSize="sm"
            as="span"
            className="min-w-0 truncate font-medium leading-snug"
          >
            {categories[0]}
          </CustomText>
          <CustomText
            textVariant="secondary"
            textSize="xs"
            as="span"
            className="ml-1.5 shrink-0 whitespace-nowrap"
          >
            +{extraCount} more
          </CustomText>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-neutral-500"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      </div>

      {open ? (
        <div
          role="listbox"
          className="absolute bottom-full left-0 right-0 z-50 mb-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-lg"
        >
          <ul className="grid list-disc grid-cols-2 gap-x-3 gap-y-1 pl-4">
            {categories.map((name) => (
              <li key={name} role="option">
                <CustomText
                  textVariant="primary"
                  textSize="sm"
                  as="span"
                  className="font-medium leading-snug"
                >
                  {name}
                </CustomText>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ArchivedDetailField({
  label,
  value,
  hoverValue,
  icon,
  iconColor = "neutral",
  className,
  bordered = false,
}: {
  label: string;
  value: string;
  hoverValue?: string;
  icon?: SvgIconComponent;
  iconColor?: IconColor;
  className?: string;
  bordered?: boolean;
}) {
  const showHover = !!hoverValue && hoverValue !== value;

  return (
    <div
      className={cn(
        "group/date relative flex min-w-0 items-center gap-1.5",
        bordered && "rounded-xl border border-slate-100/90 bg-white px-2.5 py-2 transition-colors duration-200 group-hover/card:border-primary-100/70",
        className,
      )}
    >
      {icon ? <SvgIcon size="sm" Icon={icon} color={iconColor} /> : null}
      <CustomText textVariant="label" textSize="xs" as="span" className="shrink-0">
        {label}
      </CustomText>
      <CustomText
        textVariant="primary"
        textSize="sm"
        as="span"
        className="min-w-0 font-medium leading-snug sm:truncate"
      >
        {value}
      </CustomText>
      {showHover ? (
        <div
          className="
            pointer-events-none absolute left-1/2 bottom-full z-50
            mb-1 -translate-x-1/2
            inline-flex items-center gap-1.5
            whitespace-nowrap rounded-full
            border border-neutral-200 bg-white px-3 py-1.5
            text-xs font-medium text-neutral-700 shadow-lg
            opacity-0 translate-y-1 scale-95
            transition-all duration-300 ease-out
            group-hover/date:translate-y-0
            group-hover/date:scale-100
            group-hover/date:opacity-100
          "
        >
          <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-500" strokeWidth={1.75} />
          <span className="text-neutral-500">Time</span>
          <span className="font-medium text-ink-primary">{hoverValue}</span>
        </div>
      ) : null}
    </div>
  );
}
