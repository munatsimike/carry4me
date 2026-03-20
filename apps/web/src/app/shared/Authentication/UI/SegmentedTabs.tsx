import { cn } from "@/app/lib/cn";
import { motion } from "framer-motion";


export type TabItem<T extends string> = {
  id: T;
  label: string;
  count?: number | null;
};

type SegmentedTabsProps<T extends string> = {
  tabs: TabItem<T>[];
  selectedTab: T;
  setTab: (v: T) => void;
};

export function SegmentedTabs<T extends string>({
  selectedTab,
  setTab,
  tabs,
}: SegmentedTabsProps<T>) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-neutral-200 bg-white">
      {tabs.map((item) => {
        const isActive = selectedTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "relative min-w-[95px] px-4 py-2 text-sm font-medium",
              "border-r border-neutral-200 last:border-r-0",
              "transition-colors duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
              isActive
                ? "text-white"
                : "bg-white text-neutral-400 hover:text-neutral-700"
            )}
          >
            {isActive && (
              <motion.span
                layoutId="active-segment"
                className="absolute inset-0 bg-primary-500 border"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}

            <span className="relative z-10 inline-flex items-center gap-2">
              <span>{item.label}</span>
              {typeof item.count === "number" && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[13px]",
                    isActive ? "bg-white/30 text-white" : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}