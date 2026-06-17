import z from "zod";
import { useUniversalModal } from "../../application/DialogBoxModalProvider";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import {
  FIXED_DESTINATION_CITY,
  FIXED_DESTINATION_COUNTRY,
} from "@/app/shared/locations/fixedDestination";
import {
  getDestinationDefaultsFromProfile,
  getOriginDefaultsFromProfile,
} from "@/app/shared/locations/profileDestinationDefaults";
import { useLocations } from "@/app/hookes/useLocation";
import {
  createParcelUseCase,
  editParcelUseCase,
  saveGoodsUseCase,
  editGoodsUseCase,
} from "@/app/lib/useCases";
import { useInvalidateParcels } from "@/app/hooks/mutations/useParcelMutations";
import type { SaveGoodsUseCase } from "@/app/features/goods/application/SaveGoodsUseCase";
import { notifyActorSuggestedMatches } from "@/app/features/listings/application/notifyActorSuggestedMatches";
import { processMatchAlertEmailQueue } from "@/app/features/listings/application/processMatchAlertEmailQueue";
import type { CreateParcelUseCase } from "@/app/features/parcels/application/CreateParcelUseCase";
import type { UserGoods } from "@/app/features/goods/domain/UserGoods";
import toCreateParcelMapper from "@/app/features/goods/domain/toCreatParcelMapper";
import type { FormMode, FormValues } from "@/types/Ui";
import { normalizeGoodsItem } from "@/app/components/GoodsManifestTable";
import { toParcelDtoMapper } from "@/app/features/parcels/application/toParcelDtoMapper";
import { useToast } from "@/app/components/Toast";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import {
  parcelStep1Fields,
  parcelStep2Fields,
  parcelStep3Fields,
  parcelStep4Fields,
} from "@/app/features/parcels/ui/parcelFormSteps";
import toGoodsMapper from "@/app/features/goods/domain/toGoodsMapper";
import { useNavigate } from "react-router-dom";
import { useMarketplaceActionGuard } from "./useMarketplaceActionGuard";
import { isOtherCitySelection } from "@/app/shared/locations/cityOptions";
import {
  citySchema,
  confirmNoProhibitedItemsSchema,
  understandTravelerInspectionSchema,
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
    confirmNoProhibitedItems: confirmNoProhibitedItemsSchema,
    understandTravelerInspection: understandTravelerInspectionSchema,
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
  destinationCountry: FIXED_DESTINATION_COUNTRY,
  destinationCity: FIXED_DESTINATION_CITY,
  goodsCategoryIds: [],
  itemDescriptions: [
    { quantity: 1, description: "", size: "", condition: "new" as const },
  ],
  weight: 0,
  pricePerKg: 0,
  confirmNoProhibitedItems: false,
  understandTravelerInspection: false,
};

type UseParcelFormProps = {
  mode: FormMode;
  initialFormValues?: FormValues;
  setModalState?: () => void;
  returnPath?: string;
};

export default function useParcelForm({
  mode,
  initialFormValues,
  setModalState,
  returnPath,
}: UseParcelFormProps) {
  const invalidateParcels = useInvalidateParcels();
  const { showSupabaseError, openInfo } = useUniversalModal();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const { data: locations } = useLocations();
  const createDefaultValues = useMemo(
    () => ({
      ...emptyDefaultsValues,
      ...getDestinationDefaultsFromProfile(),
      ...getOriginDefaultsFromProfile(profile, locations),
    }),
    [profile, locations],
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

      processMatchAlertEmailQueue("parcel", initialFormValues.id);
      if (user?.id) {
        void notifyActorSuggestedMatches(
          user.id,
          "parcel",
          initialFormValues.id,
          "edit",
          openInfo,
          navigate,
        );
      }
      await refreshProfile();
      await invalidateParcels();

      if (returnPath) {
        navigate(returnPath);
      }
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const onCreate = async (values: ParcelFormFields) => {
    if (!user) return;
    if (!guardAction(() => undefined, "post_listing")) return;

    const ok = await trigger(
      [
        ...parcelStep1Fields,
        ...parcelStep2Fields,
        ...parcelStep3Fields,
        ...parcelStep4Fields,
      ] as (keyof ParcelFormFields)[],
      { shouldFocus: true },
    );
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

      processMatchAlertEmailQueue("parcel", parcelId);
      if (user?.id) {
        void notifyActorSuggestedMatches(
          user.id,
          "parcel",
          parcelId,
          "create",
          openInfo,
          navigate,
        );
      }

      await invalidateParcels();
      if (setModalState) {
        setModalState();
      } else if (returnPath) {
        navigate(returnPath);
      } else {
        setToDashBoard(true);
      }
    } catch (err) {
      showSupabaseError(err);
    }
  };

  useEffect(() => {
    if (mode === "edit" && initialFormValues) {
      reset({
        ...initialFormValues,
        itemDescriptions: initialFormValues.itemDescriptions.map((item) =>
          normalizeGoodsItem(item),
        ),
        confirmNoProhibitedItems:
          initialFormValues.confirmNoProhibitedItems ?? false,
        understandTravelerInspection:
          initialFormValues.understandTravelerInspection ?? false,
      });
      return;
    }
    if (mode === "create") {
      reset(createDefaultValues, { keepDirtyValues: true });
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
