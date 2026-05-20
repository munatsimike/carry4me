import useParcelForm from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import CreateParcelForm from "./CreateParcelForm";
import MobileForm from "../../dashboard/components/MobileForm";
import { useEffect, useMemo, useState } from "react";
import type { FormValues } from "@/types/Ui";
import { useSearchParams } from "react-router-dom";
import { SupabaseParcelRepository } from "../data/SupabaseParcelRepository";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { MyParcelsIdUseCase } from "../application/MyParcelsUseCase";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";

 
 
 export default function MobileParcelShaell(){
 
 const [searchParams] = useSearchParams();
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const { showSupabaseError } = useUniversalModal();
  const parcelByIdUseCase = useMemo(
    () => new MyParcelsIdUseCase(parcelRepo),
    [parcelRepo],
  );

  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const id = searchParams.get("id");

  const [initialFormValues, setInitialFormValues] = useState<
    FormValues | undefined>(undefined);

  useEffect(() => {
    if (mode === "edit" && id) {
      async function fetchParcel() {
        try {
          const parcels = await parcelByIdUseCase.execute(id!);
          if (parcels.length !== 1) return;
          const data = parcels[0];
          setInitialFormValues({
            id: data.id,
            originCountry: data.route.originCountry,
            ...toOriginCityFormFields(
              data.route.originCity,
              data.route.originCityIsCustom,
            ),
            destinationCountry: data.route.destinationCountry,
            destinationCity: data.route.destinationCity,
            goodsCategoryIds: [],
            itemDescriptions: [],
            weight: data.weightKg,
            pricePerKg: data.pricePerKg,
            agreeToRules: false,
            senderId: data.user.id!,
            departureDate: data.departDate,
          });
        } catch (err) {
          showSupabaseError(err);
        }
      }

      fetchParcel();
    }
  }, [mode, id]);

  const {
    selectedIds,
    control,
    register,
    isSubmitting,
    setValue,
    trigger,
    watch,
    dirtyFields,
    errors,
    touchedFields,
    onSubmit,
    handleSubmit,
  } = useParcelForm({ initialFormValues, mode });

  const content = (
    <CreateParcelForm
      mode={mode}
      selectedIds={selectedIds}
      formProps={{
        control: control,
        register: register,
        isSubmitting: isSubmitting,
        setValue: setValue,
        trigger: trigger,
        watch: watch,
        dirtyFields: dirtyFields,
        errors: errors,
        touchedFields: touchedFields,
      }}
    />
  );

  return <MobileForm submit={handleSubmit(onSubmit)}>{content}</MobileForm>;
}