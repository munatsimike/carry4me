import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import FormModal from "./components/FormModal";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormHeader from "./components/FormHeader";
import { META_ICONS } from "@/app/icons/MetaIcon";
import RouteFieldRow from "./components/RouteFieldRow";
import AgreeToTermsRow from "./components/AgreeToTermsRow";
import SvgIcon from "@/components/ui/SvgIcon";
import GoodsCategoryGrid from "./components/GoodsCategoryGrid";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import PriceField from "./components/PriceField";
import z from "zod";
import { useState } from "react";
import type { ParcelItem } from "../parcels/domain/CreateParcel";
import { StepHeader } from "@/app/components/forms/formStepper";
import { X } from "lucide-react";
import WeightField from "./components/WeightField";
export const parcelItemSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
  description: z.string().trim().min(1, "Item description is required"),
});

const parcelSchema = z.object({
  originCountry: z.string().min(3, "Country is required"),
  originCity: z.string().min(1, "city is required"),
  destinationCountry: z.string().min(3, "Country is required"),
  destinationCity: z.string().min(1, "City is required"),
  goodsCategoryIds: z.array(z.string()).min(1, "Select at least one category"),
  itemDescriptions: z
    .array(parcelItemSchema)
    .min(1, "Enter at least one item with quantity and description"),
  totalWeight: z.number().min(1, "Quantity should be 1 or more"),
  totalPrice: z.number().min(1, "Price should be 1 or more"),

  agreeToRules: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the rules" }),
});

export type ParcelFormFields = z.infer<typeof parcelSchema>;

type Step = 1 | 2;

// choose what belongs to each step
const parcelStep1Fields = [
  "originCountry",
  "originCity",
  "goodsCategoryIds",
] as const;
const parcelStep2Fields = [
  "itemDescriptions",
  "totalWeight",
  "totalPrice",
  "agreeToRules",
] as const;

export default function CreateParcelModal({
  goodsCategory,
  setModalState,
}: {
  goodsCategory: GoodsCategory[];
  showModal: boolean;
  setModalState: (v: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(1);

  // ... your useMemo repos/usecases etc

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<ParcelFormFields>({
    resolver: zodResolver(parcelSchema),
    defaultValues: {
      originCountry: "",
      originCity: "",
      destinationCountry: "Zimbabwe",
      destinationCity: "Harare",
      goodsCategoryIds: [],
      itemDescriptions: [{ quantity: 1, description: "" }],
      totalWeight: 1,
      totalPrice: 0,
      agreeToRules: false,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedIds = watch("goodsCategoryIds");
  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");

  const dividerHeight = "my-0";

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itemDescriptions",
  });

  function addField() {
    append({ quantity: 1, description: "" });
  }

  function removeField(index: number) {
    remove(index);
  }

  const goNext = async () => {
    const ok = await trigger(parcelStep1Fields as any, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const goBack = () => setStep(1);

  const onValid = async (values: ParcelFormFields) => {
    const ok = await trigger(parcelStep2Fields as any, { shouldFocus: true });
    if (!ok) return;

    try {
      // your existing save flow...
      // const parcelId = await createParcel(...)
      // await SaveGoodsCategories(...)
      // toast success
      setModalState(false);
    } catch (e) {
      console.log(e);
    }
  };

  const onInvalid = (formErrors: any) => {
    // optional: you can auto-jump to the step that contains errors
    // but keep it simple for now
    console.log(formErrors);
  };

  return (
    <FormModal
      onSubmit={handleSubmit(onValid, onInvalid)}
      onClose={() => setModalState(false)}
    >
      <FormHeader
        heading={"Post a parcel"}
        subHeading={"Share your parcel details to get matched with travelers."}
        icon={META_ICONS.parcelBox}
      />

      <div className="flex flex-col gap-3">
        <StepHeader currentStep={step} formType="parcel" />
      </div>
      <LineDivider heightClass={dividerHeight} />
      {step === 1 ? (
        <>
          <RouteFieldRow
            countryError={errors.originCountry?.message}
            cityError={errors.originCity?.message}
            cityValue={cityValue}
            countryValue={countryValue}
            registerCity={register("originCity")}
            registerCountry={register("originCountry")}
            isCountryDirty={!!dirtyFields.originCountry}
            isCountryTouched={!!dirtyFields.originCountry}
            isCityDirty={!!dirtyFields.originCity}
            isCityTouched={!!touchedFields.originCity}
          />

          <LineDivider heightClass={dividerHeight} />

          <GoodsCategoryGrid
            label="What items are you sending?"
            error={errors.goodsCategoryIds?.message}
            goods={goodsCategory}
            selectedIds={selectedIds}
            onChange={(next) =>
              setValue("goodsCategoryIds", next, { shouldValidate: true })
            }
          />

          <LineDivider heightClass={dividerHeight} />

          {/* Step actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="primary"
              onClick={goNext}
              size={"sm"}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <>
          <DescriptionQuantityRow
            errors={errors}
            fields={fields as any}
            onRemove={removeField}
            register={register}
          />

          <AddItemButton onClick={addField} />

          <LineDivider heightClass={dividerHeight} />

          <span className="flex flex-wrap gap-4 sm:gap-20">
            <WeightField
              id="weight"
              error={errors.totalWeight?.message}
              register={register("totalWeight", { valueAsNumber: true })}
              isTouched={!! touchedFields.totalWeight}
              isDirty={!!dirtyFields.totalWeight}
            />
            <PriceField
              id="price"
              error={errors.totalPrice?.message}
              register={register("totalPrice", { valueAsNumber: true })}
              isTouched={!!touchedFields.totalPrice}
              isDirty={!!dirtyFields.totalPrice}
            />
          </span>

          <LineDivider heightClass={dividerHeight} />

          <AgreeToTermsRow
            register={register("agreeToRules")}
            id={"terms"}
            error={errors.agreeToRules?.message}
          />

          <LineDivider heightClass={dividerHeight} />

          {/* Step actions */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              size={"sm"}
            >
              Back
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              size={"sm"}
            >
              {"Submit"}
            </Button>
          </div>
        </>
      )}
    </FormModal>
  );
}

function DescriptionQuantityRow({
  errors,
  fields,
  onRemove,
  register,
}: {
  fields: ParcelItem[];
  onRemove: (index: number) => void;
  register: any;
  errors: FieldErrors<ParcelFormFields>;
}) {
  return (
    <div className="inline-flex flex-col gap-3">
      <div>
        <CustomText textVariant="primary">
          {"Contents of your package"}
        </CustomText>
      </div>

      {fields.map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[110px_250px] gap-4">
            <FloatingInputField
              type="number"
              error={errors.itemDescriptions?.[index]?.quantity?.message}
              {...register(`itemDescriptions.${index}.quantity}`, {
                valueAsNumber: true,
              })}
              label="quantity"
            />
            <FloatingInputField
              error={errors.itemDescriptions?.[index]?.description?.message}
              {...register(`itemDescriptions.${index}.description`)}
              label="Description e.g ladies jeans"
            />
          </div>
          {index > 0 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-ink-error"
            >
              <X className="h-5 w-5 hover:bg-error-50  rounded-full" />
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
      className="w-full max-w-[130px]"
      variant={"neutral"}
      size={"md"}
    >
      <span className="inline-flex items-center gap-2">
        <SvgIcon Icon={META_ICONS.addIcon} size={"xsm"} />
        <CustomText textVariant="primary">{"Add item"}</CustomText>
      </span>
    </Button>
  );
}
