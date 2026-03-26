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
    <motion.section layout className={`${outerClassName} py-4 sm:py-5`}>
      <div
        className={`mx-auto w-full max-w-container px-4 sm:px-5 lg:px-6 ${className ?? ""}`}
      >
        {children}
      </div>
    </motion.section>
  );
}
