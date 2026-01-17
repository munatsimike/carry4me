import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { InfoItemsProps } from "@/types/Ui";
import SectionItem from "./SectionItem";
import SvgIcon from "@/components/ui/SvgIcon";
import SectionContainer from "./SectionContainer1";
import { DEFAULT_VARIANT, tagToVariant } from "@/app/Mapper";

// Displays icon + text items for Safety and Benefits sections

export default function InfoList({ items }: InfoItemsProps) {
  return (
    <SectionContainer>
      {items.map((item, index) => {
        const variant = item.tag ? tagToVariant[item.tag] : DEFAULT_VARIANT;
        const number = Math.floor(index / 2) + 1;

        return (
          <SectionItem
            key={item.label}
            icon={
              <CircleBadge size="lg" bgColor={variant}>
                {item.Icon ? (
                  <SvgIcon size="lg" Icon={item.Icon} color={variant} />
                ) : (
                  <CustomText textVariant={variant} textSize="md">
                    {number}
                  </CustomText>
                )}
              </CircleBadge>
            }
            label={
              <CustomText as="h4" textVariant="primary" textSize="lg">
                {item.label}
              </CustomText>
            }
            description={
              <CustomText as="p" textSize="sm" className="max-w-full sm:max-w-[36ch]">
                {item.value}
              </CustomText>
            }
          />
        );
      })}
    </SectionContainer>
  );
}
