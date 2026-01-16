import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { InfoItemsProps } from "@/types/Ui";
import SectionItem from "./SectionItem";
import SvgIcon from "@/components/ui/SvgIcon";

export default function SectionContainer({
  items,
  iconCirlce = true,
}: InfoItemsProps) {
  const tagToVariant = {
    sender: "primary",
    traveler: "trip",
  } as const;

  const DEFAULT_VARIANT = "primary" as const;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-x-20 lg:gap-x-32">
      {items.map((item) => {
        const variant = item.tag ? tagToVariant[item.tag] : DEFAULT_VARIANT;
        const icon = <SvgIcon size="lg" Icon={item.Icon} color={variant} />;
        return (
          <SectionItem
            icon={
              iconCirlce ? (
                <CircleBadge size="lg" bgColor={variant}>
                  {icon}
                </CircleBadge>
              ) : (
                icon
              )
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
        );
      })}
    </section>
  );
}
