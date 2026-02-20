import type { UseFormRegisterReturn } from "react-hook-form";
import {
  cn,
  inputError,
  inputNeutral,
  inputStructural,
  inputSuccess,
} from "../lib/cn";

import ErrorText from "./text/ErrorText";

type DropDownMenuProps = {
  placeholder: string;
  menuItems: string[];
  disabled?: boolean;
  className?: string;
  register?: UseFormRegisterReturn;
  value?: string;
  isDirty?: boolean;
  isTouched?: boolean;
  error?: string;
};

export default function DropDownMenu({
  menuItems,
  placeholder,
  disabled = false,
  className = "rounded-full",
  register,
  value = "",
  isDirty,
  isTouched,
  error,
}: DropDownMenuProps) {
  const isPlaceholder = !value;

  const textSize = "text-[14px]";
  const textVariant = `${
    isPlaceholder ? "text-neutral-400" : "text-ink-primary"
  } ${textSize}`;

  const showSuccess = (isDirty || isTouched) && !error;

  return (
    <ErrorText error={error}>
      <select
        defaultValue=""
        disabled={disabled}
        className={cn(
          "px-3 py-2 bg-white" ,
          inputStructural,
          className,
          textVariant,
          error ? inputError : showSuccess ? inputSuccess : inputNeutral,
        )}
        {...register}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {menuItems.map((item) => (
          <option key={item} value={item} className={textVariant}>
            {item}
          </option>
        ))}
      </select>
    </ErrorText>
  );
}
