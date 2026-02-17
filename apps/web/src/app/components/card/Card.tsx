import { motion, scale, useReducedMotion } from "framer-motion";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  borderClass?: string;
  hover?: boolean;
  paddingClass?: string;
  shadowClass?: string;
};

export function Card({
  children,
  className,
  hover = true,
  paddingClass = "p-5",
  borderClass = "border border-neutral-200",
  cornerRadiusClass = "rounded-2xl",
  shadowClass = "shadow-sm",
}: CardProps) {
  const shouldReduceMotion = useReducedMotion();
  const hoverClass = hover
    ? "transition-shadow transition-colors duration-200 hover:border-primary-400"
    : "";

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={[
        "bg-white",
        shadowClass,
        paddingClass,
        cornerRadiusClass,
        borderClass,
        hoverClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}
