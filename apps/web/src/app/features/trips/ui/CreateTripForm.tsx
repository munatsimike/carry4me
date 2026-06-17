import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import { AnimatePresence, motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import { PriceField } from "../../dashboard/components/PriceField";
import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { WeightField } from "../../dashboard/components/WeightField";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import { DateField } from "../../dashboard/components/DateField";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import { Plane } from "lucide-react";
import {
  ReviewDetailsHeader,
  StepHeader,
  type Step,
} from "@/app/components/forms/formStepper";
import FormHeader from "../../dashboard/components/FormHeader";

import type {
  Control,
  FieldErrors,
  FieldNamesMarkedBoolean,
  UseFormRegister,
  UseFormSetValue,
  UseFormTrigger,
  UseFormWatch,
} from "react-hook-form";

import type { FormMode } from "@/types/Ui";
import { useState } from "react";
import useGoodsCategory from "@/app/shared/Authentication/UI/hooks/useGoodsCategory";
import TripFormReview from "./TripFormReview";
import { tripStep1Fields, tripStep2Fields } from "./tripFormSteps";

const stepMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2 },
};

type FormProps = {
  control: Control<TripFormFields>;
  register: UseFormRegister<TripFormFields>;
  isSubmitting: boolean;
  setValue: UseFormSetValue<TripFormFields>;
  trigger: UseFormTrigger<TripFormFields>;
  watch: UseFormWatch<TripFormFields>;
  dirtyFields: FieldNamesMarkedBoolean<TripFormFields>;
  errors: FieldErrors<TripFormFields>;
  touchedFields: Partial<FieldNamesMarkedBoolean<TripFormFields>>;
};

type ContentProps = {
  formProps: FormProps;
  selectedIds: string[];
  mode: FormMode;
  variant?: "modal" | "page";
  step?: Step;
  onStepChange?: (step: Step) => void;
};

export function CreateTripForm({
  mode,
  formProps,
  selectedIds,
  variant = "modal",
  step: controlledStep,
  onStepChange,
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

  const [internalStep, setInternalStep] = useState<Step>(1);
  const step = controlledStep ?? internalStep;
  const { goodsCategory } = useGoodsCategory();
  const isPageVariant = variant === "page";

  const goToStep = (next: Step) => {
    if (controlledStep === undefined) setInternalStep(next);
    onStepChange?.(next);
  };

  const weightValue = watch("weight");
  const priceValue = watch("pricePerKg");
  const originCountry = watch("originCountry");
  const originCity = watch("originCity");
  const originCustomCity = watch("originCustomCity");
  const destinationCountry = watch("destinationCountry");
  const departureDate = watch("departureDate");

  const dividerHeight = "my-0";
  const isEditMode = mode === "edit";

  const goNextFromStep1 = async () => {
    const ok = await trigger([...tripStep1Fields], { shouldFocus: true });
    if (!ok) return;
    goToStep(2);
  };

  const goNextFromStep2 = async () => {
    const ok = await trigger([...tripStep2Fields], { shouldFocus: true });
    if (!ok) return;
    goToStep(3);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4">
        {!isPageVariant && step !== 3 && (
          <FormHeader
            size="sm"
            heading={mode === "edit" ? "Edit trip" : "Post your trip"}
            subHeading="Share your trip details and get matched with senders."
            icon={<Plane size={32} className=" text-primary-500" />}
          />
        )}

        {step === 3 ? (
          <ReviewDetailsHeader />
        ) : (
          <StepHeader
            currentStep={step}
            formType="trip"
            className={isPageVariant ? "lg:hidden" : undefined}
            onStepSelect={goToStep}
          />
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="trip-step-1"
            className="flex flex-col gap-4"
            {...stepMotion}
          >
            <LineDivider heightClass={dividerHeight} />
            <RouteFieldRow control={control} setValue={setValue} watch={watch} />
            <LineDivider heightClass={dividerHeight} />
            <DateField<TripFormFields>
              error={errors.departureDate?.message}
              control={control}
              name={"departureDate"}
              placeholder="dd/mm/yyyy"
              maxFutureMonths={12}
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
            key="trip-step-2"
            className="flex flex-col gap-4"
            {...stepMotion}
          >
            <LineDivider heightClass={dividerHeight} />
            <GoodsCategoryGrid
              label="What items do you prefer to carry?"
              error={errors.goodsCategoryIds?.message}
              goods={goodsCategory}
              selectedIds={selectedIds}
              onChange={(next) =>
                setValue("goodsCategoryIds", next, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
            <LineDivider heightClass={dividerHeight} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[20px]">
              <WeightField<TripFormFields>
                id="weight"
                register={register("weight", { valueAsNumber: true })}
                error={errors.weight?.message}
                isDirty={!!dirtyFields.weight}
                isTouched={!!touchedFields.weight}
                name="weight"
                setValue={setValue}
                value={weightValue}
              />
              <div className="flex flex-col gap-2">
                <PriceField<TripFormFields>
                  id="price"
                  country={originCountry}
                  register={register("pricePerKg", { valueAsNumber: true })}
                  error={errors.pricePerKg?.message}
                  isDirty={!!dirtyFields.pricePerKg}
                  isTouched={!!touchedFields.pricePerKg}
                  name="pricePerKg"
                  setValue={setValue}
                  value={priceValue}
                />
                <CustomText as="p" textSize="xs" className="text-neutral-500">
                  Most travelers charge $8–15 per kg.
                </CustomText>
              </div>
            </div>
            <LineDivider heightClass={dividerHeight} />
            <StepActions
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
            key="trip-step-3"
            className="flex flex-col gap-3"
            {...stepMotion}
          >
            <TripFormReview
              originCountry={originCountry}
              originCity={originCity}
              originCustomCity={originCustomCity}
              destinationCountry={destinationCountry}
              departureDate={departureDate}
              selectedIds={selectedIds}
              goodsCategory={goodsCategory}
              weight={weightValue}
              pricePerKg={priceValue}
            />
            <LineDivider heightClass={dividerHeight} />
            <StepActions
              submitLabel={isSubmitting ? "Posting..." : "Post trip"}
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
  primaryLabel,
  onPrimary,
  submitLabel,
  isSubmitting,
  showSubmit,
}: {
  primaryLabel?: string;
  onPrimary?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  showSubmit?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
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
