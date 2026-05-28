import { cn } from "@/app/lib/cn";
import { motion } from "framer-motion";

type ContainerProps = {
  children: React.ReactNode;
  className?: string; // inner container
  outerClassName?: string; // full-width section
  center?: boolean;
  id?: string;
};

export default function DefaultContainer({
  children,
  className,
  outerClassName,
  center = false,
  id,
}: ContainerProps) {
  return (
    <motion.section id={id} layout className={`${outerClassName} py-2 sm:py-3`}>
      <div
        className={cn(
          "mx-auto w-full max-w-container px-4 sm:px-5 lg:px-6",
          center && "flex flex-col items-center",
          className,
        )}
      >
        {children}
      </div>
    </motion.section>
  );
}
