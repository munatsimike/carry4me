import z from "zod";
import { useUniversalModal } from "../../application/DialogBoxModalProvider";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { getDestinationDefaultsFromProfile } from "@/app/shared/locations/profileDestinationDefaults";
import {
  createParcelUseCase,
  editParcelUseCase,
  saveGoodsUseCase,
  editGoodsUseCase,
} from "@/app/lib/useCases";
import { useInvalidateParcels } from "@/app/hooks/mutations/useParcelMutations";
import type { SaveGoodsUseCase } from "@/app/features/goods/application/SaveGoodsUseCase";
import type { CreateParcelUseCase } from "@/app/features/parcels/application/CreateParcelUseCase";
import type { UserGoods } from "@/app/features/goods/domain/UserGoods";
import toCreateParcelMapper from "@/app/features/goods/domain/toCreatParcelMapper";
import type { FormMode, FormValues } from "@/types/Ui";
import { toParcelDtoMapper } from "@/app/features/parcels/application/toParcelDtoMapper";
import { useToast } from "@/app/components/Toast";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { parcelStep2Fields } from "@/app/features/parcels/ui/CreateParcelForm";
import toGoodsMapper from "@/app/features/goods/domain/toGoodsMapper";
import { useNavigate } from "react-router-dom";
import { useMarketplaceActionGuard } from "./useMarketplaceActionGuard";
import { isOtherCitySelection } from "@/app/shared/locations/cityOptions";
import {
  agreeToRulesSchema,
  citySchema,
  countrySchema,
  customCitySchema,
  goodsCategoriesSchema,
  listingWeightSchema,
  parcelItemSchema,
  pricePerKgSchema,
} from "@/app/shared/validation/formValidation";

const parcelSchema = z
  .object({
    originCountry: countrySchema,
    originCity: citySchema,
    originCustomCity: customCitySchema,
    destinationCountry: countrySchema,
    destinationCity: citySchema,
    goodsCategoryIds: goodsCategoriesSchema,
    itemDescriptions: z
      .array(parcelItemSchema)
      .min(1, "Enter item quantity and description"),
    weight: listingWeightSchema,
    pricePerKg: pricePerKgSchema,
    agreeToRules: agreeToRulesSchema,
  })
  .superRefine((data, ctx) => {
    if (
      isOtherCitySelection(data.originCity) &&
      !data.originCustomCity.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["originCustomCity"],
        message: "Enter your city",
      });
    }
  });

export type ParcelFormFields = z.infer<typeof parcelSchema>;

const emptyDefaultsValues = {
  originCountry: "",
  originCity: "",
  originCustomCity: "",
  destinationCountry: "",
  destinationCity: "",
  goodsCategoryIds: [],
  itemDescriptions: [{ quantity: 1, description: "" }],
  weight: 1,
  pricePerKg: 0,
  agreeToRules: false,
};

type UseParcelFormProps = {
  mode: FormMode;
  initialFormValues?: FormValues;
  setModalState?: () => void;
};

export default function useParcelForm({
  mode,
  initialFormValues,
  setModalState,
}: UseParcelFormProps) {
  const invalidateParcels = useInvalidateParcels();
  const { showSupabaseError } = useUniversalModal();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const createDefaultValues = useMemo(
    () => ({
      ...emptyDefaultsValues,
      ...getDestinationDefaultsFromProfile(profile),
    }),
    [profile?.city, profile?.country, profile?.countryCode],
  );
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
    defaultValues: initialFormValues ?? createDefaultValues,
    mode: "onTouched",
  });
  const { guardAction } = useMarketplaceActionGuard();
  const selectedIds = watch("goodsCategoryIds");
  const [toDasshboard, setToDashBoard] = useState<boolean>(false);
  const navigate = useNavigate();

  const onSubmit = async (values: ParcelFormFields) => {
    if (mode === "create") {
      onCreate(values);
    } else {
      onEdit(values);
    }
  };

  useEffect(() => {
    if (toDasshboard) {
      navigate("/dashboard");
    }
  }, [toDasshboard]);

  const onEdit = async (values: ParcelFormFields) => {
    if (!isEdited(dirtyFields)) {
      toast("No changes were made", { variant: "warning" });
      return;
    }

    if (!initialFormValues?.id) return;
    try {
      await editParcelUseCase.execute(
        toParcelDtoMapper(initialFormValues?.id, values, dirtyFields),
      );

      if (dirtyFields.goodsCategoryIds) {
        await editGoodsUseCase.execute(
          values.goodsCategoryIds,
          initialFormValues.id,
          "parcel",
        );
      }

      toast("Changes saved successfully.", { variant: "success" });
      await refreshProfile();
      await invalidateParcels();
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const onCreate = async (values: ParcelFormFields) => {
    if (!user) return;
    if (!guardAction(() => undefined, "post_listing")) return;

    const ok = await trigger(parcelStep2Fields, { shouldFocus: true });
    if (!ok) return;

    try {
      const parcelId = await createParcel(
        values,
        user.id,
        createParcelUseCase,
        showSupabaseError,
      );

      if (!parcelId) return;

      await SaveGoodsCategories(
        saveGoodsUseCase,
        toGoodsMapper(parcelId, selectedIds),
      );
      await invalidateParcels();
      if (setModalState) {
        setModalState();
      } else {
        setToDashBoard(true);
      }
      toast("Parcel posted successfully.", { variant: "success" });
    } catch (err) {
      showSupabaseError(err);
    }
  };

  useEffect(() => {
    if (mode === "edit" && initialFormValues) {
      reset(initialFormValues);
      return;
    }
    if (mode === "create") {
      reset(createDefaultValues);
    }
  }, [createDefaultValues, initialFormValues, mode, reset]);

  return {
    selectedIds,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    control,
    trigger,
    onSubmit,
    errors,
    isSubmitting,
    dirtyFields,
    touchedFields,
  };
}

async function createParcel(
  values: ParcelFormFields,
  userId: string,
  useCase: CreateParcelUseCase,
  showSupabaseError: (err: unknown) => void,
): Promise<string> {
  try {
    return await useCase.execute(toCreateParcelMapper(userId, values));
  } catch (err) {
    showSupabaseError(err);
    return "";
  }
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
    dirtyFields.originCustomCity,
    dirtyFields.originCountry,
    dirtyFields.pricePerKg,
    dirtyFields.weight,
  ].some(Boolean);
}
