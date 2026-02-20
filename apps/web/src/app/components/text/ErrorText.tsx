import { cn } from "@/app/lib/cn";
import { AnimatePresence, motion } from "framer-motion";

type ErrorTextProps = {
  children: React.ReactNode;
  error?: string;
  className?: string;
  classPadding?: string;
};

export default function ErrorText({
  error,
  className,
  children,
}: ErrorTextProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1",
        error && "pb-6", // reserve space when error is visible
      )}
    >
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="dropdown-error"
            className={`absolute left-0 bottom-0 text-sm text-error-500 leading-none ${className}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 35,
            }}
            role="alert"
            aria-live="polite"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
