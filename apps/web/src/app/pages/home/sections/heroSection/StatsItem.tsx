import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";
import type { InfoItem } from "@/types/Ui";

type StatProps = {
  stat: InfoItem;
};

export function StatItem({ stat }: StatProps) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <CircleBadge bgColor="neutral" size="md">
          {stat.Icon && <SvgIcon size="md" Icon={stat.Icon} color="neutral" />}
        </CircleBadge>
        <CustomText as="h4" textSize="sm">
          {stat.label}
        </CustomText>
      </div>

      <CustomText as="p" textSize="md" textVariant="neutral" className="pl-12">
        {stat.value}
      </CustomText>
    </section>
  );
}
