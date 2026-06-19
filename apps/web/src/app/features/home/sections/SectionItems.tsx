import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import type { InfoItem, InfoItemsProps, Tag } from "@/types/Ui";
import SectionItem from "./SectionItem";
import SvgIcon from "@/components/ui/SvgIcon";
import SectionContainer from "./SectionContainer1";
import { cn } from "@/app/lib/cn";

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
  const isSender = tag === "sender";
  const badgeBgColor = isSender ? "parcel" : "primary";
  const iconClassName = isSender ? "text-[#475569]" : "text-primary-600";
  const title = tag.substring(0, 1).toLocaleUpperCase() + tag.substring(1);
  return (
    <div>
      <div className="mb-5">
        <CustomText
          as="h3"
          textVariant="primary"
          textSize="xl"
          className="font-medium"
        >
          {title}
        </CustomText>
      </div>

      {items.map((item, index) => {
        return (
          <SectionItem
            key={index}
            icon={
              <CircleBadge size="lg" bgColor={badgeBgColor}>
                {item.Icon ? (
                  <SvgIcon
                    size="lg"
                    Icon={item.Icon}
                    className={iconClassName}
                  />
                ) : (
                  <CustomText
                    as="span"
                    textSize="md"
                    className={cn("font-medium", iconClassName)}
                  >
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
