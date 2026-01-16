import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import SectionContainer from "../SectionContainer";

export default function TrustAndSafety({ items }: InfoItemsProps) {
  return (
    <DefaultContainer className="flex flex-col">
      <div className="flex itmes-center justify-center mb-8 md:mb-10">
        <CustomText as="h2" textVariant="primary" textSize="xxl">
          Trust and Safety
        </CustomText>
      </div>

      <SectionContainer items={items} />
    </DefaultContainer>
  );
}
