import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import InfoList from "../SectionItems";
import SectionTitle from "../SectionTitle";

export default function Benefits({ items }: InfoItemsProps) {
  return (
    <DefaultContainer className="flex flex-col py-8 sm:py-10" outerClassName="bg-canvas">
      <SectionTitle title="Benefits for senders and travelers" />
      <InfoList items={items} />
    </DefaultContainer>
  );
}
