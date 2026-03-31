import { useTripForm } from "@/app/shared/Authentication/UI/hooks/useListingForm";
import { CreateTripFormContent } from "./TripForm";
import type { FormValues } from "@/types/Ui";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { useToast } from "@/app/components/Toast";
import { MyTripsUseCase } from "../application/MyTripsUseCase";
import { namedCall } from "@/app/shared/Authentication/application/NamedCall";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { motion } from "framer-motion";

export default function MobileTripShell() {
  const [searchParams] = useSearchParams();
  const tripRepo = useMemo(() => new SupabaseTripsRepository(), []);
  const { showSupabaseError } = useUniversalModal();
  const { toast } = useToast();
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
        const { result } = await namedCall(
          "fetch trip by id mobile",
          tripByIdUseCase.execute(id!),
        );
        if (!result.success) {
          showSupabaseError(result.error);
          return;
        }
        if (result.data.length === 1) {
          const data = result.data[0];
          setInitialFormValues({
            id: data.id,
            originCountry: data.route.originCountry,
            originCity: data.route.originCity,
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
    <CreateTripFormContent
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="">
      <motion.div
        initial={{ x: "-100%", opacity: 1 }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 30,
        }}
        className="flex flex-col gap-4 px-6 py-4 h-full"
      >
        {content}
      </motion.div>
    </form>
  );
}
