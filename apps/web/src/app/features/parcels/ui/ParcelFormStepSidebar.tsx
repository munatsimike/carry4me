import { cn } from "@/app/lib/cn";
import CustomText from "@/components/ui/CustomText";
import type { Step } from "@/app/components/forms/formStepper";
import { Check } from "lucide-react";

const STEPS = [
  { id: 1 as const, title: "Route & goods", description: "Where it goes and what type" },
  { id: 2 as const, title: "Goods list", description: "Items, quantity, size, and condition" },
  { id: 3 as const, title: "Weight & budget", description: "Parcel weight and budget per kg" },
  { id: 4 as const, title: "Review", description: "Confirm and post" },
];

type ParcelFormStepSidebarProps = {
  currentStep: Step;
  mode: "create" | "edit";
  onStepSelect?: (step: Step) => void;
};

export default function ParcelFormStepSidebar({
  currentStep,
  mode,
  onStepSelect,
}: ParcelFormStepSidebarProps) {
  const visibleSteps =
    mode === "edit" ? STEPS.filter((step) => step.id !== 4) : STEPS;

  return (
    <nav
      aria-label="Post parcel progress"
      className="hidden lg:flex lg:flex-col lg:gap-1"
    >
      {visibleSteps.map((step) => {
        const isComplete = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isClickable = isComplete && !!onStepSelect;

        const content = (
          <>
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isCurrent
                  ? "bg-primary-600 text-white"
                  : isComplete
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-neutral-100 text-neutral-500",
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" strokeWidth={2.5} />
              ) : (
                step.id
              )}
            </span>
            <div className="min-w-0">
              <CustomText
                textSize="sm"
                textVariant={isCurrent ? "primary" : "secondary"}
                className={cn(isCurrent && "font-medium")}
              >
                {step.title}
              </CustomText>
              <CustomText textSize="xs" textVariant="secondary" className="mt-0.5">
                {step.description}
              </CustomText>
            </div>
          </>
        );

        if (isClickable) {
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect(step.id)}
              className={cn(
                "flex w-full gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                "border-neutral-200 bg-white hover:border-primary-200 hover:bg-neutral-50",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2",
              )}
            >
              {content}
            </button>
          );
        }

        return (
          <div
            key={step.id}
            className={cn(
              "flex gap-3 rounded-xl border px-4 py-3 transition-colors",
              isCurrent
                ? "border-primary-200 bg-primary-50/80"
                : "border-transparent",
            )}
          >
            {content}
          </div>
        );
      })}
    </nav>
  );
}
