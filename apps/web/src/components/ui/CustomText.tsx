type TextSize = "xxxl" | "xxl" | "xl" | "lg" | "md" | "sm" | "xsm" | "display";
type TextVariant = "primary" | "secondary" | "neutral" | "trip" | "onDark";

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
    trip: "font-heading text-ink-trip",
    onDark: "font-heading text-ink-onDark"
  };
  const sizes: Record<TextSize, string> = {
    xsm: "text-sm", // 14px
    sm: "text-base", // 16px
    md: "text-lg", // 18px
    lg: "text-xl", // 20px
    xl: "text-2xl", // 24px
    xxl: "text-[26px]",
    xxxl: "text-3xl", // 30px (primary section headers)
    display: "text-4xl",
  };

  const Component = as ?? "h1";

  return (
    <Component
      className={`${sizes[textSize]} ${className} ${variants[textVariant]}`}
    >
      {children}
    </Component>
  );
}
