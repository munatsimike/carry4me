import CustomText from "@/components/ui/CustomText";
import SvgIcon, {
  type IconColor,
  type IconSize,
} from "@/components/ui/SvgIcon";
import type { SvgIconComponent } from "@/types/Ui";

type IconRowProps = {
  Icon: SvgIconComponent;
  label: string;
  iconSize?: IconSize;
  iconColor?: IconColor;
};

export default function IconTextRow({
  Icon,
  label,
  iconSize = "sm",
  iconColor = "neutral",
}: IconRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span>
        <SvgIcon size={iconSize} Icon={Icon} color={iconColor} />
      </span>
      <CustomText textSize={"xsm"} textVariant="primary">
        {label}
      </CustomText>
    </div>
  );
}
