import type { InfoItemsProps } from "@/types/Ui";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SectionTitle from "../SectionTitle";
import { useState } from "react";
import FaqDesktopPanel from "./FaqDesktopPanel";
import FaqMobileAccordion from "./FaqMobileAccordion";

export default function FaqSection({ items }: InfoItemsProps) {
  const [mobileOpenIndex, setMobileOpenIndex] = useState(0);
  const [desktopOpenIndex, setDesktopOpenIndex] = useState(0);

  const handleMobileToggle = (index: number) => {
    setMobileOpenIndex((current) => (current === index ? -1 : index));
  };

  return (
    <DefaultContainer className="py-8 sm:py-10">
      <SectionTitle title="Frequently asked questions" />

      <FaqMobileAccordion
        items={items}
        openIndex={mobileOpenIndex}
        onToggle={handleMobileToggle}
      />

      <FaqDesktopPanel
        items={items}
        openIndex={desktopOpenIndex}
        onSelect={setDesktopOpenIndex}
      />
    </DefaultContainer>
  );
}
