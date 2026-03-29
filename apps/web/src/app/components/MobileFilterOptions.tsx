import { Funnel } from "lucide-react";
import { cn } from "../lib/cn";

type MobileFilterOptionsProps = {
  hasActiveFilters: boolean;
  onFilter: () => void;
  onClear: () => void;
};

export default function MobileFilterOptions({
  hasActiveFilters,
  onFilter,
  onClear,
}: MobileFilterOptionsProps) {
  const buttonStyle = `px-3 py-1 rounded-full text-sm  flex items-center gap-1`;
  return (
    <div className="flex items-center gap-3 w-full bg-white">
      <button
        type="button"
        onClick={onFilter}
        className={cn(
          "border bg-white text-ink-primary",
          hasActiveFilters ? "border-primary-500" : "border-neutral-300",
          buttonStyle,
        )}
      >
        <Funnel size={15} className="text-neutral-500" />
        Filters
      </button>
      {
        <button
          type="button"
          onClick={onClear}
          className={cn(
            hasActiveFilters
              ? "border bg-primary-50 border-primary-100 shadow-sm hover:bg-primary-300"
              : "border text-neutral-500 border-neutral-300",
            buttonStyle,
          )}
        >
          Clear
        </button>
      }
    </div>
  );
}
