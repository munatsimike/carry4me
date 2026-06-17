import ErrorText from "./text/ErrorText";
import {
  cn,
  inputError,
  inputNeutral,
  inputStructural,
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
import InfoTooltip from "@/app/components/InfoTooltip";

export type NumberInputFieldProps<TFieldValues extends FieldValues> = {
  id: string;
  isTouched: boolean;
  isDirty: boolean;
  register: UseFormRegisterReturn;
  error?: string;
  label?: string;
  labelHint?: string;
  prefix?: string;
  suffix?: string;
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
  labelHint,
  prefix,
  suffix,
  value,
  setValue,
  name,
}: NumberInputFieldProps<TFieldValues>) {
  const showSuccess = (isDirty || isTouched) && !error;

  const spinBtnClass = "leading-none hover:text-primary-500 text-neutral-400";
  return (
    <ErrorText error={error}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <CustomText textSize="sm" textVariant="label">
            {label}
          </CustomText>
          {labelHint ? <InfoTooltip content={labelHint} /> : null}
        </div>
        <div className="flex items-center gap-2">
        {prefix ? (
          <CustomText as="span" textSize="sm" className="text-neutral-600">
            {prefix}
          </CustomText>
        ) : null}
        <div className="relative w-[80px]">
          <input
            type="number"
            min={0}
            id={id}
            inputMode="numeric"
            className={cn(
              `${inputStructural} text-ink-primary rounded-lg`,
              error ? inputError : showSuccess ? inputSuccess : inputNeutral,
            )}
            {...register}
          />

          <div className="absolute right-2 top-2 flex flex-col text-xs">
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
        {suffix ? (
          <CustomText as="span" textSize="sm" className="text-neutral-600">
            {suffix}
          </CustomText>
        ) : null}
        </div>
      </div>
    </ErrorText>
  );
}
