type TextSize = "xxxl" | "xxl" | "xl" | "lg" | "md" | "sm" | "xsm" | "display";
export type TextVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "success"
  | "onDark"
  | "selected"
  | "linkText"
  | "error"
  | "formText"
  | "tonal"

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
    primary: "font-heading text-ink-primary whitespace-normal break-words",
    secondary: "text-ink-secondary whitespace-normal break-words",
    tonal: "tex-ink-primary hover:text-white",
    neutral: "text-neutral-500 whitespace-normal break-words",
    success: "font-heading text-ink-trip",
    onDark: "font-heading text-ink-onDark",
    selected: "text-primary-600",
    error: "text-ink-error",
    formText:"text-ink-primary whitespace-normal break-words",
    linkText: "font-heading text-primary-500 ",
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
