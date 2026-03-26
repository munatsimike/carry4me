import { ArrowUpDown, Funnel } from "lucide-react";


type MobileFilterOptionsProps = {
  hasActiveFilters: boolean;
  onFilter: () => void;
  onSort?: () => void;
  onClear?: () => void;
};

export default function MobileFilterOptions({
  hasActiveFilters,
  onFilter,
  onSort,
  onClear,
}: MobileFilterOptionsProps) {
  const buttonStyle =
    "px-3 py-1 rounded-full border border-neutral-300 text-sm text-ink-primary flex items-center gap-1 bg-white";

  return (
    <div className="flex items-center gap-3 w-full bg-white">
      <button type="button" onClick={onFilter} className={buttonStyle}>
        <Funnel size={15} className="text-neutral-500" />
        Filter
      </button>

      <button type="button" onClick={onSort} className={buttonStyle}>
        <ArrowUpDown size={15} className="text-neutral-500" />
        Sort
      </button>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-blue-600"
        >
          Clear
        </button>
      )}
    </div>
  );
}