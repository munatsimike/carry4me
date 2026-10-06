import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import {
  TRIP_CAPACITY_UNITS,
  type TripCapacityUnit,
} from "@/app/features/trips/domain/tripCapacityUnit";

const OPTIONS: { id: TripCapacityUnit; label: string }[] = [
  { id: TRIP_CAPACITY_UNITS.KG, label: "Kg" },
  { id: TRIP_CAPACITY_UNITS.BAG, label: "Bags" },
];

type CapacityUnitToggleProps = {
  value: TripCapacityUnit;
  onChange: (unit: TripCapacityUnit) => void;
  /** Pass an empty string to hide the heading. */
  label?: string;
};

export function CapacityUnitToggle({
  value,
  onChange,
  label = "Available weight",
}: CapacityUnitToggleProps) {
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <CustomText textSize="sm" textVariant="label">
          {label}
        </CustomText>
      ) : null}
      <div
        role="tablist"
        aria-label={label || "Kilograms or bags"}
        className="inline-flex w-fit rounded-lg border border-neutral-200 bg-neutral-50 p-0.5"
      >
        {OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                selected
                  ? "bg-white text-ink-primary shadow-sm"
                  : "text-neutral-500 hover:text-ink-primary",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
