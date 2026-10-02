import { motion, useReducedMotion } from "framer-motion";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  borderClass?: string;
  enableHover?: boolean;
  animateOnMount?: boolean;
  paddingClass?: string;
  shadowClass?: string;
  sizeClass?: string;
};

export function Card({
  children,
  className,
  enableHover = true,
  animateOnMount = true,
  sizeClass = "max-w-md",
  paddingClass = "p-5",
  borderClass = "border border-slate-200",
  cornerRadiusClass = "rounded-3xl",
  shadowClass = "shadow-sm",
}: CardProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimateEnter = animateOnMount && !shouldReduceMotion;
  const shouldAnimateHover = enableHover && !shouldReduceMotion;
  const cardClassName = [
    "w-full min-w-0 overflow-hidden bg-white",
    shadowClass,
    paddingClass,
    cornerRadiusClass,
    sizeClass,
    borderClass,
    className ?? "",
  ].join(" ");

  if (!shouldAnimateEnter && !shouldAnimateHover) {
    return <div className={cardClassName}>{children}</div>;
  }

  return (
    <motion.div
      initial={shouldAnimateEnter ? { scale: 0.97, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={
        shouldAnimateHover
          ? { scale: 1.01, y: -3 }
          : undefined
      }
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cardClassName}
    >
      {children}
    </motion.div>
  );
}
