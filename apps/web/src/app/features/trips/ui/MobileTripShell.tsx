import { useTripForm } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { CreateTripForm } from "./CreateTripForm";
import type { FormValues } from "@/types/Ui";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { MyTripsUseCase } from "../application/MyTripsUseCase";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import MobileForm from "../../dashboard/components/MobileForm";
import { toOriginCityFormFields } from "@/app/shared/locations/cityOptions";

export default function MobileTripShell() {
  const [searchParams] = useSearchParams();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const { showSupabaseError } = useUniversalModal();
  const tripByIdUseCase = useMemo(
    () => new MyTripsUseCase(tripRepo),
    [tripRepo],
  );

  const mode = searchParams.get("mode") === "edit" ? "edit" : "create";
  const id = searchParams.get("id");

  const [initialFormValues, setInitialFormValues] = useState<
    FormValues | undefined
  >(undefined);

  useEffect(() => {
    if (mode === "edit" && id) {
      async function fetchTrip() {
        try {
          const trips = await tripByIdUseCase.execute(id!);
          if (trips.length !== 1) return;
          const data = trips[0];
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

      fetchTrip();
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
  } = useTripForm({ initialFormValues, mode });

  const content = (
    <CreateTripForm
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
