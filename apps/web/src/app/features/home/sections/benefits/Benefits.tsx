import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import InfoList from "../SectionItems";
import SectionTitle from "../SectionTitle";

export default function Benefits({ items }: InfoItemsProps) {
  return (
    <DefaultContainer className="flex flex-col" outerClassName="bg-canvas">
      <SectionTitle title="Benefits for Senders and Travelers" />
      <InfoList items={items} />
    </DefaultContainer>
  );
}
