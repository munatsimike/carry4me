import type { ReactNode } from "react";
import type { SvgIconComponent } from "@/types/Ui";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import { toflag } from "@/app/Mapper";
import {
  formatCurrencyByCountry,
  getCurrencySymbolByCountry,
} from "@/app/lib/currency";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { isOtherCitySelection } from "@/app/shared/locations/cityOptions";
import { FIXED_DESTINATION_COUNTRY } from "@/app/shared/locations/fixedDestination";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";
import { format, isValid, parseISO } from "date-fns";

type TripFormReviewProps = {
  originCountry: string;
  originCity: string;
  originCustomCity: string;
  destinationCountry: string;
  departureDate: string;
  selectedIds: string[];
  goodsCategory: GoodsCategory[];
  weight: number;
  pricePerKg: number;
};

function formatOriginCity(city: string, customCity: string): string {
  if (!city) return "—";
  if (isOtherCitySelection(city)) {
    return customCity.trim() || "Other city";
  }
  return city;
}

function formatDepartureDate(value: string): string {
  if (!value) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return "—";
  return format(parsed, "d MMM yyyy");
}

export default function TripFormReview({
  originCountry,
  originCity,
  originCustomCity,
  destinationCountry,
  departureDate,
  selectedIds = [],
  goodsCategory,
  weight,
  pricePerKg,
}: TripFormReviewProps) {
  const categoryNames = goodsCategory
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);
  const maxEarnings = pricePerKg * weight;
  const originLabel = formatOriginCity(originCity, originCustomCity);
  const originFlag = toflag(originCountry);
  const destination =
    destinationCountry?.trim() || FIXED_DESTINATION_COUNTRY;
  const priceLabel = `${getCurrencySymbolByCountry(originCountry)}${Number.isFinite(pricePerKg) ? pricePerKg : 0}`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <ReviewSection label="Origin">
          <LocationValue
            flag={originFlag}
            primary={originLabel}
            secondary={originCountry || undefined}
          />
        </ReviewSection>

        <ReviewSection label="Destination">
          <LocationValue flag={META_ICONS.zimFlag} primary={destination} />
        </ReviewSection>
      </div>

      <ReviewSection label="Departure">
        <ReviewValue>{formatDepartureDate(departureDate)}</ReviewValue>
      </ReviewSection>

      <ReviewSection label="Items you carry">
        {categoryNames.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <li
                key={name}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-primary border border-neutral-200"
              >
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <ReviewValue>—</ReviewValue>
        )}
      </ReviewSection>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ReviewSection label="Available space">
          <ReviewValue>{weight} Kg</ReviewValue>
        </ReviewSection>
        <ReviewSection label="Price per kg">
          <ReviewValue>{priceLabel}</ReviewValue>
        </ReviewSection>
      </div>

      <div className="rounded-lg border border-green-100 bg-green-50/80 px-4 py-3">
        <CustomText
          as="p"
          textSize="xs"
          textVariant="label"
          className="mb-1 whitespace-nowrap"
        >
          Potential earnings
        </CustomText>
        <CustomText
          as="p"
          textSize="sm"
          textVariant="success"
          className="font-semibold text-green-700"
        >
          Up to {formatCurrencyByCountry(originCountry, maxEarnings)}
        </CustomText>
      </div>
    </div>
  );
}

function LocationValue({
  flag,
  primary,
  secondary,
}: {
  flag: SvgIconComponent | null;
  primary: string;
  secondary?: string;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {flag ? <SvgIcon size="xs" Icon={flag} /> : null}
      <ReviewValue>
        {primary}
        {secondary ? `, ${secondary}` : ""}
      </ReviewValue>
    </span>
  );
}

function ReviewSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <CustomText as="p" textSize="xs" textVariant="label" className="whitespace-nowrap">
        {label}
      </CustomText>
      {children}
    </div>
  );
}

function ReviewValue({ children }: { children: ReactNode }) {
  return (
    <CustomText as="p" textSize="sm" className="font-medium text-ink-primary">
      {children}
    </CustomText>
  );
}
