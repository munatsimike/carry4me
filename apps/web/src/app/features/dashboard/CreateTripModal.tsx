import { CreateTripUseCase } from "../trips/application/CreateTripUsecase";
import type { CreateTrip } from "../trips/domain/CreateTrip";
import FormHeader from "./components/FormHeader";
import LineDivider from "@/app/components/LineDivider";
import DateField from "./components/DateField";
import { InlineRow } from "@/app/components/InlineRow";
import { baseInput, cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import CheckBox from "@/app/components/CheckBox";
import { Button } from "@/components/ui/Button";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import ErrorText from "@/app/components/text/ErrorText";
import { useAuthState } from "@/app/shared/supabase/AuthState";
import { SupabaseTripsRepository } from "../trips/data/SupabaseTripsRepository";
import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import FormModal from "./components/FormModal";
import RouteFieldRow from "./components/RouteFieldRow";

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
}: {
  goodsCategory: GoodsCategory[];
  showModal: boolean;
  setModalState: (v: boolean) => void;
}) {
  const repo = useMemo(() => new SupabaseTripsRepository(), []);
  const useCase = useMemo(() => new CreateTripUseCase(repo), [repo]);
  const { userId, userLoggedIn } = useAuthState();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const dividerHeight = "my-0";

  const onValid = async (values: FormFields) => {
    if (!userLoggedIn || !userId) return;
    await createTrip(values, userId, useCase, () => setModalState(false));
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

      <WeightField
        id="weight"
        register={register("availableSpace", { valueAsNumber: true })}
        error={errors.availableSpace?.message}
      />
      <LineDivider heightClass={dividerHeight} />

      <GoodsCategory
        error={errors.goodsCategoryIds?.message}
        goods={goodsCategory}
        selectedIds={selectedIds}
        onChange={(next) =>
          setValue("goodsCategoryIds", next, { shouldValidate: true })
        }
      />
      <LineDivider heightClass={dividerHeight} />
      <PriceField
        id="price"
        register={register("pricePerKg", { valueAsNumber: true })}
        error={errors.pricePerKg?.message}
      />
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

function PriceField({
  register,
  id,
  error,
}: {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <CustomText textSize="xsm">{"Price per kg"}</CustomText>
        {
          <input
            type="number"
            id={id}
            className={cn(`w-full sm:w-[100px] py-2 px-2 ${baseInput}`)}
            {...register}
          />
        }
      </div>
      {error && <ErrorText error={error} />}
    </div>
  );
}

function ActionBtn({
  isSubmitting,
  onCancel,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between px-2 gap-2">
      <Button
        type="button"
        onClick={onCancel}
        className="w-full sm:w-auto"
        variant="neutral"
        size="md"
      >
        <CustomText className="px-6" textVariant="secondary">
          Cancel
        </CustomText>
      </Button>

      <Button
        form="tripForm"
        disabled={isSubmitting}
        type="submit"
        className="w-full sm:w-auto"
        variant="primary"
        size="md"
      >
        <CustomText textVariant="onDark">
          {isSubmitting ? "Posting..." : "Review & Post"}
        </CustomText>
      </Button>
    </div>
  );
}

type AgreeToTermsProps = {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
};

function AgreeToTermsRow({ register, id, error }: AgreeToTermsProps) {
  return (
    <div>
      <div className="flex flex-col">
        <div className="flex gap-3">
          <CheckBox register={register} id={id}></CheckBox>
          <CustomText textVariant="formText">
            {"I agree to the terms and conditions."}
          </CustomText>
        </div>
      </div>
      {error && <ErrorText error={error} />}
    </div>
  );
}

function GoodsCategory({
  goods,
  selectedIds,
  onChange,
  error,
}: {
  error?: string;
  goods: GoodsCategory[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}) {
  const toggle = (id: string, checked: boolean) => {
    const next = checked
      ? [...selectedIds, id]
      : selectedIds.filter((x) => x !== id);

    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-col gap-2">
        <InlineRow>
          <CustomText textSize="xsm">
            {"What items do you prefer to carry?"}
          </CustomText>
        </InlineRow>

        <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          {goods.map((item) => {
            const checked = selectedIds.includes(item.id);

            return (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded-lg border p-2 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                />
                <CustomText textSize="xsm" textVariant="formText">
                  {item.name}
                </CustomText>
              </label>
            );
          })}
        </div>
      </div>
      {error && <ErrorText error={error} />}
    </div>
  );
}

function WeightField({
  id,
  register,
  error,
}: {
  id: string;
  error?: string;
  register: UseFormRegisterReturn;
}) {
  return (
    <div>
      <div className="flex flex-col gap-2">
        <label id={id} htmlFor="weight">
          {<CustomText textSize="xsm">{"Available space."}</CustomText>}
        </label>
        <InlineRow>
          {
            <input
              type="number"
              id={id}
              className={cn(`w-full sm:w-[100px] py-2 px-2 ${baseInput}`)}
              {...register}
            ></input>
          }
          <CustomText textSize="xsm">{"Kg"}</CustomText>
        </InlineRow>
      </div>
      {error && <ErrorText error={error} />}
    </div>
  );
}

async function createTrip(
  values: FormFields,
  userId: string,
  useCase: CreateTripUseCase,
  onCloseModal: () => void,
) {
  try {
    await useCase.execute(userId, toCreateTrip(values));
    console.log("Trip saved");
    onCloseModal();
  } catch (e) {
    console.log("Saving failed", e);
  }
}

function toCreateTrip(formValues: FormFields): CreateTrip {
  return {
    originCountry: formValues.originCountry,
    originCity: formValues.originCity,
    destinationCountry: formValues.destinationCountry,
    destinationCity: formValues.destinationCity,
    departureDate: formValues.departureDate,
    arrivalDate: null,
    capacityKg: formValues.availableSpace,
    pricePerKg: formValues.pricePerKg,
  };
}
