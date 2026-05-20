import type { GoodsItem } from "@/types/Ui";
import { useState } from "react";
import {
  type Control,
  type FieldErrors,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormTrigger,
  type UseFormWatch,
} from "react-hook-form";
import FormHeader from "../../dashboard/components/FormHeader";
import { META_ICONS } from "@/app/icons/MetaIcon";
import { StepHeader } from "@/app/components/forms/formStepper";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import LineDivider from "@/app/components/LineDivider";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import { WeightField } from "../../dashboard/components/WeightField";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import { PriceField } from "../../dashboard/components/PriceField";
import CustomText from "@/components/ui/CustomText";
import AgreeToTermsRow from "../../dashboard/components/AgreeToTermsRow";
import { inputError, inputNeutral } from "@/app/lib/cn";
import useGoodsCategory from "@/app/shared/Authentication/UI/hooks/useGoodsCategory";
import { formatCurrencyByCountry } from "@/app/lib/currency";
export type ParcelFormMode = "edit" | "create";

type Step = 1 | 2;

// choose what belongs to each step
const parcelStep1Fields = [
  "originCountry",
  "originCity",
  "originCustomCity",
  "goodsCategoryIds",
] as const;

export const parcelStep2Fields = [
  "itemDescriptions",
  "weight",
  "pricePerKg",
  "agreeToRules",
] as const;

type ParcelFormProps = {
  control: Control<ParcelFormFields>;
  register: UseFormRegister<ParcelFormFields>;
  isSubmitting: boolean;
  setValue: UseFormSetValue<ParcelFormFields>;
  trigger: UseFormTrigger<ParcelFormFields>;
  watch: UseFormWatch<ParcelFormFields>;
  dirtyFields: FieldNamesMarkedBoolean<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
  touchedFields: Partial<FieldNamesMarkedBoolean<ParcelFormFields>>;
};

type ContentProps = {
  formProps: ParcelFormProps;
  selectedIds: string[];
  mode: ParcelFormMode;
};

export default function CreateParcelForm({
  mode,
  formProps,
  selectedIds,
}: ContentProps) {
  const {
    control,
    watch,
    register,
    setValue,
    isSubmitting,
    errors,
    dirtyFields,
    touchedFields,
    trigger,
  } = formProps;

  const priceValue = watch("pricePerKg");
  const weightValue = watch("weight");
  const originCountry = watch("originCountry");
  const dividerHeight = "my-0";
  const [step, setStep] = useState<Step>(1);
  const { goodsCategory } = useGoodsCategory();

  const goNext = async () => {
    const ok = await trigger(parcelStep1Fields, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const goBack = () => setStep(1);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex flex-col gap-4">
        <FormHeader
          heading={`${mode === "edit" ? "Edit parcel" : "Post parcel"}`}
          subHeading={
            "Share your parcel details and get matched with travelers."
          }
          icon={META_ICONS.parcelBox}
        />
        <StepHeader currentStep={step} formType="parcel" />

        {step === 2 && (
          <motion.span
            className="hidden sm:block inline-flex absolute left-5 top-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button type="button" variant="neutral" onClick={goBack} size="sm">
              <span className="inline-flex gap-1 items-center text-black">
                <ArrowLeft className="w-4" /> Step 1
              </span>
            </Button>
          </motion.span>
        )}
      </div>
      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <LineDivider heightClass={dividerHeight} />
          <RouteFieldRow control={control} setValue={setValue} watch={watch} />

          <LineDivider heightClass={dividerHeight} />

          <GoodsCategoryGrid
            label="What items are you sending?"
            error={errors.goodsCategoryIds?.message}
            goods={goodsCategory}
            selectedIds={selectedIds}
            onChange={(next) =>
              setValue("goodsCategoryIds", next, {
                shouldDirty: true,
                shouldValidate: true,
                shouldTouch: true,
              })
            }
          />

          <LineDivider heightClass={dividerHeight} />

          {/* Step actions */}
          <div className="flex justify-end gap-4">
            <Button
              className="w-full"
              type="button"
              variant="primary"
              onClick={goNext}
              size={"md"}
            >
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <LineDivider heightClass={dividerHeight} />
          <PackageDescriptionField errors={errors} register={register} />
          <LineDivider heightClass={dividerHeight} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-[20px]">
            {/* Weight Field */}
            <WeightField<ParcelFormFields>
              register={register("weight", { valueAsNumber: true })}
              id="weight"
              error={errors.weight?.message}
              isTouched={!!touchedFields.weight}
              isDirty={!!dirtyFields.weight}
              setValue={setValue}
              value={weightValue}
              name={"weight"}
            />

            {/* Price Field */}
            <PriceField<ParcelFormFields>
              id="price"
              error={errors.pricePerKg?.message}
              register={register("pricePerKg", { valueAsNumber: true })}
              isTouched={!!touchedFields.pricePerKg}
              isDirty={!!dirtyFields.pricePerKg}
              value={priceValue}
              setValue={setValue}
              name={"pricePerKg"}
            />

            {/* Empty left column (keeps alignment clean) */}
            <div />

            {/* You'll Pay aligned under Price */}
            <div className="flex">
              <span className="inline-flex items-center gap-3 bg-primary-50 px-4 py-2 rounded-lg shadow-sm w-fit border border-primary-100">
                <CustomText as="span" textSize="xs" textVariant="label">
                  You’ll pay
                </CustomText>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={priceValue * weightValue}
                    initial={{ scale: 0.95, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="inline-flex"
                  >
                    <CustomText
                      as="span"
                      textSize="sm"
                      textVariant="primary"
                      className={
                        priceValue * weightValue > 0
                          ? "text-primary-600 font-semibold"
                          : ""
                      }
                    >
                      {formatCurrencyByCountry(
                        originCountry,
                        priceValue * weightValue,
                      )}
                    </CustomText>
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </div>
          <LineDivider heightClass={dividerHeight} />

          <AgreeToTermsRow
            register={register("agreeToRules")}
            id={"terms"}
            error={errors.agreeToRules?.message}
          />

          <LineDivider heightClass={dividerHeight} />

          {/* Step actions */}
          <div className="flex items-center justify-between gap-4">
            <Button
              className="w-full"
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              size={"md"}
            >
              {`${mode === "edit" ? "Save changes" : "Post parcel"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type DescriptionProps = {
  fields: GoodsItem[];
  onRemove: (index: number) => void;
  register: UseFormRegister<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
  dirty: FieldNamesMarkedBoolean<ParcelFormFields>;
  touched: FieldNamesMarkedBoolean<ParcelFormFields>;
  hasValueQty: boolean;
  hasValueDescription: boolean;
};

function PackageDescriptionField({
  errors,
  register,
}: Pick<DescriptionProps, "errors" | "register">) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <CustomText textSize="sm" textVariant="label">
        {"Parcel contents"}
      </CustomText>

      <textarea
        {...register("itemDescriptions.0.description", {
          setValueAs: (value) =>
            typeof value === "string" ? value.trimStart() : value,
        })}
        placeholder="e.g. clothes, shoes, documents, small electronics"
        maxLength={160}
        className={`
          min-h-[120px]
          w-full
          rounded-xl
          p-4
          text-sm
          outline-none
          resize-none
          transition-colors
          ${
            errors.itemDescriptions?.[0]?.description
              ? inputError
              : inputNeutral
          }
        `}
      />

      {errors.itemDescriptions?.[0]?.description?.message && (
        <CustomText textSize="xs" className="text-ink-error">
          {errors.itemDescriptions[0].description.message}
        </CustomText>
      )}
    </div>
  );
}
