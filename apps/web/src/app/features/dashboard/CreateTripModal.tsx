import { CreateTripUseCase } from "../trips/application/CreateTripUsecase";
import FormHeader from "./components/FormHeader";
import LineDivider from "@/app/components/LineDivider";
import DateField from "./components/DateField";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useAuthState } from "@/app/shared/supabase/AuthState";
import { SupabaseTripsRepository } from "../trips/data/SupabaseTripsRepository";
import { useMemo } from "react";
import FormModal from "./components/FormModal";
import RouteFieldRow from "./components/RouteFieldRow";
import toCreateTrip from "../goods/domain/toCreateTripMapper";
import { SupabaseGoodsRepository } from "../goods/data/SupabaseGoodsRepository";
import { SaveGoodsUseCase } from "../goods/application/SaveGoodsUseCase";
import type { UserGoods } from "../goods/domain/UserGoods";
import toGoodsMapper from "../goods/domain/toGoodsMapper";
import AgreeToTermsRow from "./components/AgreeToTermsRow";
import ActionBtn from "./components/CreateTripParcelActionBtn";
import GoodsCategoryGrid from "./components/GoodsCategoryGrid";
import PriceField from "./components/PriceField";
import WeightField from "./components/WeightField";

export const tripSchema = z.object({
  originCountry: z.string().min(3, "minimum of three letters is required"),
  originCity: z.string().min(1, "Origin city is required"),
  destinationCountry: z.string().min(3, "minimum of three letters is required"),
  destinationCity: z.string().min(1, "Origin city is required"),

  departureDate: z.string().min(1, "Departure date is required"),

  availableSpace: z
    .number()
    .min(0, "Must be at least 1kg")
    .max(200, "Too large"),

  pricePerKg: z.number().min(0, "Price must be 0 or more"),

  goodsCategoryIds: z.array(z.string()).min(1, "Select at least one category"),

  agreeToRules: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the rules" }),
});

export type FormFields = z.infer<typeof tripSchema>;

export default function CreatTripModal({
  goodsCategory,
  setModalState,
  showToast,
  setToastMessage,
}: {
  goodsCategory: GoodsCategory[];
  showModal: boolean;
  showToast: () => void;
  setModalState: (v: boolean) => void;
  setToastMessage: () => void;
}) {
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const useCase = useMemo(() => new CreateTripUseCase(repo), [repo]);
  const { userId, userLoggedIn } = useAuthState();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, submitCount },
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
  const dividerHeight = "my-0";
  const showErrors = isSubmitting || submitCount > 0;

  const onValid = async (values: FormFields) => {
    if (!userLoggedIn || !userId) return;
    const data = await createTrip(values, userId, useCase, () =>
      setModalState(false),
    );

    try {
      if (!data) return;
      SaveGoodsCategories(saveGoodsUseCase, toGoodsMapper(data, selectedIds));
      setToastMessage();
      showToast();
    } catch (e) {
      console.log(e); // to be completed with a dialogue box
    }
  };

  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");
  return (
    <FormModal
      onSubmit={handleSubmit(onValid)}
      onClose={() => setModalState(false)}
    >
      <FormHeader
        heading={"Post your trip"}
        subHeading={"Share details of your trip to match with senders."}
      />
      <LineDivider heightClass={dividerHeight} />
      <RouteFieldRow
        cityError={errors.originCity?.message}
        countryError={errors.originCountry?.message}
        cityValue={cityValue}
        countryValue={countryValue}
        registerCity={register("originCity")}
        registerCountry={register("originCountry")}
      />
      <LineDivider heightClass={dividerHeight} />
      <DateField
        error={errors.departureDate?.message}
        register={register("departureDate")}
        id="departureDate"
        label="Select your departure date."
      />
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
      <ActionBtn
        isSubmitting={isSubmitting}
        onCancel={() => setModalState(false)}
      />
    </FormModal>
  );
}

async function createTrip(
  values: FormFields,
  userId: string,
  useCase: CreateTripUseCase,
  onCloseModal: () => void,
): Promise<string> {
  try {
    const tripId = await useCase.execute(userId, toCreateTrip(values));
    console.log("Trip saved");
    onCloseModal();
    return tripId; //
  } catch (e) {
    console.log("Saving failed", e);
    throw e;
  }
}

async function SaveGoodsCategories(
  saveGoodsUseCase: SaveGoodsUseCase,
  goods: UserGoods,
) {
  try {
    await saveGoodsUseCase.execute(goods, true);
    console.log("Goods saved");
  } catch (e) {
    console.log(e);
  }
}
