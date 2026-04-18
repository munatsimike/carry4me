import type { InfoItemsProps } from "@/types/Ui";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SectionTitle from "../SectionTitle";
import InfoList from "../SectionItems";

export default function FaqSection({ items }: InfoItemsProps) {
  return (
    <DefaultContainer>
      <SectionTitle title="Frequently asked questions" />

      <InfoList items={items} />
    </DefaultContainer>
  );
}
