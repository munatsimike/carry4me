import type { UseFormRegisterReturn } from "react-hook-form";
import {
  cn,
  inputError,
  inputNeutral,
  inputStructural,
  inputSuccess,
} from "../lib/cn";

import ErrorText from "./text/ErrorText";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type DropDownMenuProps = {
  placeholder: string;
  menuItems: string[];
  disabled?: boolean;
  className?: string;
  register?: UseFormRegisterReturn;
  value?: string;
  isDirty: boolean;
  isTouched?: boolean;
  error?: string;
  heightClass?: string;
  textSize?: string;
};

export default function DropDownMenu({
  menuItems,
  placeholder,
  disabled = false,
  className = "rounded-full",
  register,
  value,
  isDirty,
  heightClass = "py-2",
  textSize = "text-sm",
  isTouched,
  error,
}: DropDownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isPlaceholder = !value;
  const textVariant = `${
    isPlaceholder ? "text-neutral-400" : "text-ink-primary"
  } ${textSize}`;

  const showSuccess = (isDirty || isTouched) && !error;

  return (
    <ErrorText error={error}>
      <div className="relative min-w-[160px] w-full">
        <select
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={() => setIsOpen(false)}
          className={cn(
            `${heightClass ?? "h-11"} w-full rounded-xl bg-white pl-3 pr-12 appearance-none`,
            "overflow-hidden text-ellipsis whitespace-nowrap",
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

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-500 transition-transform duration-200",
            )}
          />
        </div>
      </div>
    </ErrorText>
  );
}
