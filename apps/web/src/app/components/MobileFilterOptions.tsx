import { Funnel, Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { Link } from "react-router-dom";

type MobileFilterOptionsProps = {
  hasActiveFilters: boolean;
  onFilter: () => void;
  onClear: () => void;
};

export default function Toolbar({
  hasActiveFilters,
  onFilter,
  onClear,
}: MobileFilterOptionsProps) {
  const buttonStyle = `px-3 py-1 rounded-full text-sm  flex items-center gap-1`;
  return (
    <>
      <div className="flex items-center gap-3 w-full bg-white pt-1">
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

      <Link
        to="/create-trip?mode=create"
        className="fixed bottom-20 right-4 sm:hidden z-50"
      >
        <button className="w-10 h-10 flex items-center justify-center bg-primary-500 text-white rounded-full shadow-lg active:scale-95 transition">
          <Plus />
        </button>
      </Link>
    </>
  );
}
