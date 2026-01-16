import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { InfoItemsProps } from "@/types/Ui";
import SectionItem from "./SectionItem";
import SvgIcon from "@/components/ui/SvgIcon";

export default function SectionContainer({ items }: InfoItemsProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-x-20 lg:gap-x-40">
      {items.map((item) => (
        <SectionItem
          icon={
            <CircleBadge bgColor="primary" size="lg">
              <SvgIcon size="lg" Icon={item.Icon} />
            </CircleBadge>
          }
          label={
            <CustomText as="h4" textVariant="primary" textSize="lg">
              {item.label}
            </CustomText>
          }
          description={
            <CustomText as="p" textSize="sm" className="max-w-[32ch]">
              {item.value}
            </CustomText>
          }
        />
      ))}
    </section>
  );
}
