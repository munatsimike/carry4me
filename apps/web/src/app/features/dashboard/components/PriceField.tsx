import {
  NumberInputField,
  type NumberInputFieldProps,
} from "@/app/components/NumberInputField";

export default function PriceField({
  register,
  id,
  error,
  isDirty,
  isTouched,
}: NumberInputFieldProps) {
  return (
    <NumberInputField
      label="Price per (kg)"
      register={register}
      id={id}
      error={error}
      isDirty={isDirty}
      isTouched={isTouched}
    />
  );
}
