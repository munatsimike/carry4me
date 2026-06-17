import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import {
  formatCurrencyByCountry,
  getCurrencySymbolByCountry,
} from "@/app/lib/currency";
import { WeightField } from "../../dashboard/components/WeightField";
import { PriceField } from "../../dashboard/components/PriceField";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import {
  calculateCarryRequestPricing,
  SERVICE_FEE_TOOLTIP,
} from "@/app/features/carry request/domain/carryRequestPricing";
import {
  type FieldErrors,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form";

const SUGGESTED_PRICES = [8, 10, 12, 15];

type ParcelPricingSectionProps = {
  originCountry: string;
  weightValue: number;
  priceValue: number;
  register: UseFormRegister<ParcelFormFields>;
  setValue: UseFormSetValue<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
  dirtyFields: FieldNamesMarkedBoolean<ParcelFormFields>;
  touchedFields: Partial<FieldNamesMarkedBoolean<ParcelFormFields>>;
};

export default function ParcelPricingSection({
  originCountry,
  weightValue,
  priceValue,
  register,
  setValue,
  errors,
  dirtyFields,
  touchedFields,
}: ParcelPricingSectionProps) {
  const currencySymbol = getCurrencySymbolByCountry(originCountry);
  const { deliveryTotal, serviceFee, totalWithFee } =
    calculateCarryRequestPricing(priceValue, weightValue);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <CustomText textSize="sm" textVariant="label">
          Weight & budget
        </CustomText>
        <CustomText textSize="xs" textVariant="secondary">
          Set the total parcel weight and how much you are willing to pay per kg.
        </CustomText>
      </div>

      <WeightField<ParcelFormFields>
        label="Total weight"
        register={register("weight", { valueAsNumber: true })}
        id="weight"
        error={errors.weight?.message}
        isTouched={!!touchedFields.weight}
        isDirty={!!dirtyFields.weight}
        setValue={setValue}
        value={weightValue}
        name="weight"
      />

      <div className="flex flex-col gap-3">
        <PriceField<ParcelFormFields>
          id="price"
          country={originCountry}
          error={errors.pricePerKg?.message}
          register={register("pricePerKg", { valueAsNumber: true })}
          isTouched={!!touchedFields.pricePerKg}
          isDirty={!!dirtyFields.pricePerKg}
          value={priceValue}
          setValue={setValue}
          name="pricePerKg"
        />

        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PRICES.map((price) => (
            <button
              key={price}
              type="button"
              onClick={() =>
                setValue("pricePerKg", price, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                priceValue === price
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-primary-200 hover:bg-primary-50/50",
              )}
            >
              {currencySymbol}
              {price}/kg
            </button>
          ))}
        </div>

        <CustomText as="p" textSize="xs" className="text-neutral-500">
          Typical offers are {currencySymbol}8–15 per kg.
        </CustomText>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        <CustomText textSize="sm" className="mb-3 font-medium text-ink-primary">
          Cost breakdown
        </CustomText>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-neutral-600">Delivery ({weightValue || 0} kg)</dt>
            <dd className="font-medium text-ink-primary">
              {formatCurrencyByCountry(originCountry, deliveryTotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-neutral-600" title={SERVICE_FEE_TOOLTIP}>
              Service fee (20%)
            </dt>
            <dd className="font-medium text-ink-primary">
              {formatCurrencyByCountry(originCountry, serviceFee)}
            </dd>
          </div>
          <div className="mt-1 flex items-center justify-between gap-4 border-t border-neutral-200 pt-2">
            <dt className="font-medium text-ink-primary">Total you&apos;ll pay</dt>
            <dd className="font-semibold text-primary-700">
              {formatCurrencyByCountry(originCountry, totalWithFee)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
