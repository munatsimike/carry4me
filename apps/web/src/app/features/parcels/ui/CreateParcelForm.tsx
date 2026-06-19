import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  ReviewDetailsHeader,
  StepHeader,
  type Step,
} from "@/app/components/forms/formStepper";
import { AnimatePresence, motion } from "framer-motion";
import { Package } from "lucide-react";
import LineDivider from "@/app/components/LineDivider";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import useGoodsCategory from "@/app/shared/Authentication/UI/hooks/useGoodsCategory";
import { isAllGoodsCategory } from "@/app/features/goods/domain/goodsCategoryConstants";
import ParcelReviewConfirmations from "./ParcelReviewConfirmations";
import ParcelFormReview from "./ParcelFormReview";
import GoodsManifestFields from "./GoodsManifestFields";
import ParcelPricingSection from "./ParcelPricingSection";
import {
  parcelStep1Fields,
  parcelStep2Fields,
  parcelStep3Fields,
} from "./parcelFormSteps";
import { FormStepActions } from "@/app/components/forms/FormStepActions";

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
  variant?: "modal" | "page";
  step?: Step;
  onStepChange?: (step: Step) => void;
};

export default function CreateParcelForm({
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

  const priceValue = watch("pricePerKg");
  const weightValue = watch("weight");
  const originCountry = watch("originCountry");
  const originCity = watch("originCity");
  const originCustomCity = watch("originCustomCity");
  const destinationCountry = watch("destinationCountry");
  const itemDescriptions = watch("itemDescriptions");

  const dividerHeight = "my-0";
  const [internalStep, setInternalStep] = useState<Step>(1);
  const step = controlledStep ?? internalStep;
  const { goodsCategory } = useGoodsCategory();
  const parcelGoodsCategories = useMemo(
    () => goodsCategory.filter((category) => !isAllGoodsCategory(category)),
    [goodsCategory],
  );
  const isEditMode = mode === "edit";
  const isPageVariant = variant === "page";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleCancel = () => {
    const returnTo = searchParams.get("returnTo");
    navigate(returnTo ?? "/my/parcels");
  };

  const goToStep = (next: Step) => {
    if (controlledStep === undefined) setInternalStep(next);
    onStepChange?.(next);
  };

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

  const goNextFromStep3 = async () => {
    const ok = await trigger([...parcelStep3Fields], { shouldFocus: true });
    if (!ok) return;
    if (isEditMode) return;
    goToStep(4);
  };

  const showReviewHeader = step === 4;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4">
        {!isPageVariant && !showReviewHeader && (
          <FormHeader
            heading={mode === "edit" ? "Edit parcel" : "Post parcel"}
            subHeading="Share your parcel details and get matched with travelers."
            icon={<Package size={32} className=" text-primary-500" />}
          />
        )}

        {showReviewHeader ? (
          <ReviewDetailsHeader />
        ) : (
          <StepHeader
            currentStep={step > 3 ? 3 : step}
            formType="parcel"
            className={isPageVariant ? "lg:hidden" : undefined}
            onStepSelect={goToStep}
          />
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
              goods={parcelGoodsCategories}
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
            <FormStepActions
              primaryLabel="Next"
              onPrimary={goNextFromStep1}
              onCancel={isEditMode ? handleCancel : undefined}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="parcel-step-2"
            className="flex flex-col gap-4"
            {...stepMotion}
          >
            <LineDivider heightClass={dividerHeight} />
            <GoodsManifestFields
              control={control}
              register={register}
              errors={errors}
            />
            <LineDivider heightClass={dividerHeight} />
            <FormStepActions
              primaryLabel="Next"
              onPrimary={goNextFromStep2}
              onCancel={isEditMode ? handleCancel : undefined}
            />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="parcel-step-3"
            className="flex flex-col gap-4"
            {...stepMotion}
          >
            <LineDivider heightClass={dividerHeight} />
            <ParcelPricingSection
              originCountry={originCountry}
              weightValue={weightValue}
              priceValue={priceValue}
              register={register}
              setValue={setValue}
              errors={errors}
              dirtyFields={dirtyFields}
              touchedFields={touchedFields}
            />
            {isEditMode ? (
              <>
                <LineDivider heightClass={dividerHeight} />
                <ParcelReviewConfirmations register={register} errors={errors} />
              </>
            ) : null}
            <FormStepActions
              primaryLabel={isEditMode ? undefined : "Review"}
              onPrimary={goNextFromStep3}
              submitLabel={
                isEditMode
                  ? isSubmitting
                    ? "Saving..."
                    : "Save changes"
                  : undefined
              }
              isSubmitting={isSubmitting}
              showSubmit={isEditMode}
              onCancel={isEditMode ? handleCancel : undefined}
            />
          </motion.div>
        )}

        {step === 4 && !isEditMode && (
          <motion.div
            key="parcel-step-4"
            className="flex flex-col gap-3"
            {...stepMotion}
          >
            <ParcelFormReview
              originCountry={originCountry}
              originCity={originCity}
              originCustomCity={originCustomCity}
              destinationCountry={destinationCountry}
              itemDescriptions={itemDescriptions}
              selectedIds={selectedIds}
              goodsCategory={goodsCategory}
              weight={weightValue}
              pricePerKg={priceValue}
              onEditStep={goToStep}
            />
            <ParcelReviewConfirmations register={register} errors={errors} />
            <FormStepActions
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
