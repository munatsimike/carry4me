import { cn } from "@/app/lib/cn";
import type { ReactNode } from "react";

type StickyMobileFiltersProps = {
  visible: boolean;
  children: ReactNode;
};

export function StickyMobileFilters({
  visible,
  children,
}: StickyMobileFiltersProps) {
  return (
    <div className="sticky top-[50px] z-40 bg-white px-4">
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          visible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className="py-2"
            aria-hidden={!visible}
            inert={!visible}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
