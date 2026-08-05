import SvgIcon, { type IconSize } from "@/components/ui/SvgIcon";
import { cn } from "@/app/lib/cn";
import type { SvgIconComponent } from "@/types/Ui";

type HoverFillIconProps = {
  Outlined: SvgIconComponent;
  Filled: SvgIconComponent;
  size?: IconSize;
  className?: string;
};

/** Outlined by default; swaps to filled on parent `group-hover`. */
export default function HoverFillIcon({
  Outlined,
  Filled,
  size = "xl",
  className,
}: HoverFillIconProps) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <SvgIcon
        size={size}
        Icon={Outlined}
        className="transition-opacity duration-200 group-hover:opacity-0"
      />
      <SvgIcon
        size={size}
        Icon={Filled}
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
    </span>
  );
}
