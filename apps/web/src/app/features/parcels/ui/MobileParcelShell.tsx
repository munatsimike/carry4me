import useParcelForm from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import CreateParcelForm from "./CreateParcelForm";
import MobileForm from "../../dashboard/components/MobileForm";
import { useEffect, useMemo, useState } from "react";
import type { FormValues } from "@/types/Ui";
import { useSearchParams } from "react-router-dom";
import { SupabaseParcelRepository } from "../data/SupabaseParcelRepository";
import { useUniversalModal } from "@/app/shared/Authentication/application/DialogBoxModalProvider";
import { useAuth } from "@/app/shared/supabase/AuthProvider";
import { MyParcelsIdUseCase } from "../application/MyParcelsUseCase";
import { parcelListingToFormValues } from "@/app/shared/listingFormMappers";
import Spinner from "@/app/components/Spinner";

export default function MobileParcelShaell() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const parcelRepo = useMemo(() => new SupabaseParcelRepository(), []);
  const { showSupabaseError } = useUniversalModal();
  const parcelByIdUseCase = useMemo(
    () => new MyParcelsIdUseCase(parcelRepo),
    [parcelRepo],
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
        const parcels = await parcelByIdUseCase.execute(user.id, id);
        if (cancelled || parcels.length !== 1) return;
        setInitialFormValues(parcelListingToFormValues(parcels[0]));
      } catch (err) {
        if (!cancelled) showSupabaseError(err);
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, mode, parcelByIdUseCase, showSupabaseError, user?.id]);

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
