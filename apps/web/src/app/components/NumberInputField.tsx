import ErrorText from "./text/ErrorText";
import {
  cn,
  inputError,
  inputNeutral,
  inputSuccess,
} from "../lib/cn";
import type {
  FieldValues,
  Path,
  PathValue,
  UseFormRegisterReturn,
  UseFormSetValue,
} from "react-hook-form";
import CustomText from "@/components/ui/CustomText";

export type NumberInputFieldProps<TFieldValues extends FieldValues> = {
  id: string;
  isTouched: boolean;
  isDirty: boolean;
  register: UseFormRegisterReturn;
  error?: string;
  label?: string;
  setValue: UseFormSetValue<TFieldValues>;
  value: number;
  name: Path<TFieldValues>;
};

export function NumberInputField<TFieldValues extends FieldValues>({
  register,
  id,
  error,
  isDirty,
  isTouched,
  label = "",
  value,
  setValue,
  name,
}: NumberInputFieldProps<TFieldValues>) {
  const showSuccess = (isDirty || isTouched) && !error;

  const spinBtnClass = "leading-none hover:text-primary-500 text-neutral-400";
  return (
    <ErrorText error={error}>
      <div className="flex flex-col gap-2">
        <CustomText textSize="xsm" textVariant="label">
          {label}
        </CustomText>
        <div className="relative w-[80px]">
          <input
            type="number"
            min={0}
            id={id}
            inputMode="numeric"
            className={cn(
              `w-full rounded-md py-1 pl-2 pr-8 appearance-none focus:outline-none focus:ring-0 text-ink-primary`,
              error ? inputError : showSuccess ? inputSuccess : inputNeutral,
            )}
            {...register}
          />

          <div className="absolute right-2 top-1 flex flex-col text-xs">
            <button
              type="button"
              onClick={() =>
                setValue(
                  name,
                  ((value ?? 0) + 1) as PathValue<TFieldValues, typeof name>,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  },
                )
              }
              className={spinBtnClass}
            >
              ▲
            </button>

            <button
              type="button"
              onClick={() =>
                setValue(
                  name,
                  Math.max(0, (value ?? 0) - 1) as PathValue<
                    TFieldValues,
                    typeof name
                  >,
                  {
                    shouldValidate: true,
                    shouldDirty: true,
                  },
                )
              }
              className={spinBtnClass}
            >
              ▼
            </button>
          </div>
        </div>
      </div>
    </ErrorText>
  );
}
