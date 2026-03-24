import { motion, scale, useReducedMotion } from "framer-motion";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  cornerRadiusClass?: string;
  borderClass?: string;
   enableHover?:boolean,
  paddingClass?: string;
  shadowClass?: string;
};

export function Card({
  children,
  className,
   enableHover = true,
  paddingClass = "p-5",
  borderClass = "border border-neutral-200",
  cornerRadiusClass = "rounded-3xl",
  shadowClass = "shadow-sm",
}: CardProps) {
   const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { scale: 0.97, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={
        enableHover && !shouldReduceMotion ? { scale: 1.02, y: -0.2 } : undefined
      }
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={[
        "overflow-hidden bg-white",
        shadowClass,
        paddingClass,
        cornerRadiusClass,
        borderClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </motion.div>
  );
}
