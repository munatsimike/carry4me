import { useTripForm } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { CreateTripForm } from "./CreateTripForm";
import type { FormValues } from "@/types/Ui";
import { useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { SupabaseTripsRepository } from "../data/SupabaseTripsRepository";
import { MyTripsUseCase } from "../application/MyTripsUseCase";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { tripListingToFormValues } from "@/app/shared/listingFormMappers";
import MobileForm from "../../dashboard/components/MobileForm";
import Spinner from "@/app/components/Spinner";

export default function MobileTripShell() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
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
  const [loadingEdit, setLoadingEdit] = useState(mode === "edit" && !!id);

  useEffect(() => {
    if (mode !== "edit" || !id) {
      setInitialFormValues(undefined);
      setLoadingEdit(false);
      return;
    }

    if (!user?.id) return;

    let cancelled = false;
    setLoadingEdit(true);

    (async () => {
      try {
        const trips = await tripByIdUseCase.execute(user.id, id);
        if (cancelled || trips.length !== 1) return;
        setInitialFormValues(tripListingToFormValues(trips[0]));
      } catch (err) {
        if (!cancelled) showSupabaseError(err);
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mode, showSupabaseError, tripByIdUseCase, user?.id]);

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

  if (loadingEdit || (mode === "edit" && !initialFormValues)) {
    return (
      <MobileForm submit={() => undefined}>
        <div className="flex min-h-[240px] items-center justify-center">
          <Spinner />
        </div>
      </MobileForm>
    );
  }

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
