import DefaultContainer from "@/components/ui/DefualtContianer";
import type { InfoItemsProps } from "@/types/Ui";
import InfoList from "../SectionItems";
import SectionTitle from "../SectionTitle";

export default function TrustAndSafety({ items }: InfoItemsProps) {
  return (
    <DefaultContainer className="flex flex-col">
      <SectionTitle title="Trust and Safety" />

      <InfoList items={items} />
    </DefaultContainer>
  );
}
