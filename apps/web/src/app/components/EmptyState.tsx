import CustomText from "@/components/ui/CustomText";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex max-w-md flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm"
      >
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
            className="flex justify-center text-neutral-400"
          >
            {icon}
          </motion.div>
        )}

        <motion.h3
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="text-lg font-semibold text-neutral-800"
        >
          {title}
        </motion.h3>

        {description && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.25 }}
          >
            <CustomText as="p">{description}</CustomText>
          </motion.div>
        )}

        {action && <div className="mt-2">{action}</div>}
      </motion.div>
    </div>
  );
}
