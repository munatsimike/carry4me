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
        className="flex max-w-md flex-col rounded-3xl bg-white px-6 py-4 shadow-sm"
      >
        <div className="flex flex-col gap-4">
          {icon ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
              className="flex justify-center text-neutral-400"
            >
              {icon}
            </motion.div>
          ) : null}

          <div className="flex flex-col gap-3">
            <motion.h3
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              className="text-lg font-medium text-neutral-800"
            >
              {title}
            </motion.h3>

            {description ? (
              <CustomText as="p" className="leading-snug">
                {description}
              </CustomText>
            ) : null}
          </div>
        </div>

        {action ? <div className="mt-4">{action}</div> : null}
      </motion.div>
    </div>
  );
}
