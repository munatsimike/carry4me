import { motion } from "framer-motion";

type ContainerProps = {
  children: React.ReactNode;
  className?: string; // inner container
  outerClassName?: string; // full-width section
};

export default function DefaultContainer({
  children,
  className,
  outerClassName,
}: ContainerProps) {
  return (
    <motion.section
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`${outerClassName} py-5 md:py-5`}
    >
      <div className={`mx-auto max-w-container px-4 ${className ?? ""}`}>
        {children}
      </div>
    </motion.section>
  );
}
