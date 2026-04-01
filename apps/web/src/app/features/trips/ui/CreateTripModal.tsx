import FormModal from "../../dashboard/components/FormModal";
import type { FormMode, FormValues } from "@/types/Ui";
import { useTripForm } from "@/app/shared/Authentication/UI/hooks/useTripForm";
import { CreateTripForm } from "./CreateTripForm";

export default function CreateTripModal({
  mode = "create",

  setModalState,
  initialFormValues,
}: {
  setModalState: () => void;
  initialFormValues?: FormValues;
  mode?: FormMode;
}) {
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
  } = useTripForm({ initialFormValues, mode, setModalState });

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

  return (
    <FormModal onSubmit={handleSubmit(onSubmit)} onClose={setModalState}>
      {content}
    </FormModal>
  );
}
