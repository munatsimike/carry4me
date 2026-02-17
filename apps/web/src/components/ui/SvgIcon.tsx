import type { SvgIconComponent } from "@/types/Ui";

export type IconSize = "xsm" | "sm" | "md" | "lg" | "xl" | "xxl";
export type IconColor =
  | "primary"
  | "tertiary"
  | "success"
  | "pending"
  | "inactive"
  | "neutral"
  | "onDark"
  | "grey"
  | "tonal"

type IconProps = {
  size: IconSize;
  Icon: SvgIconComponent;
  color?: IconColor;
  className?: string;
};

export default function SvgIcon({ size, Icon, color, className }: IconProps) {
  const sizes: Record<IconSize, string> = {
    xsm: "h-3 w-auto",
    sm: "h-4 w-auto",
    md: "h-5 w-auto",
    lg: "h-6 w-auto",
    xl: "h-7 w-auto",
    xxl: "h-10 w-auto"
  };

  const iconColors: Record<IconColor, string> = {
    primary: "text-primary-500",
    tonal: "text-primary-500 group-hover:text-ink-onDark",
    tertiary: "text-secondary-50",
    success: "text-success-500",
    neutral: "text-neutral-400",
    grey: "text-neutral-200",
    onDark: "text-white",
    pending: "text-status-pending",
    inactive: "text-status-error",
  };

  return (
    <Icon
      className={`${sizes[size]} ${color && iconColors[color]} ${
        className ?? ""
      }`}
    />
  );
}
