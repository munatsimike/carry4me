import { AnimatePresence, motion } from "framer-motion";

export type Step = 1 | 2;

const steps = [
  { id: 1, title: "Route & date" },
  { id: 2, title: "Goods & price" },
];

export function StepHeader({ currentStep }: { currentStep: 1 | 2 }) {
  const step = steps[currentStep - 1];

  return (
    <div className="flex justify-between items-center">
      {/* Left: Step text */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="inline-flex text-sm h-6 items-center justify-center text-neutral-500">
          Step {currentStep} of {steps.length}
        </span>

        <div className="relative overflow-hidden min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step.id}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="text-sm text-ink-primary bg-primary-50 border border-primary-100  rounded-full px-2 p-1"
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
