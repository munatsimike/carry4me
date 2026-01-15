type ButtonVariant = "primary" | "secondary" | "ghost" | "trip";
type ButtonSize = "sm" | "md" | "lg" | "xl";

type ButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  variant: ButtonVariant;
  size: ButtonSize;
  leadingIcon: React.ReactNode;
  trailingIcon: React.ReactNode;
  subtitle?: string;
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
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium " +
    "transition-all duration-300 " +
    "hover:-translate-y-0.5";

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3",
    md: "h-11 px-4",
    lg: "h-12 px-2.5",
    xl: "h-[85px] px-3.5",
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-500 hover:bg-primary-600",
    secondary: "bg-secondary-50 hover:bg-secondary-100",
    ghost: "bg-transparent hover:bg-tertiary-50",
    trip: "bg-trip-50 hover:bg-trip-100",
  };

  return (
    <button
      {...props}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {leadingIcon ? <span className="inline-flex">{leadingIcon}</span> : null}
      <span className="flex flex-1 flex-col">
        <span>{children}</span>
        {subtitle ? (
          <span className="text-ink-secondary text-[14px]">{subtitle}</span>
        ) : null}
      </span>

      {trailingIcon ? (
        <span className="inline-flex">{trailingIcon}</span>
      ) : null}
    </button>
  );
}
