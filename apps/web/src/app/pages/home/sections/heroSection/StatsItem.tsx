import { CicleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";

type Stat = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
};

type StatProps = {
  stat: Stat;
};

export function StatItem({ stat }: StatProps) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <CicleBadge bgColor="neutral" size="lg">
          <SvgIcon size="lg" Icon={stat.Icon} color="neutral" />
        </CicleBadge>
        <CustomText as="h4" className="text-[17px]">
          {stat.label}
        </CustomText>
      </div>

      <CustomText as="p" textSize="md" textVariant="neutral" className="pl-12">
        {stat.value}
      </CustomText>
    </section>
  );
}
