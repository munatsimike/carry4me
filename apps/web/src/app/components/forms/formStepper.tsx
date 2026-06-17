import { AnimatePresence, motion } from "framer-motion";
import { Minus } from "lucide-react";
import CustomText from "@/components/ui/CustomText";
import { cn } from "@/app/lib/cn";

export type Step = 1 | 2 | 3 | 4;
export type FormType = "trip" | "parcel";
const tripSteps = [
  { id: 1, title: "Route & date" },
  { id: 2, title: "Goods & price" },
];

const parcelSteps = [
  { id: 1, title: "Route & goods" },
  { id: 2, title: "Goods list" },
  { id: 3, title: "Weight & price" },
];
export function ReviewDetailsHeader() {
  return (
    <CustomText
      as="h2"
      textSize="lg"
      className="font-medium text-ink-primary"
    >
      Review details
    </CustomText>
  );
}

export function StepHeader({
  currentStep,
  formType = "trip",
  className,
  onStepSelect,
}: {
  currentStep: Step;
  formType?: FormType;
  className?: string;
  onStepSelect?: (step: Step) => void;
}) {
  const steps = formType === "trip" ? tripSteps : parcelSteps;
  const step = steps[Math.min(currentStep, steps.length) - 1];

  return (
    <div className={cn("flex sm:justify-between items-center overflow-x-hidden", className)}>
      {/* Left: Step text */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="inline-flex text-sm  sm:text-base h-6 items-center justify-center text-neutral-600 whitespace-nowrap">
          Step {Math.min(currentStep, steps.length)} of {steps.length}
        </span>
        <Minus className="text-neutral-400" />
        <div className="relative overflow-hidden min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-md sm:text-lg text-ink-primary flex justify-center items-center font-medium whitespace-nowrap"
              title={step.title}
            >
              {step.title}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-row items-center gap-2 shrink-0">
        {steps.map((s) => {
          const n = s.id as Step;
          const isComplete = n < currentStep;
          const isCurrent = n === currentStep;

          if (isComplete && onStepSelect) {
            return (
              <button
                key={n}
                type="button"
                onClick={() => onStepSelect(n)}
                aria-label={`Go back to ${s.title}`}
                className="h-2 w-2 rounded-full bg-emerald-500 transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
              />
            );
          }

          return (
            <motion.span
              animate={{
                scale: isCurrent ? 1.15 : 1,
                opacity: isCurrent ? 1 : 0.5,
              }}
              key={n}
              layout
              className={cn(
                "h-2 w-2 rounded-full",
                isCurrent ? "bg-primary-500 scale-110" : "bg-slate-400",
              )}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          );
        })}
      </div>
    </div>
  );
}
