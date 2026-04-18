import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { InfoItem, InfoItemsProps, Tag } from "@/types/Ui";
import SectionItem from "./SectionItem";
import SvgIcon from "@/components/ui/SvgIcon";
import SectionContainer from "./SectionContainer1";
import { DEFAULT_VARIANT, tagToVariant } from "@/app/Mapper";

// Displays icon + text items for Safety and Benefits sections

export default function InfoList({ items }: InfoItemsProps) {
  const senderBenefits = items.filter((item) => item.tag === "sender");
  const travelerBenefits = items.filter((item) => item.tag === "traveler");
  return (
    <SectionContainer>
      <InfoItems items={senderBenefits} tag={"sender"} />
      <InfoItems items={travelerBenefits} tag={"traveler"} />
    </SectionContainer>
  );
}

function InfoItems({ items, tag }: { items: InfoItem[]; tag: Tag }) {
  const variant = tag ? tagToVariant[tag] : DEFAULT_VARIANT;
  return (
    <div>
      <CustomText
        as="h2"
        textVariant="primary"
        textSize="xl"
        className="font-medium pb-6"
      >
        {tag.substring(0, 1).toLocaleUpperCase() + tag.substring(1)}
      </CustomText>

      {items.map((item, index) => {
        return (
          <SectionItem
            key={index}
            icon={
              <CircleBadge size="lg" bgColor={variant}>
                {item.Icon ? (
                  <SvgIcon size="lg" Icon={item.Icon} color={variant} />
                ) : (
                  <CustomText textVariant={variant} textSize="md">
                    {index + 1}
                  </CustomText>
                )}
              </CircleBadge>
            }
            label={
              <CustomText
                as="h4"
                textVariant="primary"
                textSize="lg"
                className="font-medium"
              >
                {item.label}
              </CustomText>
            }
            description={
              <CustomText
                as="p"
                textSize="sm"
                className="max-w-full sm:max-w-[36ch]"
              >
                {item.value}
              </CustomText>
            }
          />
        );
      })}
    </div>
  );
}
