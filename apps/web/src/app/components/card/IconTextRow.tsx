import CustomText from "@/components/ui/CustomText";
import SvgIcon, { type IconSize } from "@/components/ui/SvgIcon";
import type { SvgIconComponent } from "@/types/Ui";

type IconRowProps = {
  Icon: SvgIconComponent;
  label: string;
  iconSize?: IconSize;
};

export default function IconTextRow({
  Icon,
  label,
  iconSize = "sm",
}: IconRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span>
        <SvgIcon size={iconSize} Icon={Icon} />
      </span>
      <CustomText textVariant="primary">{label}</CustomText>
    </div>
  );
}
