import type { InfoItem } from "@/types/Ui";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import { ChevronDown } from "lucide-react";
import FaqCtaLink from "./FaqCtaLink";

type FaqMobileAccordionProps = {
  items: InfoItem[];
  openIndex: number;
  onToggle: (index: number) => void;
};

export default function FaqMobileAccordion({
  items,
  openIndex,
  onToggle,
}: FaqMobileAccordionProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onToggle(index)}
            aria-expanded={isOpen}
            className={cn(
              "rounded-3xl border bg-white p-4 text-left shadow-sm transition-all duration-300 sm:p-5",
              isOpen
                ? "border-primary-200 shadow-md"
                : "border-slate-200 hover:border-primary-200 hover:shadow-md",
            )}
          >
            <span className="flex items-start justify-between gap-4">
              <span className="flex min-w-0 flex-col gap-1">
                {item.tag && (
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-500">
                    {item.tag}
                  </span>
                )}
                <CustomText
                  as="h3"
                  textVariant="primary"
                  textSize="lg"
                  className="font-medium"
                >
                  {item.label}
                </CustomText>
              </span>
              <ChevronDown
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
                aria-hidden
              />
            </span>

            <span
              className={cn(
                "grid transition-all duration-300",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <span className="overflow-hidden">
                <CustomText
                  as="p"
                  textVariant="secondary"
                  textSize="sm"
                  className="pt-3 leading-relaxed"
                >
                  {item.value}
                </CustomText>
              </span>
            </span>
          </button>
        );
      })}

      <FaqCtaLink className="mt-1" />
    </div>
  );
}
