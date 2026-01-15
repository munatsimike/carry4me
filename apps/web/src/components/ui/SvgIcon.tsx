type IconSize = "sm" | "md" | "lg" | "xl";
type IconColor = "primary" | "tertiary" | "trip" | "neutral";

type IconProps = {
  size: IconSize;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: IconColor;
  className?: string;
};

export default function SvgIcon({ size, Icon, color, className }: IconProps) {
  const sizes: Record<IconSize, string> = {
    sm: "h-4 w-auto",
    md: "h-5 w-auto",
    lg: "h-6 w-auto",
    xl: "h-9 w-auto",
  };

  const iconColors: Record<IconColor, string> = {
    primary: "text-primary-500",
    tertiary: "text-secondary-50",
    trip: "text-trip-500",
    neutral: "text-neutral-100",
  };

  return (
    <Icon
      className={`${sizes[size]} ${color && iconColors[color]} ${
        className ?? ""
      }`}
    />
  );
}
