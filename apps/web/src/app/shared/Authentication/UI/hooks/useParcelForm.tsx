import z from "zod";
import { useUniversalModal } from "../../application/DialogBoxModalProvider";
import { useForm, type FieldNamesMarkedBoolean } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SupabaseParcelRepository } from "@/app/features/parcels/data/SupabaseParcelRepository";
import { CreateParcelUseCase } from "@/app/features/parcels/application/CreateParcelUseCase";
import { SupabaseGoodsRepository } from "@/app/features/goods/data/SupabaseGoodsRepository";
import { EditParcelUsecase } from "@/app/features/parcels/application/EditParcelUsecase";
import { useEffect, useMemo, useState } from "react";
import { EditGoodsUsecase } from "@/app/features/goods/application/EditGoodsUseCase";
import { SaveGoodsUseCase } from "@/app/features/goods/application/SaveGoodsUseCase";
import type { UserGoods } from "@/app/features/goods/domain/UserGoods";
import toCreateParcelMapper from "@/app/features/goods/domain/toCreatParcelMapper";
import { namedCall } from "../../application/NamedCall";
import type { FormMode, FormValues } from "@/types/Ui";
import { toParcelDtoMapper } from "@/app/features/parcels/application/toParcelDtoMapper";
import { useToast } from "@/app/components/Toast";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { parcelStep2Fields } from "@/app/features/parcels/ui/CreateParcelForm";
import toGoodsMapper from "@/app/features/goods/domain/toGoodsMapper";
import { useNavigate } from "react-router-dom";
import type { AppError } from "@/app/shared/domain/RepoResponse";
export const parcelItemSchema = z.object({
  quantity: z.number().min(1, "Quantity must be at least 1"),
  description: z.string().trim().min(1, "Item description is required"),
});

const parcelSchema = z.object({
  originCountry: z.string().min(2, "Country is required"),
  originCity: z.string().min(1, "city is required"),
  destinationCountry: z.string().min(2, "Country is required"),
  destinationCity: z.string().min(1, "City is required"),
  goodsCategoryIds: z.array(z.string()).min(1, "Select at least one category"),
  itemDescriptions: z
    .array(parcelItemSchema)
    .min(1, "Enter item quantity and description"),
  weight: z.number().min(1, "Quantity should be 1 or more"),
  pricePerKg: z.number().min(1, "Price should be 1 or more"),

  agreeToRules: z
    .boolean()
    .refine((v) => v === true, { message: "You must agree to the rules" }),
});

export type ParcelFormFields = z.infer<typeof parcelSchema>;

const emptyDefaultsValues = {
  originCountry: "",
  originCity: "",
  destinationCountry: "Zimbabwe",
  destinationCity: "Harare",
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
  const repo = useMemo(() => new SupabaseParcelRepository(), []);
  const useCase = useMemo(() => new CreateParcelUseCase(repo), [repo]);
  const goodsRepo = useMemo(() => new SupabaseGoodsRepository(), []);
  const editParcelUsecase = useMemo(() => new EditParcelUsecase(repo), [repo]);
  const editGoodsUsecase = useMemo(
    () => new EditGoodsUsecase(goodsRepo),
    [goodsRepo],
  );
  const saveGoodsUseCase = useMemo(
    () => new SaveGoodsUseCase(goodsRepo),
    [goodsRepo],
  );
  const { showSupabaseError } = useUniversalModal();
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
    defaultValues: initialFormValues ?? emptyDefaultsValues,
    mode: "onTouched",
  });
  const { toast } = useToast();

  const { user, refreshProfile } = useAuth();
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
    const { result } = await namedCall(
      "edit parcel hook form",
      editParcelUsecase.execute(
        toParcelDtoMapper(initialFormValues?.id, values, dirtyFields),
      ),
    );

    if (!result.success) {
      showSupabaseError(result.error);
      return;
    }

    if (dirtyFields.goodsCategoryIds) {
      const { result } = await namedCall(
        "edit goods",
        editGoodsUsecase.execute(
          values.goodsCategoryIds,
          initialFormValues.id,
          "parcel",
        ),
      );
      if (!result.success) {
        showSupabaseError(result.error);
        return;
      }
    }

    if (result.success) {
      toast("changes saved successfully", { variant: "success" });
      await refreshProfile();
    }
  };

  const onCreate = async (values: ParcelFormFields) => {
    if (!user) return;
    const ok = await trigger(parcelStep2Fields, { shouldFocus: true });
    if (!ok) return;

    try {
      // your existing save flow...
      const parcelId = await createParcel(
        values,
        user.id,
        useCase,
        showSupabaseError,
      );

      if (!parcelId) return;

      await SaveGoodsCategories(
        saveGoodsUseCase,
        toGoodsMapper(parcelId, selectedIds),
      );
      if (setModalState) {
        setModalState();
      } else {
        setToDashBoard(true);
      }
      toast("Parcel saved successfully", { variant: "success" });
    } catch (e) {
      showSupabaseError({ code: "error", message: "" });
    }
  };

  useEffect(() => {
    if (mode === "edit" && initialFormValues) reset(initialFormValues);
    if (mode === "create") reset(emptyDefaultsValues);
  }, [mode, initialFormValues, emptyDefaultsValues]);

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
  showSupabaseError: (v: AppError) => void,
): Promise<string> {
  const { result } = await namedCall(
    "create parcel hook form",
    useCase.execute(toCreateParcelMapper(userId, values)),
  );
  if (!result.success) {
    showSupabaseError(result.error);
    return "";
  }

  return result.data;
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
    dirtyFields.originCountry,
    dirtyFields.pricePerKg,
    dirtyFields.weight,
  ].some(Boolean);
}
