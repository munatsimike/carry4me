import type { ReactNode } from "react";
import type { GoodsItem } from "@/types/Ui";
import type { SvgIconComponent } from "@/types/Ui";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import GoodsManifestTable from "@/app/components/GoodsManifestTable";
import { toflag } from "@/app/Mapper";
import {
  formatCurrencyByCountry,
  getCurrencySymbolByCountry,
} from "@/app/lib/currency";
import { calculateCarryRequestPricing } from "@/app/features/carry request/domain/carryRequestPricing";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { isOtherCitySelection } from "@/app/shared/locations/cityOptions";
import { FIXED_DESTINATION_COUNTRY } from "@/app/shared/locations/fixedDestination";
import SvgIcon from "@/components/ui/SvgIcon";
import CustomText from "@/components/ui/CustomText";

type ParcelFormReviewProps = {
  originCountry: string;
  originCity: string;
  originCustomCity: string;
  destinationCountry: string;
  itemDescriptions: Partial<GoodsItem>[];
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

export default function ParcelFormReview({
  originCountry,
  originCity,
  originCustomCity,
  destinationCountry,
  itemDescriptions,
  selectedIds = [],
  goodsCategory,
  weight,
  pricePerKg,
}: ParcelFormReviewProps) {
  const categoryNames = goodsCategory
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);
  const { totalWithFee } = calculateCarryRequestPricing(pricePerKg, weight);
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

      <ReviewSection label="Categories">
        {categoryNames.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {categoryNames.map((name) => (
              <li
                key={name}
                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-ink-primary"
              >
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <ReviewValue>—</ReviewValue>
        )}
      </ReviewSection>

      <ReviewSection label="Goods list">
        <GoodsManifestTable items={itemDescriptions} />
      </ReviewSection>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ReviewSection label="Weight">
          <ReviewValue>{weight} kg</ReviewValue>
        </ReviewSection>
        <ReviewSection label="Budget per kg">
          <ReviewValue>{priceLabel}</ReviewValue>
        </ReviewSection>
      </div>

      <div className="rounded-lg border border-primary-100 bg-primary-50/80 px-4 py-3">
        <CustomText as="p" textSize="xs" textVariant="label" className="mb-1">
          Total you&apos;ll pay (incl. service fee)
        </CustomText>
        <CustomText
          as="p"
          textSize="sm"
          textVariant="primary"
          className="font-semibold text-primary-700"
        >
          {formatCurrencyByCountry(originCountry, totalWithFee)}
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
