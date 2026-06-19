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
import { CategoryChipList } from "@/app/components/CategoryChip";
import { formatTripAcceptedCategoryLabels } from "@/app/features/goods/domain/goodsCategoryConstants";
import LineDivider from "@/app/components/LineDivider";
import {
  FormReviewSection,
  FormReviewPrimaryValue,
  FormReviewValue,
} from "@/app/components/forms/FormReviewSection";
import type { Step } from "@/app/components/forms/formStepper";
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
  onEditStep?: (step: Step) => void;
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
  onEditStep,
}: TripFormReviewProps) {
  const categoryNames = formatTripAcceptedCategoryLabels(
    goodsCategory.filter((category) => selectedIds.includes(category.id)),
  );
  const maxEarnings = pricePerKg * weight;
  const originLabel = formatOriginCity(originCity, originCustomCity);
  const originFlag = toflag(originCountry);
  const destination =
    destinationCountry?.trim() || FIXED_DESTINATION_COUNTRY;
  const priceLabel = `${getCurrencySymbolByCountry(originCountry)}${Number.isFinite(pricePerKg) ? pricePerKg : 0}`;
  const editStep = (step: Step) => onEditStep?.(step);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <FormReviewSection label="Origin">
          <LocationValue
            flag={originFlag}
            primary={originLabel}
            secondary={originCountry || undefined}
          />
        </FormReviewSection>

        <FormReviewSection
          label="Destination"
          onEdit={onEditStep ? () => editStep(1) : undefined}
        >
          <LocationValue flag={META_ICONS.zimFlag} primary={destination} />
        </FormReviewSection>
      </div>

      <LineDivider heightClass="my-0" />

      <FormReviewSection
        label="Departure"
        onEdit={onEditStep ? () => editStep(1) : undefined}
      >
        <FormReviewPrimaryValue>{formatDepartureDate(departureDate)}</FormReviewPrimaryValue>
      </FormReviewSection>

      <LineDivider heightClass="my-0" />

      <FormReviewSection
        label="Items you carry"
        onEdit={onEditStep ? () => editStep(2) : undefined}
      >
        {categoryNames.length > 0 ? (
          <CategoryChipList items={categoryNames} />
        ) : (
          <FormReviewValue>—</FormReviewValue>
        )}
      </FormReviewSection>

      <LineDivider heightClass="my-0" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <FormReviewSection label="Available space">
          <FormReviewPrimaryValue>{weight} Kg</FormReviewPrimaryValue>
        </FormReviewSection>
        <FormReviewSection
          label="Price per kg"
          onEdit={onEditStep ? () => editStep(2) : undefined}
        >
          <FormReviewPrimaryValue textSize="md">{priceLabel}</FormReviewPrimaryValue>
        </FormReviewSection>
      </div>

      <LineDivider heightClass="my-0" />

      <div className="rounded-lg border border-green-100 bg-green-50/80 px-4 py-3">
        <FormReviewSection label="Potential earnings" className="mb-0">
          <CustomText
            as="p"
            textSize="sm"
            textVariant="success"
            className="font-semibold text-green-700"
          >
            Up to {formatCurrencyByCountry(originCountry, maxEarnings)}
          </CustomText>
        </FormReviewSection>
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
      <FormReviewPrimaryValue>
        {primary}
        {secondary ? `, ${secondary}` : ""}
      </FormReviewPrimaryValue>
    </span>
  );
}
