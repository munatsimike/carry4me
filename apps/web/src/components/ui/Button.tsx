type ButtonVariant = "primary" | "secondary" | "ghost" | "trip" | "tripPrimary"|
"error" | "neutral";
type ButtonSize = "xsm" | "sm" | "md" | "lg" | "xl";

type ButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  size: ButtonSize;
  leadingIcon: React.ReactNode;
  trailingIcon?: React.ReactNode;
  subtitle?: React.ReactNode;
};

export function Button({
  variant,
  subtitle,
  className,
  size,
  leadingIcon,
  trailingIcon,
  children,
  ...props
}: ButtonProps) {
  const cornerRadius = "rounded-lg";
  const gap = size === "xl" ? "gap-4" : "gap-2"; // gap between leading, trailing icon and button text
  const base =
    "inline-flex items-center justify-center font-thin font-heading " +
    "transition-all duration-300 " +
    "hover:-translate-y-0.5 hover:shadow-lg ";

  const sizes: Record<ButtonSize, string> = {
    xsm: "h-8 px-3 rounded-full",
    sm: "h-9 px-3 " + cornerRadius,
    md: "h-10 px-4 " + cornerRadius,
    lg: "h-12 px-2.5 " + cornerRadius,
    xl: "h-[80px] px-3 rounded-xl",
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-500 hover:bg-primary-600 text-white font-heading",
    secondary: "bg-secondary-50 hover:bg-secondary-100",
    ghost: "bg-transparent hover:bg-tertiary-50",
    trip: "bg-trip-50 hover:bg-trip-100",
    tripPrimary: "bg-trip-500 hover:bg-trip-600 text-white",
    neutral: "hover:bg-neutral-50",
    error: "hover:bg-error-100 hover:text-ink-error"
  };

  const spanBase = "flex items-center " + gap;
  return (
    <button
      {...props}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      <span className={spanBase}>
        {leadingIcon ? (
          <span className="inline-flex">{leadingIcon}</span>
        ) : null}
        <span className="flex flex-col">
          <span>{children}</span>
          {subtitle ? (
            <span className="text-ink-secondary text-[14px]">{subtitle}</span>
          ) : null}
        </span>

        {trailingIcon ? (
          <span className="inline-flex">{trailingIcon}</span>
        ) : null}
      </span>
    </button>
  );
}
