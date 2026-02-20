import { AnimatePresence, motion } from "framer-motion";
import { Minus } from "lucide-react";

export type Step = 1 | 2;
export type FormType = "trip" | "parcel";
const tripSteps = [
  { id: 1, title: "Route & date" },
  { id: 2, title: "Goods & price" },
];

const parcelSteps = [
  { id: 1, title: "Route & goods" },
  { id: 2, title: "Goods & price" },
];
export function StepHeader({
  currentStep,
  formType = "trip",
}: {
  currentStep: 1 | 2;
  formType?: FormType;
}) {
  const step =
    formType === "trip"
      ? tripSteps[currentStep - 1]
      : parcelSteps[currentStep - 1];

  return (
    <div className="flex justify-between items-center">
      {/* Left: Step text */}
      <div className="flex items-center gap-1 min-w-0">
        <span className="inline-flex text-sm h-6 items-center justify-center text-neutral-600">
          Step {currentStep} of {tripSteps.length}
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
              className="text-md text-neutral-600 flex justify-center items-center"
              title={step.title}
            >
              {step.title}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Right: optional little “2 dots” indicator */}

      
      <div className="flex items-center gap-2 shrink-0">
        {[1, 2].map((n) => (
          <motion.span
            animate={{
              scale: n === currentStep ? 1.15 : 1,
              opacity: n === currentStep ? 1 : 0.5,
            }}
            key={n}
            layout
            className={`h-2 w-2 rounded-full ${
              n === currentStep ? "bg-primary-500 scale-110" : "bg-slate-400"
            }`}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        ))}
      </div>
    </div>
  );
}
