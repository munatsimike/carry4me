import type { TripFormFields } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import type { FormMode, GoodsItem } from "@/types/Ui";
import { useState } from "react";
import {
  useFieldArray,
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
import { ArrowLeft, X } from "lucide-react";
import LineDivider from "@/app/components/LineDivider";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import { WeightField } from "../../dashboard/components/WeightField";
import type { ParcelFormFields } from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import { PriceField } from "../../dashboard/components/PriceField";
import CustomText from "@/components/ui/CustomText";
import AgreeToTermsRow from "../../dashboard/components/AgreeToTermsRow";
import FloatingInputField from "@/app/components/CustomInputField";
import SvgIcon from "@/components/ui/SvgIcon";
import useGoodsCategory from "@/app/shared/Authentication/UI/hooks/useGoodsCategory";
export type ParcelFormMode = "edit" | "create";

type Step = 1 | 2;

// choose what belongs to each step
const parcelStep1Fields = [
  "originCountry",
  "originCity",
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
  const dividerHeight = "my-0";
  const [step, setStep] = useState<Step>(1);
  const { goodsCategory } = useGoodsCategory();

  function addField() {
    append({ quantity: 1, description: "" });
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itemDescriptions",
  });
  function removeField(index: number) {
    remove(index);
  }

  const goNext = async () => {
    const ok = await trigger(parcelStep1Fields, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const goBack = () => setStep(1);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        <FormHeader
          heading={`${mode === "edit" ? "Edit parcel" : "Post parcel"}`}
          subHeading={
            "Share your parcel details to get matched with travelers."
          }
          icon={META_ICONS.parcelBox}
        />
        <StepHeader currentStep={step} formType="parcel" />

        {step === 2 && (
          <motion.span
            className="inline-flex absolute left-5 top-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Button type="button" variant="neutral" onClick={goBack} size="sm">
              <span className="inline-flex gap-1 items-center text-black">
                <ArrowLeft className="w-4" /> Back
              </span>
            </Button>
          </motion.span>
        )}
      </div>
      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <LineDivider heightClass={dividerHeight} />
          <RouteFieldRow control={control} />

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
        <div className="flex flex-col gap-4">
          <LineDivider heightClass={dividerHeight} />
          <DescriptionQuantityRow
            errors={errors}
            fields={fields}
            onRemove={removeField}
            register={register}
            dirty={dirtyFields}
            touched={touchedFields}
            hasValueQty={false}
            hasValueDescription={false}
          />

          <AddItemButton onClick={addField} />

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
                <CustomText as="span" textSize="xsm" textVariant="label">
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
              {`${mode === "edit" ? "Save changes" : "Post parcel"}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

type DescriptionQuantityRowProps = {
  fields: GoodsItem[];
  onRemove: (index: number) => void;
  register: UseFormRegister<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
  dirty: FieldNamesMarkedBoolean<ParcelFormFields>;
  touched: FieldNamesMarkedBoolean<ParcelFormFields>;
  hasValueQty: boolean;
  hasValueDescription: boolean;
};

function DescriptionQuantityRow({
  errors,
  fields,
  onRemove,
  register,
  dirty,
  touched,
  hasValueQty,
  hasValueDescription,
}: DescriptionQuantityRowProps) {
  return (
    <div className="inline-flex flex-col gap-5">
      <div>
        <CustomText textSize="sm" textVariant="label">
          {"Contents of your package"}
        </CustomText>
      </div>

      {fields.map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[80px_190px] gap-10">
            <FloatingInputField
              hasValue={hasValueQty}
              type="number"
              error={errors.itemDescriptions?.[index]?.quantity?.message}
              {...register(`itemDescriptions.${index}.quantity`, {
                valueAsNumber: true,
              })}
              label="Qty"
              isTouched={!!touched.itemDescriptions?.[index]?.quantity}
              isDirty={!!dirty.itemDescriptions?.[index]?.quantity}
            />
            <FloatingInputField
              hasValue={hasValueDescription}
              error={errors.itemDescriptions?.[index]?.description?.message}
              {...register(`itemDescriptions.${index}.description`)}
              label="item e.g ladies jeans"
              isTouched={!!touched.itemDescriptions?.[index]?.description}
              isDirty={!!dirty.itemDescriptions?.[index]?.description}
            />
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-ink-error"
            >
              <X className="h-5 w-5 hover:bg-error-50  rounded-lg" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function AddItemButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className="w-full max-w-[115px]"
      variant={"outline"}
      size={"sm"}
    >
      <span className="inline-flex items-center gap-2">
        <SvgIcon Icon={META_ICONS.addIcon} size={"xs"} color="dark" />
        <CustomText textVariant="primary" textSize="sm">
          {"Add item"}
        </CustomText>
      </span>
    </Button>
  );
}
