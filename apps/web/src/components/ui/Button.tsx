import { cn } from "@/app/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "tonal"
  | "error"
  | "outline"
  | "neutral";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  size: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  subtitle?: React.ReactNode;
  isBusy?: boolean;
  cornerRadiusClass?: string;
};

export function Button({
  variant,
  subtitle,
  className,
  size,
  leadingIcon,
  trailingIcon,
  children,
  cornerRadiusClass = "rounded-full",
  type = "button",
  isBusy = false,
  disabled,
  ...props
}: ButtonProps) {
  const isInactive = isBusy || disabled;
  const inactiveClass = "opacity-70 cursor-not-allowed";
  const hoverClass =
    "transition-all duration-300 enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg cursor-pointer enabled:active:translate-y-0 enabled:active:scale-[0.95] enabled:active:shadow-md";

  // IMPORTANT: remove justify-center, because we want internal layout to decide positioning
  const base = `relative inline-flex items-center font-thin font-heading ${
    isInactive ? inactiveClass : hoverClass
  }`;

  const sizes: Record<ButtonSize, string> = {
    xs: "h-8 px-3 " + cornerRadiusClass,
    sm: "h-9 px-3 " + cornerRadiusClass,
    md: "h-10 px-4 " + cornerRadiusClass,
    lg: "h-12 px-4 " + cornerRadiusClass,
    xl: "h-[70px] w-full md:flex-1 pr-4 rounded-full",
    xxl: "w-[230px] sm:w-full h-[90px] rounded-2xl px-4",
  };

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-primary-500 text-white font-heading enabled:hover:bg-primary-600 enabled:hover:ring-2 enabled:hover:ring-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
    secondary:
      "bg-secondary-100 enabled:hover:bg-secondary-200 enabled:hover:ring-2 enabled:hover:ring-indigo-200",
    ghost: "bg-transparent enabled:hover:bg-tertiary-50",
    tonal:
      "bg-secondary-200 enabled:hover:bg-primary-500 text-primary border border-secondary-400 enabled:hover:text-white",
    neutral: "enabled:hover:bg-neutral-50 text-ink-secondary",
    outline: "enabled:hover:bg-neutral-200 border bg-neutral-50 text-ink-secondary",
    error:
      "enabled:hover:bg-error-100 enabled:hover:text-ink-error text-ink-primary border bg-neutral-100",
  };

  // gap should only be between leading and text, NOT including trailing
  const gap = size === "xl" ? "gap-4" : "gap-2";

  return (
    <button
      type={type}
      {...props}
      disabled={isInactive}
      className={cn("group", base, sizes[size], variants[variant], className)}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/20 opacity-0
             enabled:group-active:opacity-100 enabled:group-active:duration-150"
      />
      {/* Full-width layout container */}
      <span className="flex w-full items-center gap-2 justify-center">
        {/* Left slot */}
        {leadingIcon && (
          <span className="inline-flex shrink-0">{leadingIcon ?? null}</span>
        )}

        {/* Center slot */}
        <span className={`flex items-center justify-center ${gap}`}>
          {/* If you want the icon to sit next to text but still centered, move leadingIcon here instead */}
          <span className="flex flex-col items-center">
            <span>{children}</span>
            {subtitle ? (
              <span className="text-ink-secondary text-[14px]">{subtitle}</span>
            ) : null}
          </span>
        </span>
      </span>
      {/* Right slot */}
      {trailingIcon && (
        <span className="inline-flex justify-end">{trailingIcon ?? null}</span>
      )}
    </button>
  );
}
