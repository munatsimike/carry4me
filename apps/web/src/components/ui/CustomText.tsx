type TextSize = "xxl" | "xl" | "lg" | "md" | "sm" | "xsm";
type TextVariant = "primary" | "secondary" | "neutral";

type PrimaryTextProps = {
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  textSize?: TextSize;
  textVariant?: TextVariant;
  children: React.ReactNode;
  className?: string;
};

export default function Text({
  as,
  children,
  className,
  textSize = "sm",
  textVariant = "secondary",
}: PrimaryTextProps) {
  const variants: Record<TextVariant, string> = {
    primary: "font-heading text-ink-primary",
    secondary: "text-ink-secondary",
    neutral: "text-neutral-100",
  };
  const sizes: Record<TextSize, string> = {
    xxl: "text-4xl",
    xl: "text-3xl",
    lg: "text-2xl",

    md: "text-xl",
    sm: "text-[18px]",
    xsm: "text-base",
  };

  const Component = as ?? "h1";

  return (
    <Component
      className={`${sizes[textSize]} ${className} ${variants[textVariant]}  leading-tight `}
    >
      {children}
    </Component>
  );
}
