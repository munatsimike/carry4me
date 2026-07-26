import CustomText from "@/components/ui/CustomText";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { CategoryChip } from "./CategoryChip";
import { cn } from "@/app/lib/cn";

export default function ScrollChipRow({
  label,
  items: items,
  trailingAction,
}: {
  label: string;
  items: string[] | string;
  trailingAction?: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollByAmount = (amount: number) => {
    scrollRef.current?.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  };

  return (
    <span className="flex gap-2 min-w-0 w-full items-center">
      <CustomText
        as="span"
        textSize="sm"
        textVariant="neutral"
        className="leading-tight shrink-0"
      >
        {label}
      </CustomText>

      {Array.isArray(items) && (
        <div
          className={cn(
            "group/chips relative min-w-0",
            trailingAction ? "flex-1 max-w-[calc(100%-2.5rem)]" : "flex-1",
          )}
        >
          <div
            ref={scrollRef}
            className="flex gap-2 min-w-0 overflow-x-auto whitespace-nowrap scroll-smooth scrollbar-hide px-2 pr-10"
          >
            {items.map((t) => (
              <motion.span key={t} className="inline-flex shrink-0">
                <CategoryChip>{t}</CategoryChip>
              </motion.span>
            ))}
          </div>

          {items.length > 2 && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent opacity-100 group-hover/chips:opacity-0 transition-opacity" />
              <button
                type="button"
                onClick={() => scrollByAmount(-120)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur opacity-0 group-hover/chips:opacity-100 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4 text-neutral-600" />
              </button>

              <button
                type="button"
                onClick={() => scrollByAmount(120)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur opacity-0 group-hover/chips:opacity-100 transition-opacity"
              >
                <ChevronRight className="h-4 w-4 text-neutral-600" />
              </button>
            </>
          )}
        </div>
      )}

      {trailingAction ? (
        <span className="shrink-0 self-center ml-1">{trailingAction}</span>
      ) : null}
    </span>
  );
}
