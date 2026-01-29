import React, { useState } from "react";
import ErrorText from "./text/ErrorText";

type CustomInputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  label?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onIconClick?: (v: boolean) => void;
};

export default function FloatingInputField({
  label,
  error,
  leadingIcon,
  trailingIcon,
  className,
  onIconClick,
  ...props
}: CustomInputFieldProps) {
  return (
    <div>
      <div
        className={`relative flex items-center rounded-md border border-neutral-200 font-inter text-sm text-neutral-300
        focus-within:ring-1 focus-within:ring-primary-100 focus-within:border-primary-100
        ${className ?? ""}`}
      >
        {leadingIcon && (
          <div className="pl-3 text-neutral-400 flex items-center">
            {leadingIcon}
          </div>
        )}
        <div className="relative flex-1">
          <input
            {...props}
            placeholder=" "
            className="peer w-full bg-transparent px-3 py-3 text-md text-neutral-700
            focus:outline-none"
          />

          <label
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2
            bg-white px-1 text-neutral-400 transition-all
            peer-focus:top-0 peer-focus:text-xs peer-focus:text-primary-600
            peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:text-xs"
          >
            {label}
          </label>
        </div>
        {trailingIcon && (
          <button>
            {trailingIcon}
          </button>
        )}
      </div>
      <ErrorText error={error} />
    </div>
  );
}
