type CircleSize = "sm" | "md" | "lg" | "xl";
export type CirleBgColor = "success" | "secondary" | "neutral" | "primary" | "onDark"| "transparent";

type CirleBadgeProps = {
  size?: CircleSize;
  children: React.ReactNode;
  bgColor?: CirleBgColor;
  textClassName?: string;
  paddingClassName?: string;
  className?: string;
};

export function CircleBadge({
  children,
  bgColor = "primary",
  paddingClassName = "p-1.5",
  className = "",
  size = "md",
}: CirleBadgeProps) {
  const circleSizes: Record<CircleSize, string> = {
    sm: "h-7 w-7",
    md: "h-8 w-8",
    lg: "h-9 w-9",
    xl: "h-11 w-11",
  };

  const bgColors: Record<CirleBgColor, string> = {
    success: "bg-trip-50",
    secondary: "bg-secondary-100",
    neutral: "bg-neutral-100",
    primary: "bg-primary-100",
    onDark: "bg-white",
    transparent: "bg-transparent"
  };
  return (
    <span
      className={`inline-flex ${
        circleSizes[size]
      } items-center justify-center rounded-full aspect-square ${
        bgColor && bgColors[bgColor]
      } ${paddingClassName} ${className}`}
    >
      {children}
    </span>
  );
}
