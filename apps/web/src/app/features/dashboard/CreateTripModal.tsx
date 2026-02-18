import { CreateTripUseCase } from "../trips/application/CreateTripUsecase";
import FormHeader from "./components/FormHeader";
import LineDivider from "@/app/components/LineDivider";
import DateField from "./components/DateField";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z, { transform } from "zod";
import { useAuthState } from "@/app/shared/supabase/AuthState";
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
import PriceField from "./components/PriceField";
import WeightField from "./components/WeightField";
import { useToast } from "@/app/components/Toast";
import { Button } from "@/components/ui/Button";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";

import { StepHeader, type Step } from "@/app/components/forms/formStepper";
import { ArrowLeft, MoveLeft, X } from "lucide-react";

// --- your schema (keep as-is, but fix message typo if you want) ---
export const tripSchema = z.object({
  originCountry: z.string().min(3, "Minimum of three letters is required"),
  originCity: z.string().min(1, "Origin city is required"),
  destinationCountry: z.string().min(3, "Minimum of three letters is required"),
  destinationCity: z.string().min(1, "Destination city is required"),

  departureDate: z.string().min(1, "Departure date is required"),

  availableSpace: z
    .number()
    .min(0, "Must be at least 1kg")
    .max(200, "Too large"),
  pricePerKg: z.number().min(0, "Price must be 0 or more"),

  goodsCategoryIds: z.array(z.string()).min(1, "Select at least one category"),

  agreeToRules: z.boolean().refine((v) => v === true, {
    message: "You must agree to the rules",
  }),
});

export type FormFields = z.infer<typeof tripSchema>;

const step1Fields: Array<keyof FormFields> = [
  "originCountry",
  "originCity",
  "destinationCountry",
  "destinationCity",
  "departureDate",
];

const step2Fields: Array<keyof FormFields> = [
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
  showModal: boolean;
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

  const { userId, userLoggedIn } = useAuthState();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      originCountry: "",
      originCity: "",
      destinationCity: "Harare",
      destinationCountry: "Zimbabwe",
      departureDate: "",
      pricePerKg: 0,
      availableSpace: 1,
      goodsCategoryIds: [],
      agreeToRules: false,
    },
    mode: "onSubmit",
  });

  const selectedIds = watch("goodsCategoryIds");
  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");

  const dividerHeight = "my-0";

  const goNext = async () => {
    // validate only step 1 fields
    const ok = await trigger(step1Fields as any, { shouldFocus: true });
    if (!ok) return;
    setStep(2);
  };

  const goBack = () => setStep(1);

  const onValidSubmit = async (values: FormFields) => {
    if (!userLoggedIn || !userId) return;

    // Optional: ensure step 2 fields are valid before submit
    const ok = await trigger(step2Fields as any, { shouldFocus: true });
    if (!ok) return;

    try {
      const tripId = await createTrip(values, userId, useCase, () =>
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
      step={step}
      onSubmit={handleSubmit(onValidSubmit)}
      onClose={() => setModalState(false)}
    >
      <div className="flex flex-col">
        <FormHeader
          heading={"Post your trip"}
          subHeading={"Share your trip details to get matched with senders."}
        />

        <CloseBackBtn onClose={setModalState} />
      </div>

      <div className="flex flex-col gap-4">
        <LineDivider heightClass={dividerHeight} />
        <StepHeader currentStep={step} />
      </div>
      <LineDivider heightClass={dividerHeight} />

      {step === 1 ? (
        <>
          <RouteFieldRow
            cityError={errors.originCity?.message}
            countryError={errors.originCountry?.message}
            cityValue={cityValue}
            countryValue={countryValue}
            registerCity={register("originCity")}
            registerCountry={register("originCountry")}
            // If you also have destination inputs in this component,
            // wire these too (recommended):
            // registerDestinationCity={register("destinationCity")}
            // registerDestinationCountry={register("destinationCountry")}
            // destinationCityError={errors.destinationCity?.message}
            // destinationCountryError={errors.destinationCountry?.message}
          />

          <LineDivider heightClass={dividerHeight} />

          <DateField
            error={errors.departureDate?.message}
            register={register("departureDate")}
            id="departureDate"
            label="Departure date"
          />

          <LineDivider heightClass={dividerHeight} />

          {/* Step actions */}
          <div className="flex justify-end gap-4 pt-4">
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

          <span className="flex flex-wrap gap-4 sm:gap-20">
            <WeightField
              id="weight"
              register={register("availableSpace", { valueAsNumber: true })}
              error={errors.availableSpace?.message}
            />

            <PriceField
              id="price"
              register={register("pricePerKg", { valueAsNumber: true })}
              error={errors.pricePerKg?.message}
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
              {"Back"}
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              size={"sm"}
            >
              {isSubmitting ? "Posting..." : "Submit"}
            </Button>
          </div>
        </>
      )}
    </FormModal>
  );
}

// --- keep your helpers but I fixed a tiny await + naming ---
async function createTrip(
  values: FormFields,
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

type CloseBackBtnProps = {
  onClose: (b: boolean) => void;
};

function CloseBackBtn({ onClose }: CloseBackBtnProps) {
  return (
    <div className="absolute top-3 right-4">
      <button
        type="button"
        onClick={() => onClose(false)}
        className="flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all p-1 rounded-md hover:-translate-y-0.5"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
