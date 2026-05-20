import type { FormMode, FormValues } from "@/types/Ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { getDestinationDefaultsFromProfile } from "@/app/shared/locations/profileDestinationDefaults";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import z from "zod";
import { toTripDtoMapper } from "@/app/features/trips/application/toTripDtoMapper";
import {
  createTripUseCase,
  editTripUseCase,
  saveGoodsUseCase,
  editGoodsUseCase,
} from "@/app/lib/useCases";
import { useInvalidateTrips } from "@/app/hooks/mutations/useTripMutations";
import type { SaveGoodsUseCase } from "@/app/features/goods/application/SaveGoodsUseCase";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useToast } from "@/app/components/Toast";
import { useUniversalModal } from "../../application/DialogBoxModalProvider";
import toGoodsMapper from "@/app/features/goods/domain/toGoodsMapper";
import type { UserGoods } from "@/app/features/goods/domain/UserGoods";
import toCreateTrip from "@/app/features/goods/domain/toCreateTripMapper";
import { step2Fields } from "@/app/features/trips/ui/CreateTripForm";
import { useNavigate } from "react-router-dom";
import { useMarketplaceActionGuard } from "./useMarketplaceActionGuard";
import { isOtherCitySelection } from "@/app/shared/locations/cityOptions";
import {
  agreeToRulesSchema,
  citySchema,
  countrySchema,
  customCitySchema,
  departureDateSchema,
  goodsCategoriesSchema,
  listingWeightSchema,
  pricePerKgSchema,
} from "@/app/shared/validation/formValidation";

export const tripSchema = z
  .object({
    originCountry: countrySchema,
    originCity: citySchema,
    originCustomCity: customCitySchema,
    destinationCountry: countrySchema,
    destinationCity: citySchema,
    departureDate: departureDateSchema,
    weight: listingWeightSchema,
    pricePerKg: pricePerKgSchema,
    goodsCategoryIds: goodsCategoriesSchema,
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
export type TripFormFields = z.infer<typeof tripSchema>;

const emptyDefaultsValues = {
  originCountry: "",
  originCity: "",
  originCustomCity: "",
  destinationCountry: "",
  destinationCity: "",
  departureDate: "",
  pricePerKg: 10,
  weight: 1,
  goodsCategoryIds: [],
  agreeToRules: false,
};

type ListingFormProps = {
  initialFormValues?: FormValues;
  mode: FormMode;
  setModalState?: () => void;
};

export function useTripForm({
  initialFormValues,
  mode,
  setModalState,
}: ListingFormProps) {
  const invalidateTrips = useInvalidateTrips();
  const [toDasshboard, setToDashBoard] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const createDefaultValues = useMemo(
    () => ({
      ...emptyDefaultsValues,
      ...getDestinationDefaultsFromProfile(profile),
    }),
    [profile?.city, profile?.country, profile?.countryCode],
  );
  const { guardAction } = useMarketplaceActionGuard();
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
    defaultValues: initialFormValues ?? createDefaultValues,
    mode: "onTouched",
  });

  const selectedIds = watch("goodsCategoryIds");
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (toDasshboard) {
      navigate("/dashboard");
    }
  }, [toDasshboard]);

  useEffect(() => {
    if (isEditMode && initialFormValues) {
      reset(initialFormValues);
      return;
    }
    if (mode === "create") {
      reset(createDefaultValues);
    }
  }, [createDefaultValues, initialFormValues, isEditMode, mode, reset]);

  const onSubmit = async (values: TripFormFields) => {
    if (mode === "create") {
      await onCreate(values);
    } else {
      await onEdit(values);
    }
  };

  const onEdit = async (values: TripFormFields) => {
    if (!isEdited(dirtyFields)) {
      toast("No changes were made", { variant: "warning" });
      return;
    }

    if (!initialFormValues?.id) return;
    try {
      await editTripUseCase.execute(
        toTripDtoMapper(initialFormValues?.id, values, dirtyFields),
      );

      if (dirtyFields.goodsCategoryIds) {
        await editGoodsUseCase.execute(
          values.goodsCategoryIds,
          initialFormValues.id,
          "trip",
        );
      }

      toast("Changes saved successfully.", { variant: "success" });
      await refreshProfile();
      await invalidateTrips();
    } catch (err) {
      showSupabaseError(err);
    }
  };

  const onCreate = async (values: TripFormFields) => {
    if (!user) return;
    if (!guardAction(() => undefined, "post_listing")) return;

    const ok = await trigger(step2Fields, { shouldFocus: true });
    if (!ok) return;

    try {
      const tripId = await createTrip(
        values,
        user.id,
        createTripUseCase,
        showSupabaseError,
      );
      if (!tripId) return;

      await SaveGoodsCategories(
        saveGoodsUseCase,
        toGoodsMapper(tripId, selectedIds),
      );

      await invalidateTrips();
      toast("Trip posted successfully.", { variant: "success" });
      if (setModalState) {
        setModalState();
      } else {
        setToDashBoard(true);
      }
    } catch (err) {
      showSupabaseError(err);
    }
  };

  return {
    control,
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    onSubmit,
    selectedIds,
    errors,
    isSubmitting,
    dirtyFields,
    touchedFields,
  };
}

async function createTrip(
  values: TripFormFields,
  userId: string,
  useCase: typeof createTripUseCase,
  showSupabaseError: (err: unknown) => void,
): Promise<string> {
  try {
    return await useCase.execute(userId, toCreateTrip(values));
  } catch (err) {
    showSupabaseError(err);
    return "";
  }
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
    dirtyFields.originCustomCity,
    dirtyFields.originCountry,
    dirtyFields.pricePerKg,
    dirtyFields.departureDate,
  ].some(Boolean);
}
