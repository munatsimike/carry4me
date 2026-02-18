import { META_ICONS } from "@/app/icons/MetaIcon";
import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { SvgIconComponent } from "@/types/Ui";
type formHeaderProps = {
  icon?: SvgIconComponent;
  heading: string;
  subHeading: string;
};

export default function FormHeader({
  icon = META_ICONS.travelerIcon,
  heading,
  subHeading,
}: formHeaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <CircleBadge size="lg" bgColor="secondary">
        <SvgIcon size={"xxl"} color="primary" Icon={icon}></SvgIcon>
      </CircleBadge>
      <span className="flex flex-col gap-1 items-center">
        <CustomText  textSize="lg" textVariant="primary">
          {heading}
        </CustomText>
        <CustomText textSize="sm" as="h2" className="leading-none">
          {subHeading}
        </CustomText>
      </span>
    </div>
  );
}
