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
import {
  ReviewDetailsHeader,
  StepHeader,
  type Step,
} from "@/app/components/forms/formStepper";
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
import ParcelFormReview from "./ParcelFormReview";
import { parcelStep1Fields, parcelStep2Fields } from "./parcelFormSteps";

export type ParcelFormMode = "edit" | "create";

const stepMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2 },
};

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
  const originCity = watch("originCity");
  const originCustomCity = watch("originCustomCity");
  const destinationCountry = watch("destinationCountry");
  const itemDescription = watch("itemDescriptions.0.description");

  const dividerHeight = "my-0";
  const [step, setStep] = useState<Step>(1);
  const { goodsCategory } = useGoodsCategory();
  const isEditMode = mode === "edit";

  const goToStep = (next: Step) => setStep(next);

  const goNextFromStep1 = async () => {
    const ok = await trigger([...parcelStep1Fields], { shouldFocus: true });
    if (!ok) return;
    goToStep(2);
  };

  const goNextFromStep2 = async () => {
    const ok = await trigger([...parcelStep2Fields], { shouldFocus: true });
    if (!ok) return;
    goToStep(3);
  };

  const goBack = () => {
    if (step === 3) goToStep(2);
    else if (step === 2) goToStep(1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4">
        {step !== 3 && (
          <FormHeader
            heading={mode === "edit" ? "Edit parcel" : "Post parcel"}
            subHeading="Share your parcel details and get matched with travelers."
            icon={META_ICONS.parcelBox}
          />
        )}

        {step === 3 ? (
          <ReviewDetailsHeader />
        ) : (
          <StepHeader currentStep={step} formType="parcel" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="parcel-step-1"
            className="flex flex-col gap-4"
            {...stepMotion}
          >
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
            <div className="flex justify-end">
              <Button
                className="w-full"
                type="button"
                variant="primary"
                onClick={goNextFromStep1}
                size={"md"}
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="parcel-step-2"
            className="flex flex-col gap-4"
            {...stepMotion}
          >
            <LineDivider heightClass={dividerHeight} />
            <PackageDescriptionField errors={errors} register={register} />
            <LineDivider heightClass={dividerHeight} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[20px]">
              <WeightField<ParcelFormFields>
                register={register("weight", { valueAsNumber: true })}
                id="weight"
                error={errors.weight?.message}
                isTouched={!!touchedFields.weight}
                isDirty={!!dirtyFields.weight}
                setValue={setValue}
                value={weightValue}
                name="weight"
              />
              <div className="flex flex-col gap-2">
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
                <CustomText as="p" textSize="xs" className="text-neutral-500">
                  Typical offers are $8–15 per kg.
                </CustomText>
              </div>
              <div />
              <div className="flex">
                <span className="inline-flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50 px-4 py-2 shadow-sm w-fit">
                  <CustomText as="span" textSize="xs" textVariant="label">
                    You&apos;ll pay
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
                            ? "font-semibold text-primary-600"
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
            {isEditMode && (
              <>
                <LineDivider heightClass={dividerHeight} />
                <AgreeToTermsRow
                  register={register("agreeToRules")}
                  id="terms"
                  error={errors.agreeToRules?.message}
                />
              </>
            )}
            <LineDivider heightClass={dividerHeight} />
            <StepActions
              onBack={goBack}
              primaryLabel={isEditMode ? undefined : "Review"}
              onPrimary={goNextFromStep2}
              submitLabel={
                isEditMode
                  ? isSubmitting
                    ? "Saving..."
                    : "Save changes"
                  : undefined
              }
              isSubmitting={isSubmitting}
              showSubmit={isEditMode}
            />
          </motion.div>
        )}

        {step === 3 && !isEditMode && (
          <motion.div
            key="parcel-step-3"
            className="flex flex-col gap-3"
            {...stepMotion}
          >
            <ParcelFormReview
              originCountry={originCountry}
              originCity={originCity}
              originCustomCity={originCustomCity}
              destinationCountry={destinationCountry}
              itemDescription={itemDescription}
              selectedIds={selectedIds}
              goodsCategory={goodsCategory}
              weight={weightValue}
              pricePerKg={priceValue}
            />
            <AgreeToTermsRow
              register={register("agreeToRules")}
              id="terms"
              error={errors.agreeToRules?.message}
            />
            <LineDivider heightClass={dividerHeight} />
            <StepActions
              onBack={goBack}
              submitLabel={isSubmitting ? "Posting..." : "Post parcel"}
              isSubmitting={isSubmitting}
              showSubmit
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepActions({
  onBack,
  primaryLabel,
  onPrimary,
  submitLabel,
  isSubmitting,
  showSubmit,
}: {
  onBack: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showSubmit?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button
        className="w-full sm:w-auto sm:min-w-[120px]"
        type="button"
        variant="neutral"
        onClick={onBack}
        size={"md"}
      >
        <span className="inline-flex gap-1 items-center justify-center">
          <ArrowLeft className="w-4" /> Back
        </span>
      </Button>
      {showSubmit ? (
        <Button
          className="w-full flex-1"
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          size={"md"}
        >
          {submitLabel}
        </Button>
      ) : (
        primaryLabel &&
        onPrimary && (
          <Button
            className="w-full flex-1"
            type="button"
            variant="primary"
            onClick={onPrimary}
            size={"md"}
          >
            {primaryLabel}
          </Button>
        )
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
        Parcel contents
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
