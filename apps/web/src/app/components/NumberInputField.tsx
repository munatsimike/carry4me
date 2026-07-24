import { useEffect, useState } from "react";
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
import { AnimatePresence, motion } from "framer-motion";

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
  /** Lowest value the spinner and input may use. Defaults to 0. */
  min?: number;
};

function isMinFloorMessage(message: string | undefined, min: number): boolean {
  if (!message || min <= 0) return false;
  const normalized = message.trim().toLowerCase();
  return (
    normalized === `minimum is ${min}` ||
    normalized.includes(`at least ${min}`) ||
    normalized.includes(`minimum is ${min}`)
  );
}

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
  min = 0,
}: NumberInputFieldProps<TFieldValues>) {
  const [minNotice, setMinNotice] = useState(false);
  const safeValue = Number.isFinite(value) ? value : min;
  const minLabel = min > 0 ? `Minimum is ${min}` : "";
  const valueBelowMin = min > 0 && Number.isFinite(value) && value < min;
  const showMinNotice =
    min > 0 && (minNotice || valueBelowMin || isMinFloorMessage(error, min));
  const fieldError = isMinFloorMessage(error, min) ? undefined : error;
  const showSuccess = (isDirty || isTouched) && !fieldError && !showMinNotice;

  const applyValue = (next: number) => {
    const clamped = Math.max(min, next);
    if (min > 0 && next < min) {
      setMinNotice(true);
    } else if (clamped > min) {
      setMinNotice(false);
    }
    setValue(name, clamped as PathValue<TFieldValues, typeof name>, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    if (!showMinNotice) return;
    const timer = window.setTimeout(() => setMinNotice(false), 4000);
    return () => window.clearTimeout(timer);
  }, [showMinNotice, minNotice]);

  const spinBtnClass = "leading-none hover:text-primary-500 text-neutral-400";

  return (
    <ErrorText error={fieldError}>
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
              min={min}
              id={id}
              inputMode="numeric"
              className={cn(
                `${inputStructural} text-ink-primary rounded-lg`,
                fieldError
                  ? inputError
                  : showSuccess
                    ? inputSuccess
                    : inputNeutral,
              )}
              {...register}
              onBlur={(event) => {
                register.onBlur(event);
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed) || parsed < min) {
                  applyValue(min);
                }
              }}
            />

            <div className="absolute right-2 top-2 flex flex-col text-xs">
              <button
                type="button"
                onClick={() => applyValue(safeValue + 1)}
                className={spinBtnClass}
              >
                ▲
              </button>

              <button
                type="button"
                onClick={() => {
                  if (safeValue <= min) {
                    setMinNotice(true);
                    return;
                  }
                  applyValue(safeValue - 1);
                }}
                className={cn(
                  spinBtnClass,
                  safeValue <= min && "cursor-default opacity-40",
                )}
                aria-label={
                  safeValue <= min && minLabel
                    ? minLabel
                    : "Decrease value"
                }
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

        <AnimatePresence initial={false}>
          {showMinNotice && minLabel ? (
            <motion.p
              key="min-notice"
              className="text-xs leading-tight text-neutral-500"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              role="status"
              aria-live="polite"
            >
              {minLabel}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </ErrorText>
  );
}
