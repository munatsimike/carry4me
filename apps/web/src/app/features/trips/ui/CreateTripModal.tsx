import { CreateTripUseCase } from "../application/CreateTripUsecase";
import FormHeader from "../../dashboard/components/FormHeader";
import LineDivider from "@/app/components/LineDivider";
import type { GoodsCategory } from "../../goods/domain/GoodsCategory";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { useEffect, useMemo, useState } from "react";
import FormModal from "../../dashboard/components/FormModal";
import RouteFieldRow from "../../dashboard/components/RouteFieldRow";
import toCreateTrip from "../../goods/domain/toCreateTripMapper";
import { SupabaseGoodsRepository } from "../../goods/data/SupabaseGoodsRepository";
import { SaveGoodsUseCase } from "../../goods/application/SaveGoodsUseCase";
import type { UserGoods } from "../../goods/domain/UserGoods";
import toGoodsMapper from "../../goods/domain/toGoodsMapper";
import AgreeToTermsRow from "../../dashboard/components/AgreeToTermsRow";
import GoodsCategoryGrid from "../../dashboard/components/GoodsCategoryGrid";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { StepHeader, type Step } from "@/app/components/forms/formStepper";
import { DateField } from "../../dashboard/components/DateField";
import { WeightField } from "../../dashboard/components/WeightField";
import { PriceField } from "../../dashboard/components/PriceField";
import CustomText from "@/components/ui/CustomText";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { FormMode, FormValues } from "@/types/Ui";
import { EditGoodsUsecase } from "../../goods/application/EditGoodsUseCase";
import { toTripDtoMapper } from "../application/toTripDtoMapper";
import { EditTripUsecase } from "../application/EditTripUsecase";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";

// --- your schema (keep as-is, but fix message typo if you want) ---
export const tripSchema = z.object({
  originCountry: z.string().min(3, "Country is required"),
  originCity: z.string().min(1, "City is required"),
  destinationCountry: z.string().min(3, "Minimum of three letters is required"),
  destinationCity: z.string().min(1, "Destination city is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  weight: z.number().min(1, "Must be at least 1kg").max(200, "Too large"),
  pricePerKg: z.number().min(0, "Price must be 0 or more"),
  goodsCategoryIds: z.array(z.string()).min(1, "Select at least one category"),
  agreeToRules: z.boolean().refine((v) => v === true, {
    message: "You must agree to the rules",
  }),
});

const emptyDefaultsValues = {
  originCountry: "",
  originCity: "",
  destinationCity: "Harare",
  destinationCountry: "Zimbabwe",
  departureDate: "",
  pricePerKg: 10,
  weight: 1,
  goodsCategoryIds: [],
  agreeToRules: false,
};

export type TripFormFields = z.infer<typeof tripSchema>;

const step1Fields: Array<keyof TripFormFields> = [
  "originCountry",
  "originCity",
  "destinationCountry",
  "destinationCity",
  "departureDate",
];

const step2Fields: Array<keyof TripFormFields> = [
  "goodsCategoryIds",
  "weight",
  "pricePerKg",
  "agreeToRules",
];

export default function CreateTripModal({
  mode = "create",
  goodsCategory,
  setModalState,
  initialFormValues,
}: {
  goodsCategory: GoodsCategory[];
  setModalState: (v: boolean) => void;
  initialFormValues?: FormValues;
  mode?: FormMode;
}) {
  const [step, setStep] = useState<Step>(1);
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const editTripUsecase = useMemo(() => new EditTripUsecase(repo), [repo]);
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );
  const editGoodsUsecase = useMemo(
    () => new EditGoodsUsecase(goodsRepo),
    [goodsRepo],
  );
  const useCase = useMemo(() => new CreateTripUseCase(repo), [repo]);

  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const { showSupabaseError } = useUniversalModal();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<TripFormFields>({
    resolver: zodResolver(tripSchema),
    defaultValues: initialFormValues ?? emptyDefaultsValues,
    mode: "onTouched",
  });

  const selectedIds = watch("goodsCategoryIds");
  const weightValue = watch("weight");
  const priceValue = watch("pricePerKg");

  const dividerHeight = "";
  const isEditMode = mode === "edit";
  useEffect(() => {
    if (isEditMode && initialFormValues) {
      reset(initialFormValues);
    }
    if (mode === "create") reset(emptyDefaultsValues);
  }, [mode, initialFormValues, emptyDefaultsValues]);

  const goNext = async () => {
    // validate only step 1 fields
    const ok = await trigger(step1Fields, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const onSubmit = async (values: TripFormFields) => {
    if (mode === "create") {
      onCreate(values);
    } else {
      onEdit(values);
    }
  };

  const onEdit = async (values: TripFormFields) => {
    if (!isEdited(dirtyFields)) {
      toast("No changes were made", { variant: "warning" });
      return;
    }

    if (!initialFormValues?.id) return;
    const { result: tripResult } = await namedCall(
      "edit trip",
      editTripUsecase.execute(
        toTripDtoMapper(initialFormValues?.id, values, dirtyFields),
      ),
    );

    if (!tripResult.success) {
      showSupabaseError(tripResult.error);
      return;
    }

    if (dirtyFields.goodsCategoryIds) {
      const { result } = await namedCall(
        "edit goods",
        editGoodsUsecase.execute(
          values.goodsCategoryIds,
          initialFormValues.id,
          "trip",
        ),
      );
      if (!result.success) {
        showSupabaseError(result.error);
        return;
      }
    }
    if (tripResult.success) {
      toast("changes saved successfully", { variant: "success" });
      await refreshProfile();
    }
  };

  const goBack = () => setStep(1);

  const onCreate = async (values: TripFormFields) => {
    if (!user) return;

    const ok = await trigger(step2Fields, { shouldFocus: true });
    if (!ok) return;

    try {
      const tripId = await createTrip(values, user.id, useCase, () =>
        setModalState(false),
      );
      if (!tripId) return;

      await SaveGoodsCategories(
        saveGoodsUseCase,
        toGoodsMapper(tripId, selectedIds),
      );

      toast("Trip saved successfully", { variant: "success" });
    } catch (e) {
      showSupabaseError({ code: "error", message: "" });
    }
  };

  return (
    <FormModal
      onSubmit={handleSubmit(onSubmit)}
      onClose={() => setModalState(false)}
    >
      <div className="flex flex-col gap-4">
        <div className="relative flex flex-col gap-5">
          <FormHeader
            heading={isEditMode ? "Edit trip" : "Post your trip"}
            subHeading={"Share your trip details to get matched with senders."}
          />
          <StepHeader currentStep={step} />
          {step === 2 && (
            <span className="inline-flex absolute left-0 top-0">
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
          <>
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
          </>
        )}
      </div>
    </FormModal>
  );
}

async function createTrip(
  values: TripFormFields,
  userId: string,
  useCase: CreateTripUseCase,
  onCloseModal: () => void,
): Promise<string> {
  const { result } = await namedCall(
    "createTrip",
    useCase.execute(userId, toCreateTrip(values)),
  );
  onCloseModal();

  if (!result.success) {
    return "";
  }

  return result.data;
}

async function SaveGoodsCategories(
  saveGoodsUseCase: SaveGoodsUseCase,
  goods: UserGoods,
) {
  await saveGoodsUseCase.execute(goods, true);
}

function isEdited(
  dirtyFields: FieldNamesMarkedBoolean<TripFormFields>,
): boolean {
  return [
    dirtyFields.destinationCity,
    dirtyFields.destinationCountry,
    dirtyFields.weight,
    dirtyFields.goodsCategoryIds,
    dirtyFields.originCity,
    dirtyFields.originCountry,
    dirtyFields.pricePerKg,
    dirtyFields.weight,
  ].some(Boolean);
}
