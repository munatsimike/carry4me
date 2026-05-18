import type { InfoItemsProps } from "@/types/Ui";
import DefaultContainer from "@/components/ui/DefualtContianer";
import SectionTitle from "../SectionTitle";
import CustomText from "@/components/ui/CustomText";
import { useState } from "react";

export default function FaqSection({ items }: InfoItemsProps) {
  const [openIndex, setOpenIndex] = useState(0);
  const selectedItem = items[openIndex] ?? items[0];

  return (
    <DefaultContainer className="py-8 sm:py-10">
      <SectionTitle title="Frequently asked questions" />

      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
        <div className="flex flex-col gap-2">
          {items.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setOpenIndex(index)}
                className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                  isOpen
                    ? "border-primary-200 bg-primary-50/70"
                    : "border-slate-200 bg-white hover:border-primary-100 hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      isOpen ? "bg-primary-500" : "bg-slate-300"
                    }`}
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

            <div className="mt-6 rounded-2xl bg-primary-50 px-4 py-3">
              <p className="text-sm text-primary-700">
                Still unsure? Start by browsing current parcels and trips to see
                how requests work.
              </p>
            </div>
          </div>
        )}
      </div>
    </DefaultContainer>
  );
}
