export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "tonal"
  | "error"
  | "outline"
  | "neutral";
type ButtonSize = "xsm" | "sm" | "md" | "lg" | "xl" | "xxl";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  size: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  subtitle?: React.ReactNode;
  isBusy?: boolean;
};

export function Button({
  variant,
  subtitle,
  className,
  size,
  leadingIcon,
  trailingIcon,
  children,
  type = "button",
  isBusy = false,
  ...props
}: ButtonProps) {
  const cornerRadius = "rounded-lg";
  const opacityCursor = "opacity-75 cursor-not-allowed";
  const hoverClass =
    "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer";

  // IMPORTANT: remove justify-center, because we want internal layout to decide positioning
  const base = `relative inline-flex items-center font-thin font-heading active:translate-y-0 active:scale-[0.95] active:shadow-md ${
    isBusy ? opacityCursor : hoverClass
  }`;

  const sizes: Record<ButtonSize, string> = {
    xsm: "h-8 px-3 rounded-full",
    sm: "h-9 px-3 " + cornerRadius,
    md: "h-10 px-4 " + cornerRadius,
    lg: "h-14 px-4 " + cornerRadius,
    xl: "h-[85px] max-w-sm px-3 rounded-xl",
    xxl: "h-[110px] min-w-[200px] px-3 rounded-xl motion-safe:animate-scale-in",
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white font-heading",
    secondary: "bg-secondary-100 hover:bg-secondary-2-00",
    ghost: "bg-transparent hover:bg-tertiary-50",
    tonal: "bg-secondary-50 hover:bg-primary-500 text-primary border border-secondary-200 hover:text-white",
    neutral: "hover:bg-neutral-50",
    outline: "hover:bg-neutral-100 border bg-neutral-50",
    error: "hover:bg-error-100 hover:text-ink-error text-ink-secondary",
  };

  // gap should only be between leading and text, NOT including trailing
  const gap = size === "xl" ? "gap-4" : "gap-2";

  return (
    <button
      type={type}
      {...props}
      className={`group ${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white/20 opacity-0
             group-active:opacity-100 group-active:duration-150"
      />
      {/* Full-width layout container */}
      <span className="flex w-full items-center gap-2">
        {/* Left slot */}
        {leadingIcon && (
          <span className="inline-flex shrink-0">{leadingIcon ?? null}</span>
        )}

        {/* Center slot */}
        <span className={`flex flex-1 items-center justify-center ${gap}`}>
          {/* If you want the icon to sit next to text but still centered, move leadingIcon here instead */}
          <span className="flex flex-col items-center">
            <span>{children}</span>
            {subtitle ? (
              <span className="text-ink-secondary text-[14px]">{subtitle}</span>
            ) : null}
          </span>
        </span>

        {/* Right slot */}
        {trailingIcon && (
          <span className="inline-flex justify-end">
            {trailingIcon ?? null}
          </span>
        )}
      </span>
    </button>
  );
}
