import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import FormModal from "./components/FormModal";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormHeader from "./components/FormHeader";
import { META_ICONS } from "@/app/icons/MetaIcon";
import RouteFieldRow from "./components/RouteFieldRow";
import AgreeToTermsRow from "./components/AgreeToTermsRow";
import SvgIcon from "@/components/ui/SvgIcon";
import GoodsCategoryGrid from "./components/GoodsCategoryGrid";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";

import z from "zod";
import { useMemo, useState } from "react";
import type { ParcelItem } from "../parcels/domain/CreateParcel";
import { StepHeader } from "@/app/components/forms/formStepper";
import { X } from "lucide-react";
import { PriceField } from "./components/PriceField";
import { WeightField } from "./components/WeightField";
import toCreateParcelMapper from "../goods/domain/toCreatParcelMapper";
import { CreateParcelUseCase } from "../parcels/application/CreateParcelUseCase";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { SupabaseParcelRepository } from "../parcels/data/SupabaseParcelRepository";
import { SupabaseGoodsRepository } from "../goods/data/SupabaseGoodsRepository";
import { SaveGoodsUseCase } from "../goods/application/SaveGoodsUseCase";
import type { UserGoods } from "../goods/domain/UserGoods";
import toGoodsMapper from "../goods/domain/toGoodsMapper";
import { useToast } from "@/app/components/Toast";

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
    .min(1, "Enter item quantity and description"),
  totalWeight: z.number().min(1, "Quantity should be 1 or more"),
  pricePerKg: z.number().min(1, "Price should be 1 or more"),

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
  "pricePerKg",
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

  const repo = useMemo(() => new SupabaseParcelRepository(), []);
  const useCase = useMemo(() => new CreateParcelUseCase(repo), [repo]);
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );
  const { toast } = useToast();
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
      pricePerKg: 0,
      agreeToRules: false,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedIds = watch("goodsCategoryIds");
  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");
  const priceValue = watch("pricePerKg");
  const weightValue = watch("totalWeight");

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
    const ok = await trigger(parcelStep1Fields, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };
  const { user } = useAuth();

  const goBack = () => setStep(1);

  const onValid = async (values: ParcelFormFields) => {
    if (!user) return;
    const ok = await trigger(parcelStep2Fields, { shouldFocus: true });
    if (!ok) return;

    try {
      // your existing save flow...
      const parcelId = await createParcel(values, user.id, useCase, () =>
        setModalState(false),
      );

      if (!parcelId) return;

      await SaveGoodsCategories(
        saveGoodsUseCase,
        toGoodsMapper(parcelId, selectedIds),
      );
      toast("Parcel saved successfully", { variant: "success" });
    } catch (e) {
      console.log(e);
    }
  };

  const onInvalid = (formErrors: unknown) => {
    // optional: you can auto-jump to the step that contains errors
    // but keep it simple for now
    console.log(formErrors);
  };

  return (
    <FormModal
      onSubmit={handleSubmit(onValid, onInvalid)}
      onClose={() => setModalState(false)}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-5">
          <FormHeader
            heading={"Post a parcel"}
            subHeading={
              "Share your parcel details to get matched with travelers."
            }
            icon={META_ICONS.parcelBox}
          />

          <div className="flex flex-col gap-3">
            <StepHeader currentStep={step} formType="parcel" />
          </div>
        </div>
        {step === 1 ? (
          <div className="flex flex-col gap-5">
            <LineDivider heightClass={dividerHeight} />
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
            />

            <AddItemButton onClick={addField} />

            <LineDivider heightClass={dividerHeight} />
            <span className="flex flex-col gap-3">
              <span className="flex flex-wrap gap-4 sm:gap-[34px]">
                <WeightField<ParcelFormFields>
                  register={register("totalWeight", { valueAsNumber: true })}
                  id="weight"
                  error={errors.totalWeight?.message}
                  isTouched={!!touchedFields.totalWeight}
                  isDirty={!!dirtyFields.totalWeight}
                  setValue={setValue}
                  value={weightValue}
                  name={"totalWeight"}
                />
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
              </span>
              <span className="flex gap-2 items-center sm:pl-[170px]">
                <CustomText textSize="xsm" textVariant="label">
                  {"You’ll pay"}
                </CustomText>

                <span className="inline-flext rounded-md w-[60px]">
                  <CustomText textSize="sm" textVariant="primary">
                    {"$"}
                    {priceValue * weightValue}
                  </CustomText>
                </span>
              </span>
            </span>
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
          </div>
        )}
      </div>
    </FormModal>
  );
}

type DescriptionQuantityRowProps = {
  fields: ParcelItem[];
  onRemove: (index: number) => void;
  register: UseFormRegister<ParcelFormFields>;
  errors: FieldErrors<ParcelFormFields>;
  dirty: FieldNamesMarkedBoolean<ParcelFormFields>;
  touched: FieldNamesMarkedBoolean<ParcelFormFields>;
};

function DescriptionQuantityRow({
  errors,
  fields,
  onRemove,
  register,
  dirty,
  touched,
}: DescriptionQuantityRowProps) {
  return (
    <div className="inline-flex flex-col gap-5">
      <div>
        <CustomText textSize="xsm" textVariant="label">
          {"Contents of your package"}
        </CustomText>
      </div>

      {fields.map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[80px_190px] gap-4">
            <FloatingInputField
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
        <SvgIcon Icon={META_ICONS.addIcon} size={"xsm"} color="dark" />
        <CustomText textVariant="primary" textSize="sm">
          {"Add item"}
        </CustomText>
      </span>
    </Button>
  );
}

async function createParcel(
  values: ParcelFormFields,
  userId: string,
  useCase: CreateParcelUseCase,
  onCloseModal: () => void,
): Promise<string> {
  const { result } = await namedCall(
    "createParcel",
    useCase.execute(toCreateParcelMapper(userId, values)),
  );
  onCloseModal();

  if (!result.success) {
    console.log("");
    return "";
  }

  return result.data;
}
async function SaveGoodsCategories(
  saveGoodsUseCase: SaveGoodsUseCase,
  goods: UserGoods,
) {
  await saveGoodsUseCase.execute(goods, false);
}
