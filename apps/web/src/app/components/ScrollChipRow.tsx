import CustomText from "@/components/ui/CustomText";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

export default function ScrollChipRow({
  label,
  items: items,
}: {
  label: string;
  items: string[] | string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  return (
    <span className="flex gap-3 min-w-0 w-full items-start">
      <CustomText
        as="span"
        textSize="sm"
        textVariant="neutral"
        className="leading-tight shrink-0"
      >
        {label}
      </CustomText>

      {Array.isArray(items) && (
        <div className="group relative min-w-0 flex-1">
          <div
            ref={scrollRef}
            className="flex gap-2 min-w-0 overflow-x-auto whitespace-nowrap scroll-smooth scrollbar-hide pr-10"
          >
            {items.map((t) => (
              <span
                key={t}
                className="inline-flex shrink-0 bg-neutral-100 rounded-full px-2 py-[2px] border border-neutral-200"
              >
                <CustomText
                  as="span"
                  textVariant="primary"
                  textSize="xsm"
                  className="leading-tight"
                >
                  {t}
                </CustomText>
              </span>
            ))}
          </div>

          {items.length > 2 && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-white to-transparent opacity-100 group-hover:opacity-0 transition-opacity" />
              <button
                type="button"
                onClick={() => scrollByAmount(-120)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-600" />
              </button>

              <button
                type="button"
                onClick={() => scrollByAmount(120)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4 text-neutral-600" />
              </button>
            </>
          )}
        </div>
      )}
    </span>
  );
}
