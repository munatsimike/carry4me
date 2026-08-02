import { META_ICONS } from "@/app/icons/MetaIcon";
import SvgIcon from "@/components/ui/SvgIcon";

type Variant = "trip" | "parcel";

export default function CardLabel({
  label,
  variant,
}: {
  variant: Variant;
  label: string;
}) {
  const styles: Record<Variant, string> = {
    trip: "bg-primary-50 text-primary-500 border-primary-100/55 group-hover/card:bg-white",
    parcel:
      "bg-[#334155]/10 text-[#334155] border-[#334155]/10 group-hover/card:bg-white",
  };

  const Icon =
    variant === "trip" ? META_ICONS.planeIcon : META_ICONS.parcelBoxOutlined;

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-3 h-7 text-sm font-light border rounded-full ${styles[variant]}`}
    >
      <SvgIcon size="xs" Icon={Icon} className="shrink-0 text-current" />
      {label}
    </span>
  );
}
