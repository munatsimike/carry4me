import type { GoodsItem } from "@/types/Ui";
import type { SvgIconComponent } from "@/types/Ui";
import type { GoodsCategory } from "@/app/features/goods/domain/GoodsCategory";
import GoodsManifestTable from "@/app/components/GoodsManifestTable";
import { CategoryChipList } from "@/app/components/CategoryChip";
import LineDivider from "@/app/components/LineDivider";
import {
  FormReviewSection,
  FormReviewPrimaryValue,
  FormReviewValue,
} from "@/app/components/forms/FormReviewSection";
import type { Step } from "@/app/components/forms/formStepper";
import { toflag } from "@/app/Mapper";
import {
  formatCurrencyByCountry,
  getCurrencySymbolByCountry,
} from "@/app/lib/currency";
import { calculateCarryRequestPricing } from "@/app/features/carry request/domain/carryRequestPricing";
import { PARCEL_WEIGHT_MIN_HINT } from "@/app/shared/listingFormHints";
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
  onEditStep?: (step: Step) => void;
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
  onEditStep,
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
        label="Categories"
        onEdit={onEditStep ? () => editStep(1) : undefined}
      >
        {categoryNames.length > 0 ? (
          <CategoryChipList items={categoryNames} />
        ) : (
          <FormReviewValue>—</FormReviewValue>
        )}
      </FormReviewSection>

      <LineDivider heightClass="my-0" />

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <FormReviewSection
          label="Goods list"
          onEdit={onEditStep ? () => editStep(2) : undefined}
          className="gap-3"
        >
          <GoodsManifestTable variant="review" items={itemDescriptions} />
        </FormReviewSection>
      </div>

      <LineDivider heightClass="my-0" />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-nowrap sm:items-start sm:gap-x-24">
        <div className="shrink-0 sm:min-w-[6rem]">
          <FormReviewSection label="Weight" labelHint={PARCEL_WEIGHT_MIN_HINT}>
            <FormReviewPrimaryValue>{weight} kg</FormReviewPrimaryValue>
          </FormReviewSection>
        </div>
        <FormReviewSection
          label="Budget per kg"
          onEdit={onEditStep ? () => editStep(3) : undefined}
        >
          <FormReviewPrimaryValue textSize="md">{priceLabel}</FormReviewPrimaryValue>
        </FormReviewSection>
      </div>

      <LineDivider heightClass="my-0" />

      <div className="rounded-lg border border-primary-100 bg-primary-50/80 px-4 py-3">
        <FormReviewSection
          label="Total you'll pay (incl. service fee)"
          className="mb-0"
        >
          <CustomText
            as="p"
            textSize="sm"
            textVariant="primary"
            className="font-semibold text-primary-700"
          >
            {formatCurrencyByCountry(originCountry, totalWithFee)}
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
