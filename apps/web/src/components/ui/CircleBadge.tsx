type CircleSize = "sm" | "md" | "lg" | "xl";
type CirleBgColor = "trip" | "parcel" | "neutral" | "primary";

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
    xl: "h-14 w-14",
  };

  const bgColors: Record<CirleBgColor, string> = {
    trip: "bg-trip-100",
    parcel: "bg-secondary-100",
    neutral: "bg-neutral-50",
    primary: "bg-primary-200"
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
