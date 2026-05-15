import ErrorText from "./text/ErrorText";
import {
  cn,
  inputError,
  inputNeutral,
  inputStructural,
  inputSuccess,
} from "../lib/cn";

type CustomInputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  isDirty: boolean;
  isTouched: boolean;
  hasValue: boolean;
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onIconClick?: () => void;
};

export default function FloatingInputField({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  className,
  onIconClick,
  isDirty,
  isTouched,
  hasValue,
  ...props
}: CustomInputFieldProps) {
  const showSuccess = isTouched && !error && hasValue;
  return (
    <ErrorText error={error}>
      <div
        className={cn(`${inputStructural} w-full max-w-xs  flex items-center rounded-xl ${error ? inputError : showSuccess ? inputSuccess : inputNeutral}
        ${className ?? ""}`)}
      >
        {leadingIcon && (
          <div className={cn(" pr-1 text-neutral-400 flex items-center")}>
            {leadingIcon}
          </div>
        )}
        <div className="relative flex-1">
          <input
            {...props}
            placeholder=" "
            className={cn(
              "peer w-full bg-transparent px-1 py-1 text-md text-neutral-700 focus:outline-none",
            )}
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
          <button
            type="button"
            onClick={onIconClick}
            className="ml-2 rounded-full p-1 text-neutral-400 transition hover:text-neutral-600 focus:outline-none"
          >
            {trailingIcon}
          </button>
        )}
      </div>
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
    </ErrorText>
  );
}
