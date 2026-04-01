import type { FormMode, FormValues } from "@/types/Ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import z from "zod";
import { namedCall } from "../../application/NamedCall";
import { toTripDtoMapper } from "@/app/features/trips/application/toTripDtoMapper";
import { SupabaseTripsRepository } from "@/app/features/trips/data/SupabaseTripsRepository";
import { SupabaseGoodsRepository } from "@/app/features/goods/data/SupabaseGoodsRepository";
import { EditTripUsecase } from "@/app/features/trips/application/EditTripUsecase";
import { SaveGoodsUseCase } from "@/app/features/goods/application/SaveGoodsUseCase";
import { EditGoodsUsecase } from "@/app/features/goods/application/EditGoodsUseCase";
import { CreateTripUseCase } from "@/app/features/trips/application/CreateTripUsecase";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { useToast } from "@/app/components/Toast";
import { useUniversalModal } from "../../application/DialogBoxModalProvider";
import toGoodsMapper from "@/app/features/goods/domain/toGoodsMapper";
import type { UserGoods } from "@/app/features/goods/domain/UserGoods";
import toCreateTrip from "@/app/features/goods/domain/toCreateTripMapper";
import { step2Fields } from "@/app/features/trips/ui/CreateTripForm";
import { useNavigate } from "react-router-dom";

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
export type TripFormFields = z.infer<typeof tripSchema>;

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
  const [toDasshboard, setToDashBoard] = useState<boolean>(false);
  const navigate = useNavigate();
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
  const isEditMode = mode === "edit";

  useEffect(() => {
    if (toDasshboard) {
      navigate("/dashboard");
    }
  }, [toDasshboard]);

  useEffect(() => {
    if (isEditMode && initialFormValues) {
      reset(initialFormValues);
    }
    if (mode === "create") reset(emptyDefaultsValues);
  }, [isEditMode, initialFormValues, reset]);

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

  const onCreate = async (values: TripFormFields) => {
    if (!user) return;

    const ok = await trigger(step2Fields, { shouldFocus: true });
    if (!ok) return;

    try {
      const tripId = await createTrip(values, user.id, useCase);
      if (!tripId) return;

      await SaveGoodsCategories(
        saveGoodsUseCase,
        toGoodsMapper(tripId, selectedIds),
      );

      toast("Trip saved successfully", { variant: "success" });
      if (setModalState) {
        setModalState();
      } else {
        setToDashBoard(true);
      }
    } catch (e) {
      showSupabaseError({ code: "error", message: "" });
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
  useCase: CreateTripUseCase,
): Promise<string> {
  const { result } = await namedCall(
    "createTrip",
    useCase.execute(userId, toCreateTrip(values)),
  );

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
    dirtyFields.departureDate,
  ].some(Boolean);
}
