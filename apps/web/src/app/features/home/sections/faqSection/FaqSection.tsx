import type { InfoItem, InfoItemsProps } from "@/types/Ui";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SectionTitle from "../SectionTitle";
import { useMediaQuery } from "@/app/shared/Authentication/UI/hooks/useMediaQuery";
import { useState } from "react";
import FaqMobileAccordion from "./FaqMobileAccordion";
import CustomText from "@/components/ui/CustomText";
import FaqCtaLink from "./FaqCtaLink";
import { cn } from "@/app/lib/cn";

export default function FaqSection({ items }: InfoItemsProps) {
  const isMobile = useMediaQuery();
  const [mobileOpenIndex, setMobileOpenIndex] = useState(0);
  const [desktopOpenIndex, setDesktopOpenIndex] = useState(0);

  const handleMobileToggle = (index: number) => {
    setMobileOpenIndex((current) => (current === index ? -1 : index));
  };

  return (
    <DefaultContainer className="py-8 sm:py-10">
      <SectionTitle title="Frequently asked questions" />

      {isMobile ? (
        <FaqMobileAccordion
          items={items}
          openIndex={mobileOpenIndex}
          onToggle={handleMobileToggle}
        />
      ) : (
        <FaqDesktopPanel
          items={items}
          openIndex={desktopOpenIndex}
          onSelect={setDesktopOpenIndex}
        />
      )}
    </DefaultContainer>
  );
}

type FaqDesktopPanelProps = {
  items: InfoItem[];
  openIndex: number;
  onSelect: (index: number) => void;
};

function faqTagClass(tag: string): string {
  const normalized = tag.trim().toLowerCase();
  if (normalized === "traveler") {
    return "border border-primary-100 bg-primary-50 text-primary-500";
  }
  if (normalized === "sender") {
    return "border border-purple-100 bg-purple-50 text-purple-500";
  }
  return "bg-slate-100 text-slate-500";
}

 function FaqDesktopPanel({
  items,
  openIndex,
  onSelect,
}: FaqDesktopPanelProps) {
  const selectedItem = items[openIndex] ?? items[0];

  return (
    <div className="grid w-full max-w-5xl grid-cols-[0.9fr_1.1fr] gap-8 mb-6">
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => onSelect(index)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all duration-300",
                isOpen
                  ? "border-primary-200 bg-primary-50/70"
                  : "border-slate-200 bg-white hover:border-primary-100 hover:bg-slate-50",
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    isOpen ? "bg-primary-500" : "bg-slate-300",
                  )}
                />
                <CustomText
                  as="span"
                  textVariant="primary"
                  textSize="sm"
                  className="font-medium"
                >
                  {item.label}
                </CustomText>
              </span>
            </button>
          );
        })}
      </div>

      {selectedItem && (
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {selectedItem.tag && (
            <span
              className={cn(
                "mb-4 inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize",
                faqTagClass(selectedItem.tag),
              )}
            >
              {selectedItem.tag}
            </span>
          )}
          <CustomText
            as="h3"
            textVariant="primary"
            textSize="xl"
            className="font-medium"
          >
            {selectedItem.label}
          </CustomText>
          <CustomText
            as="p"
            textVariant="secondary"
            textSize="sm"
            className="pt-3 leading-relaxed"
          >
            {selectedItem.value}
          </CustomText>

          <FaqCtaLink className="mt-6" />
        </div>
      )}
    </div>
  );
}