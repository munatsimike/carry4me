import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import AgreeToTermsRow from "../../dashboard/components/AgreeToTermsRow";
import { AnimatePresence, motion } from "framer-motion";
import CustomText from "@/components/ui/CustomText";
import { PriceField } from "../../dashboard/components/PriceField";
import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { WeightField } from "../../dashboard/components/WeightField";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import { DateField } from "../../dashboard/components/DateField";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import { ArrowLeft } from "lucide-react";
import { StepHeader, type Step } from "@/app/components/forms/formStepper";
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

export const step1Fields: Array<keyof TripFormFields> = [
  "originCountry",
  "originCity",
  "destinationCountry",
  "destinationCity",
  "departureDate",
];

export const step2Fields: Array<keyof TripFormFields> = [
  "goodsCategoryIds",
  "weight",
  "pricePerKg",
  "agreeToRules",
];

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
};

export function CreateTripForm({ mode, formProps, selectedIds }: ContentProps) {
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

  const [step, setStep] = useState<Step>(1);
  const goNext = async () => {
    // validate only step 1 fields
    const ok = await trigger(step1Fields, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const goBack = () => setStep(1);
  const { goodsCategory } = useGoodsCategory();
  const weightValue = watch("weight");
  const priceValue = watch("pricePerKg");

  const dividerHeight = "";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex flex-col gap-5">
        <FormHeader
          heading={mode === "edit" ? "Edit trip" : "Post your trip"}
          subHeading={"Share your trip details to get matched with senders."}
        />
      
          <StepHeader currentStep={step} />
   

        {step === 2 && (
          <span className="hidden sm:block inline-flex absolute left-0 top-0">
            <Button
              type="button"
              variant="neutral"
              onClick={goBack}
              size={"sm"}
            >
              <span className="inline-flex gap-1 items-center text-black">
                <ArrowLeft className="w-4" /> {"Back"}
              </span>
            </Button>
          </span>
        )}
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <LineDivider heightClass={dividerHeight} />
          <RouteFieldRow control={control} />

          <LineDivider heightClass={dividerHeight} />

          <DateField<TripFormFields>
            error={errors.departureDate?.message}
            control={control}
            name={"departureDate"}
            placeholder="dd/mm/yyyy"
          />

          <LineDivider heightClass={dividerHeight} />

          {/* Step actions */}
          <div className="flex justify-end">
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
        <div className="flex flex-col gap-5">
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
            {/* Available Space */}
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

            {/* Price Per Kg */}
            <PriceField<TripFormFields>
              id="price"
              register={register("pricePerKg", { valueAsNumber: true })}
              error={errors.pricePerKg?.message}
              isDirty={!!dirtyFields.pricePerKg}
              isTouched={!!touchedFields.pricePerKg}
              name="pricePerKg"
              setValue={setValue}
              value={priceValue}
            />

            {/* Empty column for alignment */}
            <div />

            {/* You'll Earn aligned under Price */}
            <div className="flex">
              <span className="inline-flex items-center gap-3 bg-green-50 px-4 py-2 rounded-lg border border-green-100 w-fit shadow-sm">
                <CustomText as="span" textSize="xsm" textVariant="label">
                  You’ll earn
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
                      textVariant="success"
                      className={`font-semibold ${
                        priceValue * weightValue > 0 ? "text-green-600" : ""
                      }`}
                    >
                      ${(priceValue * weightValue).toFixed(2)}
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
              {mode === "create"
                ? isSubmitting
                  ? "Posting..."
                  : "Post trip"
                : isSubmitting
                  ? "Saving..."
                  : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
