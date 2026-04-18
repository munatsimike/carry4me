import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import SectionTitle from "../SectionTitle";
import SectionContainer from "../SectionContainer1";
import SectionItem from "../SectionItem";
import { CircleBadge } from "@/components/ui/CircleBadge";
import CustomText from "@/components/ui/CustomText";
import SvgIcon from "@/components/ui/SvgIcon";

export default function TrustAndSafety({ items }: InfoItemsProps) {
  const variant = "primary";
  return (
    <DefaultContainer className="flex flex-col">
      <SectionTitle title="Trust and Safety" />
      <SectionContainer>
        {items.map((item, index) => {
          return (
            <SectionItem
              key={index}
              icon={
                <CircleBadge size="lg" bgColor={variant}>
                  <SvgIcon size="lg" Icon={item.Icon!} color={variant} />
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
      </SectionContainer>
    </DefaultContainer>
  );
}