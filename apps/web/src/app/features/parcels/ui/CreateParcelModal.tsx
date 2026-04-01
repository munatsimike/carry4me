import type { ParcelFormMode } from "./CreateParcelForm";
import useParcelForm from "@/app/shared/Authentication/UI/hooks/useParcelForm";
import FormModal from "../../dashboard/components/FormModal";
import CreateParcelForm from "./CreateParcelForm";
import type { FormValues } from "@/types/Ui";

export default function CreateParcelModal({
  setModalState,
  initialFormValues,
  mode = "create",
}: {
  setModalState: () => void;
  initialFormValues?: FormValues;
  mode?: ParcelFormMode;
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
  } = useParcelForm({ initialFormValues, mode, setModalState });

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

  return (
    <FormModal onSubmit={handleSubmit(onSubmit)} onClose={setModalState}>
      {content}
    </FormModal>
  );
}
