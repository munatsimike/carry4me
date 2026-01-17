import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import InfoList from "../SectionItems";
import SectionTitle, { Subtitle } from "../SectionTitle";

export default function Benefits({ items }: InfoItemsProps) {
  return (
    <DefaultContainer className="flex flex-col" outerClassName="bg-primary-50">
      <>
        <SectionTitle title="Benefits for Senders and Travelers" />
        <Subtitle />
      </>

      <InfoList items={items} />
    </DefaultContainer>
  );
}
