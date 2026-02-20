import {
  NumberInputField,
  type NumberInputFieldProps,
} from "@/app/components/NumberInputField";

export default function WeightField({
  register,
  id,
  error,
  isDirty,
  isTouched,
}: NumberInputFieldProps) {
  return (
    <NumberInputField
    label="Available weight (kg)"
      register={register}
      id={id}
      error={error}
      isDirty={isDirty}
      isTouched={isTouched}
    />
  );
}
