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
  isDirty,
  isTouched,
  hasValue,
  ...props
}: CustomInputFieldProps) {
  const showSuccess = isTouched && !error && hasValue;
  return (
    <ErrorText error={error}>
      <div
        className={cn(`${inputStructural} flex items-center rounded-lg ${error ? inputError : showSuccess ? inputSuccess : inputNeutral}
        ${className ?? ""}`)}
      >
        {leadingIcon && (
          <div className=" pr-1 text-neutral-400 flex items-center">
            {leadingIcon}
          </div>
        )}
        <div className="relative flex-1">
          <input
            {...props}
            placeholder=" "
            className="peer w-full bg-transparent px-1 py-1 text-md text-neutral-700
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
        {trailingIcon && <button>{trailingIcon}</button>}
      </div>
    </ErrorText>
  );
}
