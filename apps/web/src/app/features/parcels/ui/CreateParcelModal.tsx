import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import FormModal from "../../dashboard/components/FormModal";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type FieldNamesMarkedBoolean,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormHeader from "../../dashboard/components/FormHeader";
import { META_ICONS } from "@/app/icons/MetaIcon";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import AgreeToTermsRow from "../../dashboard/components/AgreeToTermsRow";
import SvgIcon from "@/components/ui/SvgIcon";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import z from "zod";
import { useEffect, useMemo, useState } from "react";
import { StepHeader } from "@/app/components/forms/formStepper";
import { ArrowLeft, X } from "lucide-react";
import { PriceField } from "../../dashboard/components/PriceField";
import { WeightField } from "../../dashboard/components/WeightField";
import toCreateParcelMapper from "../../goods/domain/toCreatParcelMapper";
import { CreateParcelUseCase } from "../application/CreateParcelUseCase";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { SupabaseParcelRepository } from "../data/SupabaseParcelRepository";
import { SupabaseGoodsRepository } from "../../goods/data/SupabaseGoodsRepository";
import { SaveGoodsUseCase } from "../../goods/application/SaveGoodsUseCase";
import type { UserGoods } from "../../goods/domain/UserGoods";
import toGoodsMapper from "../../goods/domain/toGoodsMapper";
import { useToast } from "@/app/components/Toast";
import { AnimatePresence, motion } from "framer-motion";
import { EditParcelUsecase } from "../application/EditParcelUsecase";
import { toParcelDtoMapper } from "../application/toParcelDtoMapper";
import { EditGoodsUsecase } from "../../goods/application/EditGoodsUseCase";
import type { FormValues, GoodsItem } from "@/types/Ui";

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
  weight: z.number().min(1, "Quantity should be 1 or more"),
  pricePerKg: z.number().min(1, "Price should be 1 or more"),

  agreeToRules: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the rules" }),
});

export type ParcelFormFields = z.infer<typeof parcelSchema>;
export type ParcelFormMode = "edit" | "create";

type Step = 1 | 2;

// choose what belongs to each step
const parcelStep1Fields = [
  "originCountry",
  "originCity",
  "goodsCategoryIds",
] as const;

const parcelStep2Fields = [
  "itemDescriptions",
  "weight",
  "pricePerKg",
  "agreeToRules",
] as const;

const emptyDefaultsValues = {
  originCountry: "",
  originCity: "",
  destinationCountry: "Zimbabwe",
  destinationCity: "Harare",
  goodsCategoryIds: [],
  itemDescriptions: [{ quantity: 1, description: "" }],
  weight: 1,
  pricePerKg: 0,
  agreeToRules: false,
};

export default function CreateParcelModal({
  goodsCategory,
  setModalState,
  initialFormValues,
  mode = "create",
}: {
  initialFormValues?: FormValues;
  goodsCategory: GoodsCategory[];
  mode?: ParcelFormMode;
  setModalState: (v: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(1);

  const repo = useMemo(() => new SupabaseParcelRepository(), []);
  const useCase = useMemo(() => new CreateParcelUseCase(repo), [repo]);
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const editParcelUsecase = useMemo(() => new EditParcelUsecase(repo), [repo]);
  const editGoodsUsecase = useMemo(
    () => new EditGoodsUsecase(goodsRepo),
    [goodsRepo],
  );
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    trigger,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<ParcelFormFields>({
    resolver: zodResolver(parcelSchema),
    defaultValues: initialFormValues ?? emptyDefaultsValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedIds = watch("goodsCategoryIds");
  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");
  const priceValue = watch("pricePerKg");
  const weightValue = watch("weight");
  const dividerHeight = "my-0";
  const { refreshProfile } = useAuth();
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
    if (mode === "create") {
      onCreate(values);
    } else {
      onEdit(values);
    }
  };

  const onEdit = async (values: ParcelFormFields) => {
    if (!isEdited(dirtyFields)) {
      toast("No changes were made", { variant: "warning" });
      return;
    }

    if (!initialFormValues?.id) return;
    const { result } = await namedCall(
      "edit parcel",
      editParcelUsecase.execute(
        toParcelDtoMapper(initialFormValues?.id, values, dirtyFields),
      ),
    );

    if (dirtyFields.goodsCategoryIds) {
      const { result } = await namedCall(
        "edit goods",
        editGoodsUsecase.execute(
          values.goodsCategoryIds,
          initialFormValues.id,
          "parcel",
        ),
      );
      if (!result.success) {
        console.log(result.error);
      }
    }

    if (!result.success) {
      console.log(result.error);
      return;
    }
    if (result.success) {
      toast("changes saved successfully", { variant: "success" });
      await refreshProfile();
    }
  };

  const onCreate = async (values: ParcelFormFields) => {
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

  useEffect(() => {
    if (mode === "edit" && initialFormValues) reset(initialFormValues);
    if (mode === "create") reset(emptyDefaultsValues);
  }, [mode, initialFormValues, emptyDefaultsValues]);

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
            heading={`${mode === "edit" ? "Edit parcel" : "Post parcel"}`}
            subHeading={
              "Share your parcel details to get matched with travelers."
            }
            icon={META_ICONS.parcelBox}
          />

          <div className="flex flex-col gap-3">
            <StepHeader currentStep={step} formType="parcel" />
          </div>
          {step === 2 && (
            <motion.span
              className="inline-flex absolute left-5 top-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                type="button"
                variant="neutral"
                onClick={goBack}
                size="sm"
              >
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
    </FormModal>
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

function isEdited(
  dirtyFields: FieldNamesMarkedBoolean<ParcelFormFields>,
): boolean {
  return [
    dirtyFields.destinationCity,
    dirtyFields.destinationCountry,
    dirtyFields.goodsCategoryIds,
    dirtyFields.itemDescriptions,
    dirtyFields.originCity,
    dirtyFields.originCountry,
    dirtyFields.pricePerKg,
    dirtyFields.weight,
  ].some(Boolean);
}
