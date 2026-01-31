import type { InfoItemsProps } from "@/types/Ui";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SectionTitle, { Subtitle } from "../SectionTitle";
import InfoList from "../SectionItems";

export default function FaqSection({ items }: InfoItemsProps) {
  return (
    <DefaultContainer>
      <>
        <SectionTitle title="Frequently asked questions" />
        <Subtitle/>
      </>

      <InfoList items={items} />
    </DefaultContainer>
  );
}
