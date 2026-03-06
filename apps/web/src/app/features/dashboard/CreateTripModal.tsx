import { CreateTripUseCase } from "../trips/application/CreateTripUsecase";
import FormHeader from "./components/FormHeader";
import LineDivider from "@/app/components/LineDivider";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { SupabaseTripsRepository } from "../trips/data/SupabaseTripsRepository";
import { useMemo, useState } from "react";
import FormModal from "./components/FormModal";
import RouteFieldRow from "./components/RouteFieldRow";
import toCreateTrip from "../goods/domain/toCreateTripMapper";
import { SupabaseGoodsRepository } from "../goods/data/SupabaseGoodsRepository";
import { SaveGoodsUseCase } from "../goods/application/SaveGoodsUseCase";
import type { UserGoods } from "../goods/domain/UserGoods";
import toGoodsMapper from "../goods/domain/toGoodsMapper";
import AgreeToTermsRow from "./components/AgreeToTermsRow";
import GoodsCategoryGrid from "./components/GoodsCategoryGrid";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { StepHeader, type Step } from "@/app/components/forms/formStepper";
import { DateField } from "./components/DateField";
import { WeightField } from "./components/WeightField";
import { PriceField } from "./components/PriceField";
import CustomText from "@/components/ui/CustomText";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// --- your schema (keep as-is, but fix message typo if you want) ---
export const tripSchema = z.object({
  originCountry: z.string().min(3, "Country is required"),
  originCity: z.string().min(1, "City is required"),
  destinationCountry: z.string().min(3, "Minimum of three letters is required"),
  destinationCity: z.string().min(1, "Destination city is required"),

  departureDate: z.string().min(1, "Departure date is required"),

  availableSpace: z
    .number()
    .min(1, "Must be at least 1kg")
    .max(200, "Too large"),
  pricePerKg: z.number().min(0, "Price must be 0 or more"),

  goodsCategoryIds: z.array(z.string()).min(1, "Select at least one category"),

  agreeToRules: z.boolean().refine((v) => v === true, {
    message: "You must agree to the rules",
  }),
});

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
  "availableSpace",
  "pricePerKg",
  "agreeToRules",
];

export default function CreateTripModal({
  goodsCategory,
  setModalState,
}: {
  goodsCategory: GoodsCategory[];
  setModalState: (v: boolean) => void;
}) {
  const [step, setStep] = useState<Step>(1);

  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const useCase = useMemo(() => new CreateTripUseCase(repo), [repo]);

  const { user } = useAuth();
  const { toast } = useToast();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting, dirtyFields, touchedFields },
  } = useForm<TripFormFields>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      originCountry: "",
      originCity: "",
      destinationCity: "Harare",
      destinationCountry: "Zimbabwe",
      departureDate: "",
      pricePerKg: 10,
      availableSpace: 1,
      goodsCategoryIds: [],
      agreeToRules: false,
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const selectedIds = watch("goodsCategoryIds");
  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");
  const weightValue = watch("availableSpace");
  const priceValue = watch("pricePerKg");

  const dividerHeight = "";

  const goNext = async () => {
    // validate only step 1 fields
    const ok = await trigger(step1Fields, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const goBack = () => setStep(1);

  const onValidSubmit = async (values: TripFormFields) => {
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
      console.log(e); // replace later with modal/toast
    }
  };

  return (
    <FormModal
      onSubmit={handleSubmit(onValidSubmit)}
      onClose={() => setModalState(false)}
    >
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-5">
          <FormHeader
            heading={"Post your trip"}
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
                <span className="inline-flex gap-1 items-center">
                  <ArrowLeft className="w-4" /> {"Back"}
                </span>
              </Button>
            </span>
          )}
        </div>

        {step === 1 ? (
          <div className="flex flex-col gap-5">
            <LineDivider heightClass={dividerHeight} />
            <RouteFieldRow
              cityError={errors.originCity?.message}
              countryError={errors.originCountry?.message}
              cityValue={cityValue}
              countryValue={countryValue}
              registerCity={register("originCity")}
              registerCountry={register("originCountry")}
              isCountryDirty={!!dirtyFields.originCountry}
              isCountryTouched={!!dirtyFields.originCountry}
              isCityDirty={!!dirtyFields.originCity}
              isCityTouched={!!touchedFields.originCity}
              // If you also have destination inputs in this component,
              // wire these too (recommended):
              // registerDestinationCity={register("destinationCity")}
              // registerDestinationCountry={register("destinationCountry")}
              // destinationCityError={errors.destinationCity?.message}
              // destinationCountryError={errors.destinationCountry?.message}
            />

            <LineDivider heightClass={dividerHeight} />

            <DateField<TripFormFields>
              error={errors.departureDate?.message}
              control={control}
              name={"departureDate"}
              placeholder="dd/mm/yyyy"
              fromDate={new Date()}
              isDirty={!!dirtyFields.departureDate}
              isTouched={!!touchedFields.departureDate}
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
                setValue("goodsCategoryIds", next, { shouldValidate: true })
              }
            />

            <LineDivider heightClass={dividerHeight} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[20px]">
              {/* Available Space */}
              <WeightField<TripFormFields>
                id="weight"
                register={register("availableSpace", { valueAsNumber: true })}
                error={errors.availableSpace?.message}
                isDirty={!!dirtyFields.availableSpace}
                isTouched={!!touchedFields.availableSpace}
                name="availableSpace"
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
                {isSubmitting ? "Posting..." : "Post trip"}
              </Button>
            </div>
          </>
        )}
      </div>
    </FormModal>
  );
}

// --- keep your helpers but I fixed a tiny await + naming ---
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
    console.log("");
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
