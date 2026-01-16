import CustomText from "@/components/ui/CustomText";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SectionContainer from "../SectionContainer";
import type { InfoItemsProps } from "@/types/Ui";

export default function Benefits({ items }: InfoItemsProps) {
  return (
    <DefaultContainer className="flex flex-col" outerClassName="bg-primary-50">
      <div className="flex itmes-center justify-center mb-8 md:mb-10">
        <CustomText as="h2" textVariant="primary" textSize="xxl">
          Benefits for Senders and Travelers
        </CustomText>
      </div>

      <SectionContainer items={items} />
    </DefaultContainer>
  );
}
