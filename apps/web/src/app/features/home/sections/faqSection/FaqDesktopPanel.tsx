import type { InfoItem } from "@/types/Ui";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";
import FaqCtaLink from "./FaqCtaLink";

type FaqDesktopPanelProps = {
  items: InfoItem[];
  openIndex: number;
  onSelect: (index: number) => void;
};

export default function FaqDesktopPanel({
  items,
  openIndex,
  onSelect,
}: FaqDesktopPanelProps) {
  const selectedItem = items[openIndex] ?? items[0];

  return (
    <div className="hidden w-full max-w-5xl gap-5 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
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
            <span className="mb-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-500">
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
