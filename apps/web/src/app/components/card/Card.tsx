import { motion, useReducedMotion } from "framer-motion";

type CardEnterAnimation = "scale" | "fadeUp";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  borderClass?: string;
  enableHover?: boolean;
  animateOnMount?: boolean;
  enterAnimation?: CardEnterAnimation;
  paddingClass?: string;
  shadowClass?: string;
  sizeClass?: string;
};

const enterMotion = {
  scale: {
    initial: { scale: 0.97, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.18, ease: "easeOut" as const },
  },
  fadeUp: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Card({
  children,
  className,
  enableHover = true,
  animateOnMount = true,
  enterAnimation = "scale",
  sizeClass = "max-w-md",
  paddingClass = "p-5",
  borderClass = "border border-slate-200",
  cornerRadiusClass = "rounded-3xl",
  shadowClass = "shadow-sm",
}: CardProps) {
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimateEnter = animateOnMount && !shouldReduceMotion;
  const shouldAnimateHover = enableHover && !shouldReduceMotion;
  const motionPreset = enterMotion[enterAnimation];
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
      initial={shouldAnimateEnter ? motionPreset.initial : false}
      animate={motionPreset.animate}
      whileHover={
        shouldAnimateHover
          ? { scale: 1.01, y: -3 }
          : undefined
      }
      transition={motionPreset.transition}
      className={cardClassName}
    >
      {children}
    </motion.div>
  );
}
