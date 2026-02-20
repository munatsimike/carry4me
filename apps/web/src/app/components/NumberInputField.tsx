import CustomText from "@/components/ui/CustomText";
import ErrorText from "./text/ErrorText";
import { cn, inputError, inputNeutral, inputSuccess } from "../lib/cn";
import type { UseFormRegisterReturn } from "react-hook-form";

export type NumberInputFieldProps = {
  id: string;
  isTouched: boolean;
  isDirty: boolean;
  register: UseFormRegisterReturn;
  error?: string;
  label?: string;
};

export function NumberInputField({
  register,
  id,
  error,
  isDirty,
  isTouched,
  label = "",
}: NumberInputFieldProps) {
  const showSuccess = (isDirty || isTouched) && !error;
  return (
    <ErrorText error={error}>
      <div className="flex flex-col gap-2">
        <CustomText textSize="xsm" textVariant="label">
          {label}
        </CustomText>
        {
          <input
            type="number"
            min={0}
            id={id}
            className={cn(
              `w-full rounded-md text-ink-primary sm:w-[85px] py-1 px-2 focus:outline-none focus:ring-0 ${error ? inputError : showSuccess ? inputSuccess : inputNeutral}`,
            )}
            {...register}
          />
        }
      </div>
    </ErrorText>
  );
}
