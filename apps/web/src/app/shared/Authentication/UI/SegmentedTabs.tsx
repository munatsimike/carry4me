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

export function HorizontalMenu<T extends string>({
  selectedTab,
  setTab,
  tabs,
}: SegmentedTabsProps<T>) {
  return (
    <div className="flex justify-center w-full">
      <div className="sm:hidden overflow-x-auto scrollbar-hide">
        <div className="flex w-max gap-2 px-1 py-1">
          {tabs.map((item) => {
            const isActive = selectedTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative whitespace-nowrap rounded-full border px-4 py-0.5 sm:py-2 text-sm font-medium transition-colors duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
                  isActive
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700",
                )}
              >
                <span className="relative z-10 inline-flex items-center gap-2">
                  <span>{item.label}</span>
                  {typeof item.count === "number" && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-xs",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-neutral-100 text-neutral-600",
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
      </div>

      <div className="hidden sm:inline-flex overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {tabs.map((item, index) => {
          const isActive = selectedTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "relative min-w-[95px] px-4 py-0.5 sm:py-2 text-sm font-medium",
                "border-r border-neutral-200 last:border-r-0",
                "transition-colors duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200",
                isActive
                  ? "text-white"
                  : "bg-white text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="active-segment"
                  className={cn(
                    "absolute inset-0 border bg-primary-500",
                    index === 0
                      ? "rounded-l-2xl"
                      : index === tabs.length - 1
                        ? "rounded-r-2xl"
                        : "",
                  )}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <span className="relative z-10 inline-flex items-center gap-2">
                <span>{item.label}</span>
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs",
                      isActive
                        ? "bg-white/30 text-white"
                        : "bg-neutral-100 text-neutral-600",
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
    </div>
  );
}
