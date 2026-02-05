import FloatingInputField from "@/app/components/CustomInputField";
import LineDivider from "@/app/components/LineDivider";
import { Button } from "@/components/ui/Button";
import CustomText from "@/components/ui/CustomText";
import FormModal from "./components/FormModal";
import z, { number } from "zod";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type UseFormRegisterReturn,
  type UseFormSetError,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupabaseParcelRepository } from "../parcels/data/SupabaseParcelRepository";
import { useMemo, useState } from "react";
import { CreateParcelUseCase } from "../parcels/application/CreateParcelUseCase";
import type { CreateParcel, ParcelItem } from "../parcels/domain/CreateParcel";
import { useAuthState } from "@/app/shared/supabase/AuthState";
import FormHeader from "./components/FormHeader";
import { META_ICONS } from "@/app/icons/MetaIcon";
import RouteFieldRow from "./components/RouteFieldRow";
import AgreeToTermsRow from "./components/AgreeToTermsRow";
import ActionBtn from "./components/CreateTripParcelActionBtn";
import SvgIcon from "@/components/ui/SvgIcon";
import GoodsCategoryGrid from "./components/GoodsCategoryGrid";
import type { GoodsCategory } from "../goods/domain/GoodsCategory";
import { SaveGoodsUseCase } from "../goods/application/SaveGoodsUseCase";
import type { UserGoods } from "../goods/domain/UserGoods";
import { SupabaseGoodsRepository } from "../goods/data/SupabaseGoodsRepository";
import toGoodsMapper from "../goods/domain/toGoodsMapper";
import WeightField from "./components/WeightField";
import PriceField from "./components/PriceField";
import toCreateParcelMapper from "../goods/domain/toCreatParcelMapper";

export const parcelItemSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
  description: z.string().trim().min(1, "Item description is required"),
});

const parcelSchema = z.object({
  originCountry: z.string().min(3, "minimum of three letters is required"),
  originCity: z.string().min(1, "Origin city is required"),
  destinationCountry: z.string().min(3, "minimum of three letters is required"),
  destinationCity: z.string().min(1, "Origin city is required"),
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

export default function CreatParcelModal({
  goodsCategory,
  setModalState,
}: {
  goodsCategory: GoodsCategory[];
  showModal: boolean;
  setModalState: (v: boolean) => void;
}) {
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );

  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const creteParceUseCase = useMemo(
    () => new CreateParcelUseCase(parcelRepo),
    [parcelRepo],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ParcelFormFields>({
    resolver: zodResolver(parcelSchema),
    defaultValues: {
      originCountry: "",
      originCity: "",
      totalPrice: 0,
      totalWeight: 0,
      destinationCity: "Harare",
      destinationCountry: "Zimbabwe",
      goodsCategoryIds: [],
      itemDescriptions: [{ quantity: 1, description: "" }],
      agreeToRules: false,
    },
    mode: "onSubmit",
  });

  const countryValue = watch("originCountry");
  const cityValue = watch("originCity");
  const selectedIds = watch("goodsCategoryIds");
  const { userId, userLoggedIn } = useAuthState();
  const dividerHeight = "my-0";

  const onInvalid = (errors: FieldErrors<ParcelFormFields>) => {
    console.log("Form errors:", errors);
  };
  const onValid = async (values: ParcelFormFields) => {
    try {
      if (userId && userLoggedIn) {
        const data = await creteParceUseCase.execute(
          toCreateParcelMapper(userId, values),
        );
        SaveGoodsCategories(saveGoodsUseCase, toGoodsMapper(data, selectedIds));
        console.log("Parcel created");
        setModalState(false);
      }
    } catch (e) {
      console.log(e);
    }
  };

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
  return (
    <FormModal
      onSubmit={handleSubmit(onValid, onInvalid)}
      onClose={() => setModalState(false)}
    >
      <FormHeader
        heading={"Post a parcel"}
        subHeading={"Share your parcel details to match with travelers."}
        icon={META_ICONS.parcelBox}
      />
      <LineDivider heightClass={dividerHeight} />
      <RouteFieldRow
        countryError={errors.originCountry?.message}
        cityError={errors.originCity?.message}
        cityValue={cityValue}
        countryValue={countryValue}
        registerCity={register("originCity")}
        registerCountry={register("originCountry")}
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
      <DescriptionQuantityRow
        errors={errors}
        fields={fields}
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
        />
        <PriceField
          id="price"
          error={errors.totalPrice?.message}
          register={register("totalPrice", { valueAsNumber: true })}
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
              {<SvgIcon size={"sm"} Icon={META_ICONS.addAccount} />}
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

async function SaveGoodsCategories(
  saveGoodsUseCase: SaveGoodsUseCase,
  goods: UserGoods,
) {
  try {
    await saveGoodsUseCase.execute(goods, false);
    console.log("Goods saved");
  } catch (e) {
    console.log(e);
  }
}
